import { supabase } from './supabase';

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  message: string;
}

interface WaitlistFormData extends ContactFormData {
  preferredDate: string;
}

export async function submitContactForm(formData: ContactFormData) {
  try {
    // First try the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public/contact/kontakt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      // If Edge Function fails, fall back to direct database insert
      console.warn('Edge Function failed, using fallback method');
      return await submitContactFormFallback(formData);
    }

    return await response.json();
  } catch (error) {
    console.error('Error with Edge Function, trying fallback:', error);
    // Fallback to direct database insert
    return await submitContactFormFallback(formData);
  }
}

export async function submitWaitlistForm(formData: WaitlistFormData) {
  try {
    // First try the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public/contact/warteliste`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      // If Edge Function fails, fall back to direct database insert
      console.warn('Edge Function failed, using fallback method');
      return await submitWaitlistFormFallback(formData);
    }

    return await response.json();
  } catch (error) {
    console.error('Error with Edge Function, trying fallback:', error);
    // Fallback to direct database insert
    return await submitWaitlistFormFallback(formData);
  }
}

// Fallback functions that insert directly into the database
async function submitContactFormFallback(formData: ContactFormData) {
  const { error } = await supabase
    .from('leads')
    .insert({
      form_source: 'KONTAKT',
      first_name: formData.fullName.split(' ')[0] || '',
      last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
      email: formData.email,
      phone: formData.phone || null,
      message: formData.message,
      status: 'NEW'
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to submit contact form');
  }

  return { success: true, message: 'Contact form submitted successfully' };
}

async function submitWaitlistFormFallback(formData: WaitlistFormData) {
  const message = `Preferred Date: ${formData.preferredDate}${formData.message ? '\n\nMessage: ' + formData.message : ''}`;

  const { error } = await supabase
    .from('leads')
    .insert({
      form_source: 'WARTELISTE',
      first_name: formData.fullName.split(' ')[0] || '',
      last_name: formData.fullName.split(' ').slice(1).join(' ') || '',
      email: formData.email,
      phone: formData.phone || null,
      message: message,
      status: 'NEW'
    });

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to submit waitlist form');
  }

  return { success: true, message: 'Waitlist form submitted successfully' };
}

export async function submitNewsletterForm(email: string) {
  try {
    // First try the Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      console.warn('Newsletter Edge Function failed, using fallback method');
      return await submitNewsletterFormFallback(email);
    }

    return await response.json();
  } catch (error) {
    console.error('Error with newsletter Edge Function, trying fallback:', error);
    // Fallback to direct database insert
    return await submitNewsletterFormFallback(email);
  }
}

async function submitNewsletterFormFallback(email: string) {
  try {
    // First try to use the database function if it exists
    const { data: functionResult, error: functionError } = await supabase
      .rpc('handle_newsletter_signup', { email_input: email });

    if (!functionError && functionResult?.success) {
      return functionResult;
    }

    console.log('Database function not available, using direct insert method');

    // Check if user already exists in leads table
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, email, form_source')
      .eq('email', email);

    if (existingLeads && existingLeads.length > 0) {
      // Check if they already have a newsletter signup lead
      const hasNewsletterLead = existingLeads.some(lead => 
        lead.form_source === 'NEWSLETTER' || 
        (lead.form_source === 'KONTAKT' && lead.email === email)
      );
      
      if (hasNewsletterLead) {
        return { success: true, message: 'Already subscribed to newsletter!' };
      }
    }

    // Try to create lead with NEWSLETTER form_source first
    let leadData = {
      first_name: 'Newsletter',
      last_name: 'Subscriber',
      email: email,
      message: 'Newsletter signup - €50 Print Gutschein',
      form_source: 'NEWSLETTER',
      status: 'NEW'
    };

    let { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    // If NEWSLETTER form_source fails, fall back to KONTAKT
    if (error && (error.message?.includes('form_source') || error.code === '23514')) {
      console.log('NEWSLETTER form_source not allowed, using KONTAKT fallback');
      leadData = {
        ...leadData,
        form_source: 'KONTAKT',
        message: 'Newsletter signup - €50 Print Gutschein (via Contact Form)'
      };

      const result = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      // If email already exists as a lead, don't treat as error
      if (error.code === '23505') {
        return { success: true, message: 'Already subscribed to newsletter!' };
      }
      console.error('Failed to insert lead:', error);
      throw new Error(`Database error: ${error.message}. Please ensure the 'leads' table exists and is properly configured.`);
    }

    // Also try to add to newsletter_subscribers table if it exists
    try {
      const { error: subscriberError } = await supabase
        .from('newsletter_subscribers')
        .insert([{ 
          email,
          created_at: new Date().toISOString(),
          active: true
        }]);
      
      if (subscriberError && subscriberError.code !== '23505') {
        console.warn('Newsletter subscribers insert failed:', subscriberError);
      }
    } catch (subscriptionError) {
      // Don't fail if newsletter_subscribers insert fails
      console.warn('Newsletter subscribers table error:', subscriptionError);
    }

    return { success: true, data, message: 'Newsletter signup successful' };
  } catch (error) {
    console.error('Error in newsletter form fallback:', error);
    throw new Error('Failed to process newsletter signup - please try again later');
  }
}