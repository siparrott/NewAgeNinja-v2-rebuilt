import { z } from "zod";
import { analyzeAndStoreWebsite, getWebsiteProfile } from "../integrations/website-profile";
import type { AgentCtx } from "../core/ctx";
import { updateSession } from "../core/memory";

/* analyze_website */
export const analyzeWebsiteTool = {
  name: "analyze_website",
  description: "Crawl the given URL and store a structured WebsiteProfile for later SEO and Autoblog use.",
  parameters: z.object({ url: z.string().url() }),
  handler: async (args: any, ctx: AgentCtx & { chatSessionId?: string }) => {
    try {
      const profile = await analyzeAndStoreWebsite(ctx.studioId, args.url);
      
      // Store in working memory for immediate follow-ups
      if (ctx.chatSessionId) {
        await updateSession(ctx.chatSessionId, { website_profile: profile });
      }
      
      return { 
        status: "stored", 
        profile: profile.profile_json,
        url: args.url,
        message: "Website analyzed and profile stored successfully"
      };
    } catch (error) {
      console.error("Website analysis error:", error);
      return { 
        error: "analysis-failed", 
        message: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
};

/* get_website_profile */
export const getWebsiteProfileTool = {
  name: "get_website_profile",
  description: "Return the newest WebsiteProfile JSON for this studio",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const profile = await getWebsiteProfile(ctx.studioId);
      return profile || { error: "none-found" };
    } catch (error) {
      console.error("Get website profile error:", error);
      return { error: "fetch-failed", message: error instanceof Error ? error.message : "Unknown error" };
    }
  }
};

/* suggest_site_improvements */
export const suggestSiteImprovementsTool = {
  name: "suggest_site_improvements",
  description: "Given existing WebsiteProfile, return a list of concrete copy / SEO / design improvements",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx, runLLM?: any) => {
    try {
      const profile = await getWebsiteProfile(ctx.studioId);
      if (!profile) return { error: "no-profile" };
      
      // If no LLM function provided, return basic suggestions
      if (!runLLM) {
        return {
          suggestions: [
            "• Optimize page titles and meta descriptions",
            "• Add alt text to all images",
            "• Improve page loading speed",
            "• Add structured data markup",
            "• Enhance mobile responsiveness"
          ]
        };
      }
      
      // Use LLM for advanced suggestions
      const messages = [
        { role: "system", content: "You are an expert SEO copywriter and web designer specializing in photography businesses." },
        { 
          role: "user", 
          content: `Here is site profile JSON:\n${JSON.stringify(profile.profile_json, null, 2)}\n\nReturn specific, actionable bullet-point improvements for this photography website.` 
        }
      ];
      
      const completion = await runLLM(messages, []);
      return {
        suggestions: completion.choices[0]?.message?.content || "Unable to generate suggestions"
      };
    } catch (error) {
      console.error("Site improvements error:", error);
      return { error: "suggestions-failed", message: error instanceof Error ? error.message : "Unknown error" };
    }
  }
};