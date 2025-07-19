import { z } from "zod";
import { analyzeKeywordGap, existingBlogH1s, getAllDiscoveredKeywords, getRecentSEOIntel } from "../integrations/seo-intel";
import { fetchReviews, serpSearch } from "../integrations/serp";
import type { AgentCtx } from "../core/ctx";

/* search_competitors */
export const searchCompetitorsTool = {
  name: "search_competitors",
  description: "Search Google for competitor photography studios and return top URLs, titles, and snippets for competitive analysis.",
  parameters: z.object({ 
    query: z.string().describe("Search query for competitors (e.g., 'familienfotograf wien', 'newborn photography vienna')")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      const { serp } = await analyzeKeywordGap(ctx.studioId, args.query);
      const competitors = serp?.organic_results?.map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        position: r.position
      })) || [];
      
      return {
        query: args.query,
        total_results: competitors.length,
        competitors: competitors.slice(0, 8) // Top 8 competitors
      };
    } catch (error) {
      console.error('Error searching competitors:', error);
      return { error: "search-failed", message: "Failed to search competitors" };
    }
  }
};

/* fetch_reviews */
export const fetchReviewsTool = {
  name: "fetch_reviews",
  description: "Search the web for reviews of the photography business and return review snippets for social proof analysis.",
  parameters: z.object({ 
    business_name: z.string().describe("Name of the business to search reviews for")
  }),
  handler: async (args: any) => {
    try {
      const reviews = await fetchReviews(args.business_name);
      return {
        business: args.business_name,
        review_count: reviews.length,
        reviews: reviews.slice(0, 10) // Top 10 review snippets
      };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { error: "fetch-failed", message: "Failed to fetch reviews" };
    }
  }
};

/* keyword_gap */
export const keywordGapTool = {
  name: "keyword_gap",
  description: "Analyze SERP results for a query and discover keyword opportunities that competitors are ranking for but the studio might be missing.",
  parameters: z.object({ 
    query: z.string().describe("Search query to analyze for keyword gaps (e.g., 'familienfotografie wien preise')")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      const { unique, serp } = await analyzeKeywordGap(ctx.studioId, args.query);
      
      return {
        query: args.query,
        discovered_keywords: unique,
        keyword_count: unique.length,
        serp_analysis: {
          total_results: serp?.organic_results?.length || 0,
          top_domains: serp?.organic_results?.slice(0, 5).map((r: any) => new URL(r.link).hostname) || []
        }
      };
    } catch (error) {
      console.error('Error analyzing keyword gap:', error);
      return { error: "analysis-failed", message: "Failed to analyze keyword gap" };
    }
  }
};

/* check_duplicate_headline */
export const checkDuplicateHeadlineTool = {
  name: "check_duplicate_headline",
  description: "Check if a proposed blog headline is similar to existing blog post titles to avoid content duplication.",
  parameters: z.object({ 
    headline: z.string().describe("Proposed blog headline to check for duplicates")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      const existingTitles = await existingBlogH1s(ctx.studioId);
      const proposedLower = args.headline.toLowerCase();
      
      const isDuplicate = existingTitles.some(title => {
        // Check for exact match or high similarity
        const similarity = calculateSimilarity(title, proposedLower);
        return similarity > 0.7; // 70% similarity threshold
      });
      
      const similarTitles = existingTitles.filter(title => {
        const similarity = calculateSimilarity(title, proposedLower);
        return similarity > 0.5; // Show titles with 50%+ similarity
      }).slice(0, 5);
      
      return {
        headline: args.headline,
        status: isDuplicate ? "duplicate" : "unique",
        similarity_found: similarTitles.length > 0,
        similar_titles: similarTitles,
        total_existing_posts: existingTitles.length
      };
    } catch (error) {
      console.error('Error checking duplicate headline:', error);
      return { error: "check-failed", message: "Failed to check headline duplicates" };
    }
  }
};

/* get_seo_insights */
export const getSEOInsightsTool = {
  name: "get_seo_insights",
  description: "Get comprehensive SEO insights including recent keyword discoveries, competitor analysis history, and content opportunities.",
  parameters: z.object({}),
  handler: async (_: any, ctx: AgentCtx) => {
    try {
      const [recentSEO, allKeywords] = await Promise.all([
        getRecentSEOIntel(ctx.studioId, 10),
        getAllDiscoveredKeywords(ctx.studioId)
      ]);
      
      return {
        recent_analyses: recentSEO.map(seo => ({
          query: seo.query,
          keywords_found: seo.extracted_keywords?.length || 0,
          date: seo.created_at
        })),
        total_discovered_keywords: allKeywords.length,
        top_keywords: allKeywords.slice(0, 20),
        last_analysis: recentSEO[0]?.created_at || null
      };
    } catch (error) {
      console.error('Error getting SEO insights:', error);
      return { error: "insights-failed", message: "Failed to get SEO insights" };
    }
  }
};

/* trending_topics */
export const trendingTopicsTool = {
  name: "trending_topics",
  description: "Discover trending topics and questions in photography by analyzing SERP 'People Also Ask' sections and related searches.",
  parameters: z.object({ 
    topic: z.string().describe("Base topic to research trends for (e.g., 'familienfotografie', 'newborn photography')")
  }),
  handler: async (args: any, ctx: AgentCtx) => {
    try {
      // Search for the main topic plus trend indicators
      const trendQueries = [
        `${args.topic} 2025`,
        `${args.topic} tipps`,
        `${args.topic} fragen`,
        `warum ${args.topic}`
      ];
      
      const trendResults = [];
      for (const query of trendQueries) {
        try {
          const serp = await serpSearch(query);
          const peopleAlsoAsk = serp?.people_also_ask || [];
          const relatedSearches = serp?.related_searches || [];
          
          trendResults.push({
            query,
            people_also_ask: peopleAlsoAsk.slice(0, 5),
            related_searches: relatedSearches.slice(0, 5)
          });
        } catch (err) {
          console.error(`Error searching for ${query}:`, err);
        }
      }
      
      return {
        topic: args.topic,
        trend_queries: trendQueries,
        results: trendResults,
        total_questions: trendResults.reduce((sum, r) => sum + r.people_also_ask.length, 0)
      };
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return { error: "trends-failed", message: "Failed to get trending topics" };
    }
  }
};

/**
 * Calculate similarity between two strings using simple overlap method
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const overlap = words1.filter(word => words2.includes(word)).length;
  const maxLength = Math.max(words1.length, words2.length);
  
  return maxLength > 0 ? overlap / maxLength : 0;
}