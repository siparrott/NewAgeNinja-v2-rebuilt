// Memory management for CRM agent
export interface WorkingMemory {
  selectedClientId?: string;
  currentGoal?: string;
  preferences?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  studio_id: string;
  user_id: string;
  memory_json: WorkingMemory;
  created_at: string;
  updated_at: string;
}

// In-memory session storage (for demo - replace with database in production)
const sessions: Map<string, ChatSession> = new Map();

export async function loadSession(studioId: string, userId: string): Promise<ChatSession> {
  const sessionKey = `${studioId}-${userId}`;
  
  // Check if session already exists
  let session = sessions.get(sessionKey);
  
  if (!session) {
    // Create new session
    session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      studio_id: studioId,
      user_id: userId,
      memory_json: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    sessions.set(sessionKey, session);
  }
  
  return session;
}

export async function updateSession(sessionId: string, memory: WorkingMemory): Promise<void> {
  // Update session in storage
  for (const [key, session] of sessions.entries()) {
    if (session.id === sessionId) {
      session.memory_json = { ...session.memory_json, ...memory };
      session.updated_at = new Date().toISOString();
      sessions.set(key, session);
      break;
    }
  }
}