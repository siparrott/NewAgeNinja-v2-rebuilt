// CRM Agent API endpoints
import { Router } from "express";
import { runAgent } from "../../agent/run-agent";
import { createAgentContext } from "../../agent/bootstrap";
import { toolRegistry } from "../../agent/core/tools";

const router = Router();

// Chat with CRM agent
router.post("/api/crm/agent/chat", async (req, res) => {
  try {
    const { message, studioId = "e5dc81e8-7073-4041-8814-affb60f4ef6c", userId = "admin" } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Run the agent
    const response = await runAgent(studioId, userId, message);
    
    res.json({ 
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