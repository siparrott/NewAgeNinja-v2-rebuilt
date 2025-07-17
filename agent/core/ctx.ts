export interface StudioCreds {
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  stripe?: {
    accountId?: string;
    publishable?: string;
    secret?: string;
  };
  openai?: {
    apiKey?: string;
  };
  currency?: string;
}

export interface AgentCtx {
  studioId: string;
  studioName: string;
  userId: string;
  creds: StudioCreds;
  policy: AgentPolicy;
}

// Forward ref; import after definition to avoid circulars
export type { AgentPolicy } from "./policy";