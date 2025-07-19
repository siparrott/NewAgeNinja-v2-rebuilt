import { toolRegistry } from "./tools";

export async function executeToolCall(call: any, ctx: any) {
  const name = call.function.name;
  const argsRaw = call.function.arguments || "{}";
  let parsedArgs: any = {};
  try {
    parsedArgs = JSON.parse(argsRaw);
  } catch (e) {
    return { tool_call_id: call.id, output: JSON.stringify({ error: "bad_json_args", detail: e.message, name, raw: argsRaw }) };
  }

  const tool = toolRegistry.get(name);
  if (!tool) {
    return { tool_call_id: call.id, output: JSON.stringify({ error: "unknown_tool", name }) };
  }

  try {
    const out = await tool.handler(parsedArgs, ctx);
    return { tool_call_id: call.id, output: JSON.stringify({ ok: true, data: out }) };
  } catch (e: any) {
    // IMPORTANT: surface real error cause
    return {
      tool_call_id: call.id,
      output: JSON.stringify({
        ok: false,
        error: e.message || String(e),
        stack: e.stack?.split("\n").slice(0,3),
        tool: name,
        args: parsedArgs
      })
    };
  }
}

export function surfaceToolErrors(toolOutputs: any[]) {
  const errs = toolOutputs
    .map(o => {
      try { return JSON.parse(o.output); } catch { return null; }
    })
    .filter(r => r && r.ok === false);
  if (!errs.length) return null;
  return errs.map(e => `❌ ${e.tool}: ${e.error}`).join("\n");
}