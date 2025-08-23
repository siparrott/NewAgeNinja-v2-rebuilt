# Supabase Migration Guide for New Age Photography CRM

## 1. Project Setup Completed ✅
- Project URL: [Will be provided]
- Service Role Key: [Will be provided] 
- Anon Public Key: [Will be provided]

## 2. Database Schema Migration
Copy and paste this SQL in your Supabase SQL Editor:

```sql
-- [The migration SQL is in supabase-migration.sql file]
```

## 3. Environment Variables for Vercel
Add these in your Vercel dashboard under Settings > Environment Variables:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-public-key-here
```

## 4. Test Endpoints After Setup
- Health Check: https://your-vercel-app.vercel.app/health
- Basic Test: https://your-vercel-app.vercel.app/api/test
- Clients Test: https://your-vercel-app.vercel.app/api/supabase-test/clients
- Sessions Test: https://your-vercel-app.vercel.app/api/supabase-test/sessions

## 5. Expected Results
All endpoints should return JSON without errors, confirming:
- ✅ Serverless function working
- ✅ Supabase connection established  
- ✅ Database queries working
- ✅ No more crashes!

## 6. Next Steps After Success
- [ ] Migrate existing data from Neon
- [ ] Convert remaining routes to Supabase
- [ ] Add real-time features
- [ ] Implement Supabase Auth
- [ ] Deploy production version

## Troubleshooting
- If connection fails: Check environment variables
- If tables not found: Re-run migration SQL
- If routes 404: Check Vercel deployment logs
