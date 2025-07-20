import { toolRegistry } from "../agent/core/tools";
import { writeFileSync } from "fs";
import { mkdirSync } from "fs";

// Ensure the data directory exists
try {
  mkdirSync("agent/data", { recursive: true });
} catch (e) {
  // Directory already exists
}

// Generate tool catalog from registry
const catalog = toolRegistry.list().map(tool => ({
  name: tool.name,
  description: tool.description?.split("\n")[0] || "No description",
  parameters: tool.parameters?.shape || {},
  category: categorizeTool(tool.name)
}));

function categorizeTool(name?: string): string {
  if (!name) return 'general';
  if (name.includes('email') || name.includes('campaign')) return 'communication';
  if (name.includes('invoice') || name.includes('voucher') || name.includes('payment')) return 'billing';
  if (name.includes('calendar') || name.includes('session') || name.includes('booking')) return 'scheduling';
  if (name.includes('blog') || name.includes('post') || name.includes('content')) return 'content';
  if (name.includes('file') || name.includes('upload') || name.includes('digital')) return 'files';
  if (name.includes('search') || name.includes('find') || name.includes('count')) return 'search';
  if (name.includes('client') || name.includes('lead') || name.includes('entity')) return 'crm';
  if (name.includes('report') || name.includes('analytics') || name.includes('kpi')) return 'analytics';
  if (name.includes('system') || name.includes('database') || name.includes('monitoring')) return 'admin';
  if (name.includes('automation') || name.includes('workflow') || name.includes('trigger')) return 'automation';
  if (name.includes('portal') || name.includes('notification')) return 'portal';
  if (name.includes('gallery') || name.includes('prodigi') || name.includes('order')) return 'products';
  return 'general';
}

// Write catalog to file
writeFileSync(
  "agent/data/tool_catalog.json",
  JSON.stringify({
    generated_at: new Date().toISOString(),
    total_tools: catalog.length,
    categories: [...new Set(catalog.map(t => t.category))].sort(),
    tools: catalog
  }, null, 2)
);

console.log(`✅ Generated tool catalog with ${catalog.length} tools`);
console.log(`📂 Categories: ${[...new Set(catalog.map(t => t.category))].join(', ')}`);