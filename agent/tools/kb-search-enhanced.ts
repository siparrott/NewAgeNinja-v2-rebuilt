// agent/tools/kb-search-enhanced.ts - Enhanced knowledge base search with self-reasoning
import { ToolDefinition } from "../types.js";
import { knowledgeBase } from "../core/knowledge-base.js";

export const kbSearchEnhancedTool: ToolDefinition = {
  name: 'kb_search_enhanced',
  description: 'Advanced knowledge base search with self-reasoning capabilities. Automatically finds solutions to common CRM issues.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for the knowledge base. Can be an error message, issue description, or question.'
      },
      context: {
        type: 'string',
        description: 'Additional context about the current situation or error encountered.'
      },
      auto_reason: {
        type: 'boolean',
        description: 'Whether to automatically apply reasoning to find solutions (default: true)',
        default: true
      }
    },
    required: ['query']
  },

  handler: async (args: any, ctx: any) => {
    try {
      console.log('🧠 Enhanced KB search with self-reasoning:', args.query);

      // Search the knowledge base
      const searchResults = await knowledgeBase.search(args.query, 10, 0.6);

      if (searchResults.length === 0) {
        // Self-reasoning: Try different search strategies
        console.log('🔄 No direct results found, applying self-reasoning...');
        
        // Extract key terms and try alternative searches
        const keyTerms = args.query.toLowerCase().split(' ')
          .filter(term => term.length > 3)
          .slice(0, 3);

        let alternativeResults = [];
        for (const term of keyTerms) {
          const altResults = await knowledgeBase.search(term, 3, 0.5);
          alternativeResults.push(...altResults);
        }

        // If still no results, create knowledge entry for future reference
        if (alternativeResults.length === 0 && args.auto_reason) {
          console.log('🎯 Creating knowledge entry for future self-learning...');
          await knowledgeBase.addDocument(
            `Issue: ${args.query}\nContext: ${args.context || 'No context provided'}\nStatus: Unresolved - requires investigation`,
            {
              type: 'issue',
              status: 'unresolved',
              created_by: 'self_reasoning_system',
              tags: keyTerms
            }
          );
        }

        return {
          status: 'no_direct_match',
          reasoning: 'Applied self-reasoning with alternative search strategies',
          alternative_results: alternativeResults,
          suggested_actions: this.generateSuggestedActions(args.query, ctx)
        };
      }

      // Self-reasoning: Analyze results and provide actionable insights
      const analyzedResults = this.analyzeResults(searchResults, args.query, ctx);

      return {
        status: 'success',
        results: searchResults,
        analysis: analyzedResults,
        confidence: this.calculateConfidence(searchResults),
        suggested_next_steps: this.generateNextSteps(searchResults, args.query)
      };

    } catch (error) {
      console.error('❌ Enhanced KB search error:', error);
      
      // Self-reasoning: Log the error for future learning
      if (args.auto_reason) {
        await knowledgeBase.addDocument(
          `System Error in KB Search: ${error.message}\nQuery: ${args.query}\nContext: ${args.context || 'None'}`,
          {
            type: 'system_error',
            error_type: 'kb_search_failure',
            timestamp: new Date().toISOString()
          }
        );
      }

      return {
        status: 'error',
        error: error.message,
        self_diagnosis: 'System logged error for future improvement'
      };
    }
  },

  // Analyze search results and provide insights
  analyzeResults: function(results: any[], query: string, ctx: any) {
    const highConfidenceResults = results.filter(r => r.similarity > 0.8);
    const mediumConfidenceResults = results.filter(r => r.similarity > 0.6 && r.similarity <= 0.8);

    return {
      total_results: results.length,
      high_confidence: highConfidenceResults.length,
      medium_confidence: mediumConfidenceResults.length,
      most_relevant: results[0]?.document.content.substring(0, 200) + '...',
      reasoning: `Found ${results.length} relevant documents. ${highConfidenceResults.length} with high confidence.`
    };
  },

  // Generate suggested actions based on search results
  generateSuggestedActions: function(query: string, ctx: any): string[] {
    const actions = [];

    // Database-related issues
    if (query.toLowerCase().includes('sql') || query.toLowerCase().includes('database')) {
      actions.push('Check database connection and table schema');
      actions.push('Verify column names match between code and database');
      actions.push('Run database migration if schema changes needed');
    }

    // Invoice-related issues
    if (query.toLowerCase().includes('invoice')) {
      actions.push('Verify client exists in CRM before creating invoice');
      actions.push('Check price list contains the requested SKU');
      actions.push('Ensure all required invoice fields are provided');
    }

    // Search-related issues
    if (query.toLowerCase().includes('search') || query.toLowerCase().includes('find')) {
      actions.push('Try broader search terms');
      actions.push('Check if data exists in database');
      actions.push('Verify search tool is working correctly');
    }

    return actions.length > 0 ? actions : ['Escalate to human operator for manual investigation'];
  },

  // Calculate confidence score for results
  calculateConfidence: function(results: any[]): number {
    if (results.length === 0) return 0;
    
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const hasHighConfidenceResult = results.some(r => r.similarity > 0.8);
    
    return hasHighConfidenceResult ? Math.min(0.95, avgSimilarity + 0.2) : avgSimilarity;
  },

  // Generate next steps based on search results
  generateNextSteps: function(results: any[], query: string): string[] {
    const steps = [];
    
    if (results.length > 0) {
      const topResult = results[0];
      steps.push(`Apply solution from most relevant result (${Math.round(topResult.similarity * 100)}% match)`);
      
      if (results.length > 1) {
        steps.push(`Consider alternative approaches from ${results.length - 1} other results`);
      }
    }
    
    steps.push('Monitor outcome and update knowledge base with results');
    return steps;
  }
};