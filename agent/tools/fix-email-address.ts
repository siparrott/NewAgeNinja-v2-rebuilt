// Fix Email Address Tool - Auto-correct common email typos
import { z } from 'zod';
import { ToolContext, Tool } from "../types.js";
import validator from 'validator';

export const fixEmailAddressSchema = z.object({
  contactType: z.enum(['lead', 'client']).describe('Whether to fix a lead or client email'),
  contactId: z.string().describe('The ID of the lead or client to fix'),
  newEmail: z.string().describe('The corrected email address')
});

export type FixEmailAddressInput = z.infer<typeof fixEmailAddressSchema>;

// Common email domain fixes
const DOMAIN_FIXES = {
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'yahoo.con': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'hotmail.con': 'hotmail.com',
  'outlook.con': 'outlook.com',
  'gmx.con': 'gmx.at',
  'gmx.co': 'gmx.at'
};

function autoCorrectEmail(email: string): string {
  // Add missing @ if obvious
  if (email.includes('gmail') && !email.includes('@')) {
    const parts = email.split('gmail');
    if (parts.length === 2) {
      return `${parts[0]}@gmail.com`;
    }
  }
  
  if (email.includes('yahoo') && !email.includes('@')) {
    const parts = email.split('yahoo');
    if (parts.length === 2) {
      return `${parts[0]}@yahoo.com`;
    }
  }
  
  // Fix common domain typos
  for (const [typo, correct] of Object.entries(DOMAIN_FIXES)) {
    if (email.includes(typo)) {
      email = email.replace(typo, correct);
    }
  }
  
  return email;
}

export const fixEmailAddressTool = {
  name: 'fix_email_address',
  description: 'Fix malformed email addresses with auto-correction for common typos',
  parameters: fixEmailAddressSchema,
  handler: async (input: FixEmailAddressInput, ctx: ToolContext) => {
    try {
      // Auto-correct the email first
      const correctedEmail = autoCorrectEmail(input.newEmail);
      
      // Validate the corrected email
      if (!validator.isEmail(correctedEmail)) {
        return {
          success: false,
          error: `Even after auto-correction, email "${correctedEmail}" is still invalid. Please provide a proper email format.`
        };
      }
      
      // Update the contact
      if (input.contactType === 'lead') {
        const lead = await ctx.storage.updateCrmLead(input.contactId, {
          email: correctedEmail
        });
        
        return {
          success: true,
          message: `Fixed email for lead "${lead.name}": ${input.newEmail} → ${correctedEmail}`,
          contact: lead,
          original: input.newEmail,
          corrected: correctedEmail
        };
        
      } else {
        const client = await ctx.storage.updateCrmClient(input.contactId, {
          email: correctedEmail
        });
        
        return {
          success: true,
          message: `Fixed email for client "${client.name}": ${input.newEmail} → ${correctedEmail}`,
          contact: client,
          original: input.newEmail,
          corrected: correctedEmail
        };
      }
      
    } catch (error) {
      console.error('Fix email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fix email address'
      };
    }
  }
};