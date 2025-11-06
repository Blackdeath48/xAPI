import { randomUUID } from 'node:crypto';

import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { learnerProgress, xapiStatements } from '@/db/schema/progress';

const STATUS_BY_VERB: Record<string, string> = {
  'http://adlnet.gov/expapi/verbs/initialized': 'in-progress',
  'http://adlnet.gov/expapi/verbs/progressed': 'in-progress',
  'http://adlnet.gov/expapi/verbs/answered': 'in-progress',
  'http://adlnet.gov/expapi/verbs/completed': 'completed',
  'http://adlnet.gov/expapi/verbs/passed': 'completed',
  'http://adlnet.gov/expapi/verbs/failed': 'completed',
};

type XApiEvent = {
  id?: string;
  verb?: { id?: string };
  object?: { id?: string };
  result?: {
    score?: { raw?: number; max?: number; min?: number; scaled?: number };
    completion?: boolean;
    success?: boolean;
  };
  timestamp?: string;
  stored?: string;
  [key: string]: unknown;
};

type ProgressPayload = {
  learnerId: string;
  lessonId: string;
  status?: string;
  score?: number | null;
  passed?: boolean | null;
  completion?: number | null;
  xapiEvent?: XApiEvent | null;
};

function deriveStatus(payload: ProgressPayload): string {
  if (payload.status) {
    return payload.status;
  }

  const verbId = payload.xapiEvent?.verb?.id;
  if (verbId && STATUS_BY_VERB[verbId]) {
    return STATUS_BY_VERB[verbId];
  }

  return 'in-progress';
}

function deriveCompletion(payload: ProgressPayload): number | null {
  if (typeof payload.completion === 'number') {
    return Math.min(100, Math.max(0, payload.completion));
  }

  const completion = payload.xapiEvent?.result?.completion;
  if (typeof completion === 'boolean') {
    return completion ? 100 : 0;
  }

  return null;
}

function deriveScore(payload: ProgressPayload): number | null {
  if (typeof payload.score === 'number') {
    return payload.score;
  }

  const resultScore = payload.xapiEvent?.result?.score;
  if (!resultScore) {
    return null;
  }

  if (typeof resultScore.scaled === 'number') {
    return Math.round(resultScore.scaled * 100);
  }

  if (typeof resultScore.raw === 'number' && typeof resultScore.max === 'number') {
    return Math.round((resultScore.raw / resultScore.max) * 100);
  }

  return null;
}

function derivePassed(payload: ProgressPayload): boolean | null {
  if (typeof payload.passed === 'boolean') {
    return payload.passed;
  }

  const success = payload.xapiEvent?.result?.success;
  if (typeof success === 'boolean') {
    return success;
  }

  const status = deriveStatus(payload);
  if (status === 'completed') {
    return true;
  }

  return null;
}

function deriveEventTimestamp(event: XApiEvent | null | undefined): Date {
  const iso = event?.timestamp ?? event?.stored;
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learnerId');
  const lessonId = searchParams.get('lessonId');

  if (!learnerId) {
    return NextResponse.json({ error: 'learnerId is required' }, { status: 400 });
  }

  const progressRows = await db.query.learnerProgress.findMany({
    where: (table, operators) => {
      if (lessonId) {
        return operators.and(
          operators.eq(table.learnerId, learnerId),
          operators.eq(table.lessonId, lessonId),
        );
      }

      return operators.eq(table.learnerId, learnerId);
    },
    with: {
      lesson: true,
    },
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.updatedAt)],
  });

  const statements = await db
    .select()
    .from(xapiStatements)
    .where(
      lessonId
        ? and(
            eq(xapiStatements.learnerId, learnerId),
            eq(xapiStatements.objectId, lessonId),
          )
        : eq(xapiStatements.learnerId, learnerId),
    )
    .orderBy(desc(xapiStatements.recordedAt));

  return NextResponse.json({ progress: progressRows, statements });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ProgressPayload;

  if (!payload.learnerId || !payload.lessonId) {
    return NextResponse.json(
      { error: 'learnerId and lessonId are required' },
      { status: 400 },
    );
  }

  const status = deriveStatus(payload);
  const completion = deriveCompletion(payload);
  const score = deriveScore(payload);
  const passed = derivePassed(payload);
  const eventTimestamp = deriveEventTimestamp(payload.xapiEvent ?? null);
  const statementId = payload.xapiEvent ? payload.xapiEvent.id ?? randomUUID() : null;

  await db.transaction(async (tx) => {
    await tx
      .insert(learnerProgress)
      .values({
        learnerId: payload.learnerId,
        lessonId: payload.lessonId,
        status,
        score,
        passed,
        completion,
        xapiStatementId: statementId,
        lastEventAt: eventTimestamp,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [learnerProgress.learnerId, learnerProgress.lessonId],
        set: {
          status,
          score,
          passed,
          completion,
          xapiStatementId: statementId,
          lastEventAt: eventTimestamp,
          updatedAt: new Date(),
        },
      });

    if (payload.xapiEvent && statementId) {
      await tx
        .insert(xapiStatements)
        .values({
          learnerId: payload.learnerId,
          statementId,
          verb: payload.xapiEvent.verb?.id ?? null,
          objectId: payload.xapiEvent.object?.id ?? null,
          rawEvent: payload.xapiEvent as Record<string, unknown>,
          recordedAt: eventTimestamp,
        })
        .onConflictDoUpdate({
          target: xapiStatements.statementId,
          set: {
            learnerId: payload.learnerId,
            verb: payload.xapiEvent.verb?.id ?? null,
            objectId: payload.xapiEvent.object?.id ?? null,
            rawEvent: payload.xapiEvent as Record<string, unknown>,
            recordedAt: eventTimestamp,
          },
        });
    }
  });

  const progressRecord = await db.query.learnerProgress.findFirst({
    where: (table, { and: andWhere, eq: eqWhere }) =>
      andWhere(eqWhere(table.learnerId, payload.learnerId), eqWhere(table.lessonId, payload.lessonId)),
    with: {
      lesson: true,
    },
  });

  const statementRecord = statementId
    ? await db.query.xapiStatements.findFirst({
        where: (table, { eq: eqWhere }) => eqWhere(table.statementId, statementId),
      })
    : null;

  return NextResponse.json(
    {
      progress: progressRecord,
      statement: statementRecord,
    },
    { status: 201 },
  );
}
