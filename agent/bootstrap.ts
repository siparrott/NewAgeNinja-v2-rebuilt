// Bootstrap agent system - initialize and configure AI operator
import { loadStudioCreds } from "./integrations/storage-bridge";
import { loadPolicy } from "./core/policy";
import { toolRegistry } from "./core/tools";
import { createLogger } from "./util/logger";
import type { AgentCtx } from "./core/ctx";

const logger = createLogger("bootstrap");

export async function bootstrapAgent(studioId: string, userId: string): Promise<AgentCtx> {
  logger.info("Bootstrapping agent system", { studioId, userId });
  
  try {
    // Load studio credentials and policy
    const [creds, policy] = await Promise.all([
      loadStudioCreds(studioId),
      loadPolicy(studioId),
    ]);
    
    // Get studio name from creds or default
    const studioName = "New Age Fotografie"; // TODO: Get from studio table
    
    const ctx: AgentCtx = {
      studioId,
      studioName,
      userId,
      creds,
      policy,
    };
    
    logger.info("Agent system bootstrapped successfully", {
      studioId,
      studioName,
      mode: policy.mode,
      authorities: policy.authorities,
      toolsAvailable: toolRegistry.list().length,
    });
    
    return ctx;
  } catch (error) {
    logger.error("Failed to bootstrap agent system", error);
    throw error;
  }
}

export async function createAgentContext(studioId: string, userId: string): Promise<AgentCtx> {
  return bootstrapAgent(studioId, userId);
}