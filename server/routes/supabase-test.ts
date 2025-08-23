import { Router } from 'express';
import { supabaseAdmin, handleSupabaseError } from '../supabase.js';

const router = Router();

// GET /api/supabase-test/clients - Test Supabase with CRM clients
router.get('/clients', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('crm_clients')
      .select('*')
      .limit(10);

    if (error) {
      handleSupabaseError(error, 'select clients');
    }

    res.json({
      success: true,
      message: 'Supabase connection working!',
      data: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Supabase test error:', error);
    res.status(500).json({
      success: false,
      message: 'Supabase test failed',
      error: error.message
    });
  }
});

// GET /api/supabase-test/sessions - Test photography sessions
router.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('photography_sessions')
      .select('*')
      .limit(10);

    if (error) {
      handleSupabaseError(error, 'select sessions');
    }

    res.json({
      success: true,
      message: 'Photography sessions from Supabase',
      data: data || [],
      count: data?.length || 0
    });
  } catch (error: any) {
    console.error('Sessions test error:', error);
    res.status(500).json({
      success: false,
      message: 'Sessions test failed',
      error: error.message
    });
  }
});

// POST /api/supabase-test/client - Create a test client
router.post('/client', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    const { data, error } = await supabaseAdmin
      .from('crm_clients')
      .insert([{
        first_name: first_name || 'Test',
        last_name: last_name || 'User',
        email: email || `test${Date.now()}@example.com`,
        status: 'active'
      }])
      .select();

    if (error) {
      handleSupabaseError(error, 'insert client');
    }

    res.json({
      success: true,
      message: 'Client created in Supabase!',
      data: data?.[0] || null
    });
  } catch (error: any) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error.message
    });
  }
});

export default router;
