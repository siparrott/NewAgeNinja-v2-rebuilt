# Development Deployment Checklist

## Pre-Deployment Steps
- [ ] Run system tests: `node test-complete-system.js`
- [ ] Verify 63 tools registered in server logs
- [ ] Confirm OpenAI Assistant updated with latest prompt
- [ ] Test core CRM operations (search, create, update)
- [ ] Verify database connectivity and schema

## Deployment Steps
1. **Environment Setup**
   - Ensure DATABASE_URL is configured
   - Verify OPENAI_API_KEY is set
   - Check all required environment variables

2. **Build Process**
   - Run: `npm run build`
   - Verify client and server builds complete
   - Check for TypeScript compilation errors

3. **Database Migration**
   - Run: `npm run db:push` (if schema changes)
   - Verify all tables exist and are accessible

4. **Server Deployment**
   - Start server: `npm run start`
   - Verify all 63 tools load successfully
   - Test health endpoint: `/api/health`

5. **Post-Deployment Verification**
   - Test CRM agent chat endpoint
   - Verify tool execution and responses
   - Check error logs for issues

## Success Criteria
- ✅ Server starts without errors
- ✅ All 63 tools registered successfully
- ✅ Database connectivity confirmed
- ✅ CRM agent responds to test queries
- ✅ System test pass rate > 70%

## Rollback Plan
If deployment fails:
1. Check server logs for specific errors
2. Verify environment variables
3. Test database connectivity
4. Restart services if needed
5. Review recent changes in git history