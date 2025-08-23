import { kbSearchTool } from "../agent/tools/kb-search.js";

// Mock dependencies
jest.mock('@neondatabase/serverless');
jest.mock('openai');

const mockContext = {
  studioId: 'test-studio-id',
  userId: 'test-user',
  studioName: 'Test Studio'
};

const mockKbEntries = [
  {
    id: '1',
    title: 'Invoice Workflow',
    snippet: 'How to create and send invoices to clients...',
    category: 'billing',
    distance: 0.1
  },
  {
    id: '2', 
    title: 'Client Onboarding Process',
    snippet: 'Step-by-step guide for onboarding new photography clients...',
    category: 'crm',
    distance: 0.2
  },
  {
    id: '3',
    title: 'Session Scheduling Best Practices',
    snippet: 'Tips for scheduling photography sessions effectively...',
    category: 'scheduling',
    distance: 0.3
  }
];

describe('Knowledge Base Search Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search knowledge base and return relevant results', async () => {
    // Mock OpenAI embedding
    const openai = require('openai');
    openai.default.mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    }));

    // Mock database query
    const { neon } = require('@neondatabase/serverless');
    const mockSql = jest.fn().mockResolvedValue(mockKbEntries);
    neon.mockReturnValue(mockSql);

    const result = await kbSearchTool.handler(
      { query: 'invoice workflow' },
      mockContext
    );

    expect(result.found).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results[0]).toEqual({
      id: '1',
      title: 'Invoice Workflow',
      snippet: 'How to create and send invoices to clients...',
      category: 'billing',
      relevance_score: '0.900'
    });
  });

  it('should handle empty knowledge base gracefully', async () => {
    // Mock OpenAI embedding
    const openai = require('openai');
    openai.default.mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    }));

    // Mock empty database result
    const { neon } = require('@neondatabase/serverless');
    const mockSql = jest.fn().mockResolvedValue([]);
    neon.mockReturnValue(mockSql);

    const result = await kbSearchTool.handler(
      { query: 'nonexistent topic' },
      mockContext
    );

    expect(result.found).toBe(false);
    expect(result.message).toContain('No knowledge base entries found');
    expect(result.suggestion).toContain('create knowledge base entries');
  });

  it('should fallback to text search when vector search fails', async () => {
    // Mock OpenAI to fail
    const openai = require('openai');
    openai.default.mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
      }
    }));

    // Mock database for fallback search
    const { neon } = require('@neondatabase/serverless');
    const mockSql = jest.fn()
      .mockRejectedValueOnce(new Error('Vector search failed'))
      .mockResolvedValueOnce([mockKbEntries[0]]);
    neon.mockReturnValue(mockSql);

    const result = await kbSearchTool.handler(
      { query: 'invoice' },
      mockContext
    );

    expect(result.found).toBe(true);
    expect(result.fallback_search).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].relevance_score).toBe('text_match');
  });

  it('should throw error when both vector and text search fail', async () => {
    // Mock OpenAI to fail
    const openai = require('openai');
    openai.default.mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockRejectedValue(new Error('OpenAI API error'))
      }
    }));

    // Mock database to fail for both searches
    const { neon } = require('@neondatabase/serverless');
    const mockSql = jest.fn().mockRejectedValue(new Error('Database error'));
    neon.mockReturnValue(mockSql);

    await expect(kbSearchTool.handler(
      { query: 'test query' },
      mockContext
    )).rejects.toThrow('kb_search:failed');
  });
});