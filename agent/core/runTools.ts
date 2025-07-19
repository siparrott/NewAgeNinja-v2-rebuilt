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
    // Add tool args logging for debugging
    console.log('[TOOL ARGS]', name, parsedArgs);
    
    const out = await tool.handler(parsedArgs, ctx);
    
    // Detect null/empty results and surface as errors instead of hiding them
    if (out === null || out === undefined) {
      console.log('[TOOL NULL RESULT]', name, 'returned null/undefined');
      return {
        tool_call_id: call.id,
        output: JSON.stringify({
          ok: false,
          error: `${name} returned no data - check database records and query parameters`,
          tool: name,
          args: parsedArgs
        })
      };
    }
    
    if (Array.isArray(out) && out.length === 0) {
      console.log('[TOOL EMPTY ARRAY]', name, 'returned empty array');
      return {
        tool_call_id: call.id,
        output: JSON.stringify({
          ok: false,
          error: `${name} found no matching records - database may be empty or filters too restrictive`,
          tool: name,
          args: parsedArgs
        })
      };
    }
    
    console.log('[TOOL SUCCESS]', name, 'returned data:', Array.isArray(out) ? `${out.length} items` : typeof out);
    return { tool_call_id: call.id, output: JSON.stringify({ ok: true, data: out }) };
  } catch (e: any) {
    // Enhanced error logging per expert checklist
    console.error('[TOOL ERROR]', name, e.message, 'args:', parsedArgs);
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