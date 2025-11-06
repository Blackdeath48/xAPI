export type XapiVerb = {
  id: string;
  display?: Record<string, string>;
};

export type XapiObject = {
  id: string;
  definition?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
  };
};

export type XapiResult = {
  response?: string;
  success?: boolean;
  score?: {
    raw?: number;
    min?: number;
    max?: number;
  };
  completion?: boolean;
};

export type XapiStatement = {
  actor: {
    name: string;
    mbox: string;
  };
  verb: XapiVerb;
  object: XapiObject;
  result?: XapiResult;
  timestamp?: string;
};

class XapiClient {
  constructor(private endpoint: string | undefined, private auth?: string) {}

  async recordStatement(statement: XapiStatement): Promise<void> {
    if (!this.endpoint) {
      if (process.env.NODE_ENV !== "production") {
        console.info("xAPI endpoint not configured. Statement:", statement);
      }
      return;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (this.auth) {
      headers.Authorization = this.auth;
    }

    await fetch(`${this.endpoint}/statements`, {
      method: "POST",
      headers,
      body: JSON.stringify(statement)
    });
  }
}

const endpoint = process.env.NEXT_PUBLIC_LRS_ENDPOINT;
const auth = process.env.NEXT_PUBLIC_LRS_AUTH;

export const xapiClient = new XapiClient(endpoint, auth);

export function recordStatement(statement: XapiStatement) {
  return xapiClient.recordStatement(statement);
}
