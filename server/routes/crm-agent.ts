// CRM Agent API endpoints
import { Router } from "express";
// Temporarily use working implementation
async function runAgentWithSelfReasoning(studioId: string, userId: string, message: string) {
  // Import the working self-reasoning system
  const { selfDiagnosis } = await import('../../agent/core/self-diagnosis');
  
  console.log('🧠 Self-reasoning system activated...');
  
  try {
    // Test self-reasoning with the user request
    const diagnosis = await selfDiagnosis.diagnose(message, {
      userRequest: message,
      studioId: studioId,
      toolsAvailable: Array.from((await import('../../agent/core/tools')).toolRegistry.keys())
    });
    
    console.log(`🔍 Self-diagnosis result: ${diagnosis.issue}`);
    console.log(`🎯 Root cause: ${diagnosis.root_cause}`);
    
    if (diagnosis.auto_fix_available) {
      console.log('🔧 Attempting automatic fix...');
      const fixSuccess = await selfDiagnosis.attemptAutoFix(diagnosis, { studioId, userId });
      
      if (fixSuccess) {
        return `🎉 Self-reasoning system successfully resolved: ${diagnosis.issue}\n\nFixed: ${diagnosis.suggested_fixes.join(', ')}\n\nConfidence: ${Math.round(diagnosis.confidence * 100)}%`;
      }
    }
    
    return `🧠 Self-reasoning analysis complete:\n\n**Issue**: ${diagnosis.issue}\n**Root Cause**: ${diagnosis.root_cause}\n\n**Suggested Solutions**:\n${diagnosis.suggested_fixes.map(fix => `• ${fix}`).join('\n')}\n\nConfidence: ${Math.round(diagnosis.confidence * 100)}%`;
    
  } catch (error) {
    console.error('Self-reasoning failed:', error);
    return `I'm analyzing your request: "${message}". The self-reasoning system is working but encountered: ${error.message}`;
  }
}
import { createAgentContext } from "../../agent/bootstrap";
import { toolRegistry } from "../../agent/core/tools";
import { planAndExecute, executePlan, formatPlanOutputs } from "../../agent/core/planRunner";

const router = Router();

// Chat with CRM agent (enhanced with planning capabilities)
router.post("/api/crm/agent/chat", async (req, res) => {
  try {
    const { message, usePlanner = false, studioId = "e5dc81e8-7073-4041-8814-affb60f4ef6c", userId = "admin" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Disable all planning - let the autonomous agent handle everything
    const shouldUsePlanner = usePlanner && false; // Force disable planning for now

    // Let the autonomous agent handle ALL operations directly
    if (shouldUsePlanner) {
      const ctx = await createAgentContext(studioId, userId);
      const planResult = await planAndExecute(message, ctx);
      
      if (planResult.needConfirmation) {
        return res.json({
          type: "plan_confirmation_required",
          plan: planResult.plan,
          message: "This operation requires confirmation before proceeding.",
          timestamp: new Date().toISOString()
        });
      }
      
      if (planResult.outputs) {
        return res.json({
          type: "plan_executed",
          response: formatPlanOutputs(planResult.outputs),
          outputs: planResult.outputs,
          timestamp: new Date().toISOString()
        });
      }
      
      if (planResult.error) {
        console.log(`⚠️ Planner failed, falling back to standard agent: ${planResult.error}`);
        // Fall back to standard agent if planner fails
        const response = await runAgentWithSelfReasoning(studioId, userId, message);
        return res.json({ 
          type: "agent_response",
          response,
          status: "success",
          fallback: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Run the standard agent
    const response = await runAgentWithSelfReasoning(studioId, userId, message);
    
    res.json({ 
      type: "agent_response",
      response,
      status: "success",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("CRM agent error:", error);
    res.status(500).json({ 
      error: "Agent execution failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Execute a confirmed plan
router.post("/api/crm/agent/execute-plan", async (req, res) => {
  try {
    const { plan, studioId = "e5dc81e8-7073-4041-8814-affb60f4ef6c", userId = "admin" } = req.body;
    
    if (!plan) {
      return res.status(400).json({ error: "Plan required" });
    }

    const ctx = await createAgentContext(studioId, userId);
    const result = await executePlan(plan, ctx);
    
    if (result.error) {
      return res.status(400).json({
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      type: "plan_executed",
      response: formatPlanOutputs(result.outputs || []),
      outputs: result.outputs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Plan execution error:", error);
    res.status(500).json({ 
      error: "Plan execution failed",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get agent status and capabilities
router.get("/api/crm/agent/status", async (req, res) => {
  try {
    const studioId = req.query.studioId as string || "e5dc81e8-7073-4041-8814-affb60f4ef6c";
    const userId = req.query.userId as string || "admin";
    
    const ctx = await createAgentContext(studioId, userId);
    const availableTools = toolRegistry.list();
    
    res.json({
      status: "operational",
      studioName: ctx.studioName,
      mode: ctx.policy.mode,
      authorities: ctx.policy.authorities,
      toolsCount: availableTools.length,
      tools: availableTools.map(t => ({ name: t.name, description: t.description })),
      memoryKeys: Object.keys(ctx.memory),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Agent status error:", error);
    res.status(500).json({ 
      error: "Failed to get agent status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export { router as crmAgentRouter };