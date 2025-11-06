import { NextRequest, NextResponse } from 'next/server';
import { ensureDb } from '../../../../lib/initDb';
import { getAdminAnalytics } from '../../../../lib/analytics';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

function buildCsv(data: any) {
  const headers = ['Learner', 'Completion', 'Score'];
  const rows = data.leaderboard.map((entry: any) => [entry.name, entry.completion, entry.score ?? '']);
  const csv = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  return `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
}

function buildPdf(data: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.fontSize(18).fillColor('#001BB7').text('Compliance Training Analytics', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).fillColor('#2C2C2C');
  doc.text(`Total learners: ${data.totalLearners}`);
  doc.text(`Average completion: ${data.averageCompletion.toFixed(1)}%`);
  doc.text(`Average score: ${data.averageScore.toFixed(1)}%`);
  doc.text(`xAPI statements: ${data.totalStatements}`);
  doc.moveDown();
  doc.fontSize(14).fillColor('#0046FF').text('Leaderboard');
  data.leaderboard.forEach((entry: any, idx: number) => {
    doc.fontSize(12).fillColor('#2C2C2C').text(`${idx + 1}. ${entry.name} — ${entry.completion.toFixed(0)}% completion`);
  });
  doc.moveDown();
  doc.fontSize(14).fillColor('#0046FF').text('Course Breakdown');
  data.courseBreakdown.forEach((course: any) => {
    doc.fontSize(12).fillColor('#2C2C2C').text(`${course.title}`);
    doc.text(`Completion: ${course.completion.toFixed(1)}% | Avg Score: ${course.averageScore?.toFixed(1) ?? '—'}% | Time: ${course.timeSpentMinutes.toFixed(1)} min`);
    doc.moveDown(0.5);
  });
  doc.end();
  return new Promise<string>((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(`data:application/pdf;base64,${pdfBuffer.toString('base64')}`);
    });
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || undefined;
  await ensureDb();
  const analytics = await getAdminAnalytics(courseId);
  const csv = buildCsv(analytics);
  const pdf = await buildPdf(analytics);
  return NextResponse.json({ analytics: { ...analytics, complianceExports: { csv, pdf } } });
}
