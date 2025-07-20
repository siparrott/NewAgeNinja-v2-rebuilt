import { planAndExecute, executePlan } from '../agent/core/planRunner';
import { createAgentContext } from '../agent/bootstrap';

// Mock dependencies
jest.mock('../agent/bootstrap');
jest.mock('openai');
jest.mock('fs');

const mockContext = {
  studioId: 'test-studio',
  userId: 'test-user',
  studioName: 'Test Studio',
  policy: { mode: 'auto_safe', authorities: ['CREATE_LEAD'] },
  memory: {},
  creds: { currency: 'EUR' }
};

const mockPlan = {
  steps: [
    { tool: 'global_search', args: { term: 'test client' } },
    { tool: 'create_invoice', args: { client_id: '123', sku: 'DIGI-10' } }
  ],
  explanation: 'Find client and create invoice',
  risk_level: 'medium' as const,
  estimated_duration: '2 minutes'
};

describe('PlanRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createAgentContext as jest.Mock).mockResolvedValue(mockContext);
  });

  describe('planAndExecute', () => {
    it('should return plan for confirmation when risk level is high', async () => {
      // Mock file system to return tool catalog
      const fs = require('fs');
      fs.readFileSync.mockReturnValue(JSON.stringify({
        tools: [
          { name: 'global_search', description: 'Search all records' },
          { name: 'create_invoice', description: 'Create invoice' }
        ]
      }));

      // Mock OpenAI to return high-risk plan
      const openai = require('openai');
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ 
          message: { 
            content: JSON.stringify({
              ...mockPlan,
              risk_level: 'high'
            })
          }
        }]
      });
      openai.default.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }));

      const result = await planAndExecute('Create invoice for test client', mockContext);

      expect(result.needConfirmation).toBe(true);
      expect(result.plan).toBeDefined();
      expect(result.plan?.risk_level).toBe('high');
    });

    it('should execute plan automatically for low risk', async () => {
      // Mock file system
      const fs = require('fs');
      fs.readFileSync.mockReturnValue(JSON.stringify({
        tools: [
          { name: 'global_search', description: 'Search all records' }
        ]
      }));

      // Mock OpenAI to return low-risk plan
      const openai = require('openai');
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{ 
          message: { 
            content: JSON.stringify({
              steps: [{ tool: 'global_search', args: { term: 'test' } }],
              explanation: 'Search for test',
              risk_level: 'low',
              estimated_duration: '30 seconds'
            })
          }
        }]
      });
      openai.default.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }));

      // Mock tool registry to have global_search tool
      const mockTool = {
        handler: jest.fn().mockResolvedValue({ found: true, results: [] })
      };
      
      // Mock the toolRegistry
      jest.doMock('../agent/core/tools', () => ({
        toolRegistry: {
          global_search: mockTool
        }
      }));

      const result = await planAndExecute('Search for test', mockContext);

      expect(result.outputs).toBeDefined();
      expect(result.needConfirmation).toBeUndefined();
    });
  });

  describe('executePlan', () => {
    it('should execute all steps in sequence', async () => {
      const mockTool1 = {
        handler: jest.fn().mockResolvedValue({ success: true, data: 'result1' })
      };
      const mockTool2 = {
        handler: jest.fn().mockResolvedValue({ success: true, data: 'result2' })
      };

      // Mock toolRegistry
      jest.doMock('../agent/core/tools', () => ({
        toolRegistry: {
          global_search: mockTool1,
          create_invoice: mockTool2
        }
      }));

      const result = await executePlan(mockPlan, mockContext);

      expect(result.outputs).toHaveLength(2);
      expect(result.outputs?.[0]).toEqual({
        tool: 'global_search',
        success: true,
        result: { success: true, data: 'result1' }
      });
      expect(result.outputs?.[1]).toEqual({
        tool: 'create_invoice',
        success: true,
        result: { success: true, data: 'result2' }
      });
    });

    it('should handle tool execution errors gracefully', async () => {
      const mockTool = {
        handler: jest.fn().mockRejectedValue(new Error('Tool failed'))
      };

      jest.doMock('../agent/core/tools', () => ({
        toolRegistry: {
          global_search: mockTool
        }
      }));

      const simplePlan = {
        steps: [{ tool: 'global_search', args: { term: 'test' } }],
        explanation: 'Search test',
        risk_level: 'low' as const,
        estimated_duration: '30s'
      };

      const result = await executePlan(simplePlan, mockContext);

      expect(result.outputs).toHaveLength(1);
      expect(result.outputs?.[0]).toEqual({
        tool: 'global_search',
        success: false,
        error: 'Tool failed'
      });
    });
  });
});