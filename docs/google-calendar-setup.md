# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for your photography CRM to automatically sync photography sessions with your Google Calendar.

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select an existing project
3. Name your project (e.g., "Photography CRM Calendar")
4. Note down your Project ID

### 1.2 Enable Google Calendar API
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. First, configure the OAuth consent screen:
   - User Type: External (for business use)
   - App name: "Photography CRM"
   - User support email: Your business email
   - Authorized domains: Add your domain (e.g., newagefotografie.com)
   - Scopes: Add these scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: "Photography CRM Calendar Integration"
   - Authorized redirect URIs: 
     - `https://your-domain.com/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback` (for development)

### 1.4 Download Credentials
1. Click on your newly created OAuth client
2. Download the JSON file
3. Note down the `client_id` and `client_secret`

## Step 2: Environment Variables Setup

Add these environment variables to your `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
```

## Step 3: Database Schema Setup

The following tables need to be added to store Google Calendar integration data:

```sql
-- Google Calendar integration settings
CREATE TABLE google_calendar_integrations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP,
  calendar_id VARCHAR(255),
  sync_enabled BOOLEAN DEFAULT false,
  sync_direction VARCHAR(20) DEFAULT 'both', -- 'import', 'export', 'both'
  auto_sync BOOLEAN DEFAULT false,
  sync_interval INTEGER DEFAULT 15, -- minutes
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync mapping between CRM sessions and Google Calendar events
CREATE TABLE calendar_sync_mappings (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  google_event_id VARCHAR(255) NOT NULL,
  calendar_id VARCHAR(255) NOT NULL,
  sync_direction VARCHAR(20),
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, google_event_id)
);
```

## Step 4: Required NPM Packages

Install the Google APIs client library:

```bash
npm install googleapis
npm install @types/node
```

## Step 5: Implementation Features

Once configured, the Google Calendar integration provides:

### Core Features
- **Two-way sync**: Photography sessions ↔ Google Calendar events
- **Real-time sync**: Automatic synchronization every 15 minutes
- **Conflict resolution**: Smart handling of scheduling conflicts
- **Multiple calendars**: Support for multiple Google calendars

### Photography Session → Google Calendar
- Session title becomes event title
- Client information added to event description
- Location details mapped to event location
- Equipment list included in notes
- Pricing information secured (not synced to Google)

### Google Calendar → Photography Session
- External events imported as sessions
- Client details extracted from event description
- Location information preserved
- Equipment requirements noted

### Sync Settings
- **Import Only**: Google Calendar → Photography CRM
- **Export Only**: Photography CRM → Google Calendar  
- **Two-way Sync**: Bidirectional synchronization
- **Auto Sync**: Automatic sync every 15 minutes
- **Manual Sync**: On-demand synchronization

## Step 6: Security Considerations

### Data Privacy
- Client pricing information is never synced to Google Calendar
- Sensitive notes can be marked as "internal only"
- OAuth tokens are encrypted and stored securely

### Access Control
- Each photographer has their own Google Calendar integration
- Admin users can manage integration settings
- Sync can be disabled per user

## Step 7: Testing the Integration

1. Navigate to Calendar page in your Photography CRM
2. Click "Google Calendar" button
3. Click "Connect Google Calendar"
4. Complete OAuth flow in popup window
5. Configure sync settings
6. Test with a sample photography session

## Step 8: Troubleshooting

### Common Issues

**"Authorization Error"**
- Check OAuth redirect URIs match exactly
- Verify domain is authorized in Google Cloud Console
- Ensure Calendar API is enabled

**"Token Expired"**
- Integration automatically refreshes tokens
- If persistent, disconnect and reconnect

**"Sync Conflicts"**
- Check sync direction settings
- Manually resolve conflicts in sync log
- Consider disabling auto-sync temporarily

**"Events Not Appearing"**
- Verify correct calendar is selected
- Check date range filters
- Ensure sync is enabled and working

### Support

For technical support with Google Calendar integration:
1. Check the sync status in Calendar settings
2. Review sync logs in admin panel
3. Test API connectivity with manual sync
4. Contact support with specific error messages

## Step 9: Advanced Configuration

### Custom Calendar Selection
- Choose which Google calendar to sync with
- Support for multiple business calendars
- Separate calendars for different photographers

### Event Filtering
- Sync only specific session types
- Filter by client importance level
- Exclude cancelled or completed sessions

### Notification Settings
- Email alerts for sync failures
- Conflict resolution notifications
- Daily sync summary reports

---

This integration transforms your photography business workflow by keeping your professional calendar always up-to-date with your CRM system, ensuring you never miss an appointment or double-book a session.