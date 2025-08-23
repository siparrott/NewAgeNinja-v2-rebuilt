# Migration Strategy: Neon (Latest) → Fresh Supabase

## Problem Analysis
- ✅ **Neon Database**: Has latest schema, works with current app, but causes serverless crashes
- ❌ **Current Supabase**: Has outdated schema, missing recent updates
- 🎯 **Solution**: Create fresh Supabase with latest Neon schema + merge useful data

## Step 1: Backup Current Supabase Data
```bash
# Export existing Supabase data (if any is worth keeping)
npm run supabase:backup
```

## Step 2: Create Fresh Supabase Project
- New project: `newage-photography-crm-v2`
- Fresh start with latest schema from Neon
- Import only essential data from old Supabase

## Step 3: Generate Latest Schema Migration
```bash
# Generate SQL from current Neon schema
npm run db:generate-supabase-migration
```

## Step 4: Data Migration Plan
1. **Priority 1**: Core business data (clients, sessions, invoices)
2. **Priority 2**: Configuration and templates  
3. **Priority 3**: Blog posts and galleries
4. **Skip**: Test/demo data

## Step 5: Testing Strategy
1. Test fresh Supabase with latest schema
2. Verify all endpoints work with serverless
3. Migrate essential data incrementally
4. Switch production traffic

## Benefits of Fresh Start
✅ Clean schema matching current app
✅ No outdated table conflicts
✅ Serverless-optimized from day 1
✅ Better performance
✅ Easier to maintain

## Rollback Plan
- Keep Neon running during transition
- Test thoroughly before switching
- Can revert to Neon if issues arise
