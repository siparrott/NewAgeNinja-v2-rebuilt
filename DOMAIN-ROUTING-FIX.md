# Domain Routing Fix for newagefotografie.com

## Problem Identified
- **www.newagefotografie.com** works perfectly ✅
- **newagefotografie.com** (root domain) shows SSL security warning ❌

## Root Cause
The SSL certificate is only configured for `www.newagefotografie.com` but not for the root domain `newagefotografie.com`.

## SSL Certificate Issue
```bash
# Working domain
curl -I https://www.newagefotografie.com
# Result: HTTP/2 200 (Success)

# Broken domain  
curl -I https://newagefotografie.com
# Result: SSL: no alternative certificate subject name matches target host name
```

## Solution Required
The SSL certificate needs to include both domains:
- `newagefotografie.com` (root domain)
- `www.newagefotografie.com` (www subdomain)

## DNS Configuration Fix
You need to update your DNS settings to include both domains in the SSL certificate:

### Option 1: Multi-domain SSL Certificate
Configure your hosting provider (Google Cloud Run/EasyName) to include both domains:
- Primary domain: `www.newagefotografie.com`
- Alternative domain: `newagefotografie.com`

### Option 2: Wildcard SSL Certificate  
Use a wildcard certificate: `*.newagefotografie.com`

### Option 3: Redirect Configuration
Set up a proper redirect from root domain to www:
- `newagefotografie.com` → `www.newagefotografie.com`
- Both domains need valid SSL certificates

## Implementation Steps
1. Contact your domain registrar (EasyName)
2. Request SSL certificate for both domains
3. Update DNS A records to point both domains to the same IP
4. Configure proper 301 redirects

## Current Status
- ✅ www.newagefotografie.com: Working with SSL
- ❌ newagefotografie.com: SSL certificate missing
- 🔄 Google Cloud Run deployment: Needs domain configuration update

## Expected Result
After fixing the SSL certificate configuration:
- Both `newagefotografie.com` AND `www.newagefotografie.com` should work
- Root domain should redirect to www version with proper SSL
- No more security warnings for users