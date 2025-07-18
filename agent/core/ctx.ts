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
  session_memory?: {
    current_goal?: string;
    selected_client_id?: string;
    selected_session_id?: string;
    pending_proposals?: Array<{
      id: string;
      tool: string;
      args: Record<string, any>;
      reason: string;
    }>;
    user_prefs?: {
      language?: "de" | "en";
      currency?: string;
      default_package?: string;
      preferred_days?: string;
      communication_style?: string;
    };
    notes?: string[];
  };
}

// Forward ref; import after definition to avoid circulars
export type { AgentPolicy } from "./policy";