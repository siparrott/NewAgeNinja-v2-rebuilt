import { supabase } from './supabase';

export interface Lead {
  id: string;
  form_source: 'WARTELISTE' | 'KONTAKT';
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED';
}

export async function getLeads(status?: 'NEW' | 'CONTACTED' | 'CONVERTED') {
  try {
    const url = status ? `/api/crm/leads?status=${status.toLowerCase()}` : '/api/crm/leads';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leads');
    }
    
    const data = await response.json();
    
    // Transform the CRM lead data to match the expected Lead interface
    return data.map((lead: any) => ({
      id: lead.id,
      first_name: lead.name ? lead.name.split(' ')[0] : '',
      last_name: lead.name ? lead.name.split(' ').slice(1).join(' ') : '',
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      form_source: lead.source || 'MANUAL',
      status: lead.status ? lead.status.toUpperCase() : 'NEW',
      created_at: lead.createdAt
    }));
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

export async function updateLeadStatus(id: string, status: 'NEW' | 'CONTACTED' | 'CONVERTED') {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
}

export async function deleteLead(id: string) {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}