import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function createOpenAITool(name: string, description: string, parameters: z.ZodSchema) {
  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters: zodToJsonSchema(parameters, name)
    }
  };
}