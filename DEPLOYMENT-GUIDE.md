# Deployment Guide - Photography CRM

## Current Status
✅ **Your application is ready for deployment**

## Pre-Deployment Checklist
- ✅ Client build: Ready (Vite optimized)
- ✅ Server build: Ready (ES modules)
- ✅ Server configuration: Binds to 0.0.0.0:5000
- ✅ Environment: Production configured
- ✅ Database: Connected to Neon PostgreSQL
- ✅ Static files: Served from dist/public

## Deployment Commands

### Standard Deployment
```bash
npm run build
npm start
```

### Clean Deployment (Recommended)
```bash
node scripts/deploy-clean.js
```

## Deployment Options

### Option 1: Replit Autoscale (Recommended)
1. Go to **Deployments** tab in Replit
2. Click **"Deploy"** 
3. Select **"Autoscale"** deployment type
4. Set environment variables (see below)
5. Deploy

### Option 2: Replit Reserved VM
1. Go to **Deployments** tab in Replit  
2. Click **"Deploy"**
3. Select **"Reserved VM"** deployment type
4. Choose VM size (Small/Medium recommended)
5. Set environment variables (see below)
6. Deploy

## Required Environment Variables

Set these in your deployment configuration:

```
NODE_ENV=production
DATABASE_URL=your_neon_database_url
PORT=5000
```

Optional environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Verification

After deployment, verify:
1. **App loads**: Visit your deployment URL
2. **Database connection**: Check that data loads properly  
3. **Static files**: Images and CSS load correctly
4. **API endpoints**: Forms and data operations work

## Troubleshooting

### If deployment fails:
1. **Check logs** in the Deployments tab
2. **Verify environment variables** are set correctly
3. **Run build locally** first: `npm run build`
4. **Contact Replit Support** if issues persist

### Common Issues:
- **Port binding**: Server is configured for 0.0.0.0 (external access)
- **Static files**: Served from dist/public automatically
- **Database**: Uses DATABASE_URL environment variable
- **ES modules**: Properly configured with "type": "module"

## Best Practices for Future Updates

1. **Always test locally** before deploying:
   ```bash
   npm run build
   NODE_ENV=production npm start
   ```

2. **Use the clean deploy script**:
   ```bash
   node scripts/deploy-clean.js
   ```

3. **Keep deployments simple** - avoid complex build configurations

4. **Monitor deployment logs** for any issues

## Rollback Plan

If a deployment fails:
1. **Use Replit's deployment history** to rollback
2. **Or redeploy from a working git commit**
3. **Keep this current working version** as a known-good state

---

**Your application is now ready for reliable deployment with this clean, tested configuration.**