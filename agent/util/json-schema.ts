import { z } from "zod";

export function createOpenAITool(name: string, description: string, parameters: z.ZodSchema) {
  return {
    type: "function" as const,
    function: {
      name,
      description,
      parameters: zodToJsonSchema(parameters),
    },
  };
}

function zodToJsonSchema(schema: z.ZodSchema): any {
  // Simple Zod to JSON Schema conversion
  // This is a basic implementation for common Zod types
  
  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }
  
  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }
  
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }
  
  if (schema instanceof z.ZodArray) {
    return {
      type: "array",
      items: zodToJsonSchema(schema.element),
    };
  }
  
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const properties: any = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchema(value as z.ZodSchema);
      
      // Check if field is required (not optional)
      if (!(value as any).isOptional()) {
        required.push(key);
      }
    }
    
    return {
      type: "object",
      properties,
      required,
    };
  }
  
  if (schema instanceof z.ZodEnum) {
    return {
      type: "string",
      enum: schema.options,
    };
  }
  
  if (schema instanceof z.ZodOptional) {
    return zodToJsonSchema(schema.unwrap());
  }
  
  if (schema instanceof z.ZodDefault) {
    return zodToJsonSchema(schema.removeDefault());
  }
  
  // Fallback
  return { type: "string" };
}