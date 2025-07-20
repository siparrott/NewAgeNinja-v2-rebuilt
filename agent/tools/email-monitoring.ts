import { z } from 'zod';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Email Monitoring and Intelligence Tools for CRM Agent

// Smart Email Analysis Tool
export const emailAnalysisTool = {
  name: "analyze_email",
  description: "Analyze email content for spam detection, urgency assessment, and inquiry classification",
  parameters: z.object({
    sender: z.string().describe("Email sender address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email body content"),
    analyze_urgency: z.boolean().default(true),
    detect_spam: z.boolean().default(true),
    classify_inquiry: z.boolean().default(true)
  }),
  execute: async (params: any) => {
    try {
      const { sender, subject, body } = params;
      
      // Spam Detection Logic
      const spamIndicators = [
        /winner|lottery|prize|congratulations/i,
        /urgent.{0,20}action.{0,20}required/i,
        /click.{0,10}here.{0,10}now/i,
        /free.{0,10}money|make.{0,10}money/i,
        /viagra|penis|enlargement/i,
        /nigerian.{0,10}prince/i,
        /advance.{0,10}fee.{0,10}fraud/i
      ];
      
      const isSpam = spamIndicators.some(pattern => 
        pattern.test(subject) || pattern.test(body)
      );
      
      // Photography Inquiry Detection
      const photographyKeywords = [
        /photography|photographer|photo.{0,10}shoot/i,
        /family.{0,10}portrait|wedding.{0,10}photo/i,
        /maternity.{0,10}shoot|newborn.{0,10}photo/i,
        /headshot|business.{0,10}photo/i,
        /booking|appointment|session/i,
        /quote|price|cost|budget/i
      ];
      
      const isPhotographyInquiry = photographyKeywords.some(pattern =>
        pattern.test(subject) || pattern.test(body)
      );
      
      // Urgency Detection
      const urgencyIndicators = [
        /urgent|asap|immediately|emergency/i,
        /deadline.{0,20}today|need.{0,10}today/i,
        /last.{0,10}minute|short.{0,10}notice/i,
        /important|critical|priority/i
      ];
      
      const isUrgent = urgencyIndicators.some(pattern =>
        pattern.test(subject) || pattern.test(body)
      );
      
      // Simple Request Detection (can auto-reply)
      const simpleRequests = [
        /what.{0,20}price|how.{0,10}much|cost/i,
        /available.{0,20}date|when.{0,10}available/i,
        /location|address|where/i,
        /package|what.{0,10}include/i
      ];
      
      const isSimpleRequest = simpleRequests.some(pattern =>
        pattern.test(subject) || pattern.test(body)
      );
      
      // Content Classification
      let category = 'general';
      if (isPhotographyInquiry) {
        if (/family|child|kid/i.test(body)) category = 'family_photography';
        else if (/wedding|bride|groom/i.test(body)) category = 'wedding_photography';
        else if (/maternity|pregnant|expecting/i.test(body)) category = 'maternity_photography';
        else if (/newborn|baby/i.test(body)) category = 'newborn_photography';
        else if (/business|headshot|corporate/i.test(body)) category = 'business_photography';
        else category = 'photography_inquiry';
      }
      
      return {
        analysis: {
          is_spam: isSpam,
          is_photography_inquiry: isPhotographyInquiry,
          is_urgent: isUrgent,
          is_simple_request: isSimpleRequest,
          category: category,
          confidence_score: isPhotographyInquiry ? 0.9 : 0.3,
          recommended_action: isSpam ? 'ignore' : 
                            isUrgent ? 'flag_urgent' :
                            isSimpleRequest ? 'auto_reply' : 'review'
        },
        sender: sender,
        subject: subject,
        processed_at: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: `Email analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Monitor and Process Emails Tool
export const monitorEmailsTool = {
  name: "monitor_email_account",
  description: "Monitor email account for new messages, filter spam, and process genuine inquiries",
  parameters: z.object({
    hours_back: z.number().min(1).max(72).default(24).describe("Check emails from last N hours"),
    auto_reply_simple: z.boolean().default(true).describe("Auto-reply to simple requests"),
    flag_urgent: z.boolean().default(true).describe("Flag urgent emails for immediate attention")
  }),
  execute: async (params: any) => {
    try {
      // Check for new messages in crm_messages table
      const recentMessages = await sql`
        SELECT id, sender_name, sender_email, subject, content, status, created_at
        FROM crm_messages 
        WHERE created_at > NOW() - INTERVAL '${params.hours_back} hours'
        AND status = 'new'
        ORDER BY created_at DESC
        LIMIT 20
      `;
      
      const processedEmails = [];
      let spamCount = 0;
      let urgentCount = 0;
      let autoRepliedCount = 0;
      
      for (const message of recentMessages) {
        // Analyze each email
        const analysis = await emailAnalysisTool.execute({
          sender: message.sender_email,
          subject: message.subject,
          body: message.content,
          analyze_urgency: true,
          detect_spam: true,
          classify_inquiry: true
        });
        
        if (analysis.analysis) {
          const emailAnalysis = analysis.analysis;
          
          // Process based on analysis
          if (emailAnalysis.is_spam) {
            spamCount++;
            // Mark as spam, don't reply
            await sql`
              UPDATE crm_messages 
              SET status = 'spam', updated_at = NOW()
              WHERE id = ${message.id}
            `;
          } else if (emailAnalysis.is_urgent) {
            urgentCount++;
            // Flag for urgent attention
            await sql`
              UPDATE crm_messages 
              SET status = 'urgent', updated_at = NOW()
              WHERE id = ${message.id}
            `;
          } else if (emailAnalysis.is_simple_request && params.auto_reply_simple) {
            autoRepliedCount++;
            // Mark for auto-reply
            await sql`
              UPDATE crm_messages 
              SET status = 'auto_replied', updated_at = NOW()
              WHERE id = ${message.id}
            `;
          } else {
            // Mark for manual review
            await sql`
              UPDATE crm_messages 
              SET status = 'review', updated_at = NOW()
              WHERE id = ${message.id}
            `;
          }
          
          processedEmails.push({
            id: message.id,
            sender: message.sender_email,
            subject: message.subject,
            analysis: emailAnalysis,
            action_taken: emailAnalysis.recommended_action
          });
        }
      }
      
      return {
        success: true,
        monitoring_period: `${params.hours_back} hours`,
        total_emails_processed: recentMessages.length,
        spam_detected: spamCount,
        urgent_flagged: urgentCount,
        auto_replied: autoRepliedCount,
        for_review: recentMessages.length - spamCount - urgentCount - autoRepliedCount,
        processed_emails: processedEmails.slice(0, 5), // Show first 5 for summary
        recommendations: [
          urgentCount > 0 ? `${urgentCount} urgent emails need immediate attention` : null,
          autoRepliedCount > 0 ? `${autoRepliedCount} simple requests auto-processed` : null,
          spamCount > 0 ? `${spamCount} spam emails filtered out` : null
        ].filter(Boolean)
      };
    } catch (error) {
      return {
        success: false,
        error: `Email monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};

// Smart Auto-Reply Tool
export const autoReplyTool = {
  name: "smart_auto_reply",
  description: "Generate and send intelligent auto-replies to simple photography inquiries",
  parameters: z.object({
    sender_email: z.string().email(),
    original_subject: z.string(),
    inquiry_type: z.enum(['pricing', 'availability', 'location', 'packages', 'general']),
    urgency_level: z.enum(['low', 'medium', 'high']).default('low')
  }),
  execute: async (params: any) => {
    try {
      // Generate appropriate auto-reply based on inquiry type
      const autoReplyTemplates = {
        pricing: {
          subject: "Photography Pricing Information - New Age Fotografie",
          body: `Dear Photography Enthusiast,

Thank you for your interest in New Age Fotografie!

Here are our photography session packages:

📸 Family Portrait Session: €250 (60 minutes)
👶 Newborn Photography: €295 (90 minutes)
🤰 Maternity Session: €295 (90 minutes)
💼 Business Headshots: €195 (45 minutes)

All sessions include:
• Professional studio lighting
• Multiple outfit/setup changes
• High-resolution edited images
• Online gallery for sharing

For custom packages or wedding photography, please reply to discuss your specific needs.

📍 Studio Location: Schönbrunner Str. 25, 1050 Wien
📞 Phone: +43 677 933 99210

We look forward to capturing your special moments!

Best regards,
New Age Fotografie Team`
        },
        availability: {
          subject: "Session Availability - New Age Fotografie",
          body: `Dear Future Client,

Thank you for reaching out about session availability!

We currently have openings:
📅 This week: Tuesday, Thursday afternoons
📅 Next week: Monday, Wednesday, Friday
📅 Weekend slots: Saturday mornings available

Sessions typically run:
⏰ Weekdays: 9:00 AM - 6:00 PM
⏰ Weekends: 9:00 AM - 3:00 PM

To check specific dates or book your session, please reply with:
• Preferred session type (family, maternity, newborn, etc.)
• Your preferred dates/times
• Number of people in session

📍 Studio: Schönbrunner Str. 25, 1050 Wien
📞 Direct line: +43 677 933 99210

Looking forward to working with you!

Best regards,
New Age Fotografie Team`
        },
        location: {
          subject: "Studio Location & Directions - New Age Fotografie",
          body: `Dear Photography Client,

Here's everything you need to know about our studio location:

🏢 Address: Schönbrunner Str. 25, 1050 Wien, Austria

🚇 Public Transport:
• U-Bahn: Kettenbrückengasse (5-minute walk)
• Tram: Lines 1, 6, 18, 62
• Bus: Multiple connections available

🚗 Parking:
• Street parking available (usually free on weekends)
• Paid parking during weekdays
• Several parking garages nearby

📍 Landmark: 5 minutes from Naschmarkt

Our studio features:
• Professional lighting equipment
• Multiple backdrop options
• Comfortable client area
• Changing facilities

📞 If you need directions on session day: +43 677 933 99210

See you soon!

Best regards,
New Age Fotografie Team`
        },
        packages: {
          subject: "Photography Packages & Services - New Age Fotografie",
          body: `Dear Photography Enthusiast,

Thank you for asking about our photography packages!

🌟 SIGNATURE PACKAGES:

👨‍👩‍👧‍👦 FAMILY PORTRAITS (€250)
• 60-minute session
• Up to 6 family members
• 15+ edited high-resolution images
• Online gallery included

👶 NEWBORN MAGIC (€295)
• 90-minute gentle session
• Safety-first approach
• Props and outfits provided
• 20+ edited images

🤰 MATERNITY GLOW (€295)
• 90-minute session
• Multiple outfit changes
• Partner shots included
• 18+ edited images

💼 BUSINESS PROFESSIONAL (€195)
• 45-minute session
• LinkedIn-ready headshots
• Multiple looks/backgrounds
• 10+ edited images

✨ ADD-ONS AVAILABLE:
• Print packages from €35
• Canvas prints from €75
• Same-day editing: +€50

For custom packages or special events, let's discuss your vision!

📞 Book now: +43 677 933 99210
📧 Email: hallo@newagefotografie.com

Best regards,
New Age Fotografie Team`
        },
        general: {
          subject: "Thank you for your inquiry - New Age Fotografie",
          body: `Dear Photography Enthusiast,

Thank you for reaching out to New Age Fotografie!

We specialize in capturing life's most precious moments through:
• Family and children's photography
• Maternity and newborn sessions
• Business and professional headshots
• Special occasion photography

Our Vienna studio offers:
📸 Professional equipment and lighting
🏢 Comfortable, welcoming environment
👨‍💼 Experienced, friendly photographer
🖼️ High-quality editing and delivery

Next steps:
1. Reply with your session type preference
2. Let us know your preferred dates
3. We'll confirm availability and details

📍 Studio: Schönbrunner Str. 25, 1050 Wien
📞 Phone: +43 677 933 99210
📧 Email: hallo@newagefotografie.com

We look forward to creating beautiful memories with you!

Best regards,
New Age Fotografie Team`
        }
      };

      const template = autoReplyTemplates[params.inquiry_type] || autoReplyTemplates.general;
      
      // If urgent, add priority note
      if (params.urgency_level === 'high') {
        template.body = `*** PRIORITY RESPONSE ***\n\n${template.body}\n\n*** For urgent matters, please call +43 677 933 99210 directly ***`;
      }

      return {
        success: true,
        auto_reply: {
          to: params.sender_email,
          subject: template.subject,
          body: template.body,
          inquiry_type: params.inquiry_type,
          urgency_level: params.urgency_level
        },
        message: "Auto-reply template generated successfully"
      };
    } catch (error) {
      return {
        success: false,
        error: `Auto-reply generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};