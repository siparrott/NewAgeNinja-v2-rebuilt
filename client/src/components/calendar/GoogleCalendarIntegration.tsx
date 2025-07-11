import React, { useState, useEffect } from 'react';
import { Calendar, Settings, RotateCcw, Check, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface GoogleCalendarIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: () => void;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectedCalendars, setConnectedCalendars] = useState<any[]>([]);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInterval: '15m',
    syncDirection: 'both', // 'import', 'export', 'both'
    defaultCalendar: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    }
  }, [isOpen]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/calendar/google/status');
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.connected ? 'connected' : 'disconnected');
        if (data.connected) {
          setConnectedCalendars(data.calendars || []);
          setSyncSettings(prev => ({ ...prev, ...data.settings }));
          setLastSync(data.lastSync ? new Date(data.lastSync) : null);
        }
      }
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
    }
  };

  const initiateGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setConnectionStatus('connecting');
      
      // Get Google OAuth URL from backend
      const response = await fetch('/api/calendar/google/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      
      const { authUrl } = await response.json();
      
      // Open Google OAuth in new window
      const authWindow = window.open(
        authUrl,
        'google-calendar-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for auth completion
      const checkAuth = setInterval(async () => {
        try {
          if (authWindow?.closed) {
            clearInterval(checkAuth);
            // Check if auth was successful
            await checkConnectionStatus();
            if (connectionStatus === 'connected') {
              onConnectionSuccess?.();
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          clearInterval(checkAuth);
          setIsLoading(false);
          setConnectionStatus('disconnected');
        }
      }, 1000);

    } catch (error) {
      console.error('Google auth error:', error);
      setError('Failed to connect to Google Calendar. Please try again.');
      setConnectionStatus('disconnected');
      setIsLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/calendar/google/disconnect', { method: 'POST' });
      if (response.ok) {
        setConnectionStatus('disconnected');
        setConnectedCalendars([]);
        setLastSync(null);
      }
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      setError('Failed to disconnect Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const syncNow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/calendar/google/sync', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const result = await response.json();
      setLastSync(new Date());
      
      // Show sync results
      console.log('Sync completed:', result);
      
    } catch (error) {
      console.error('Sync error:', error);
      setError('Failed to sync calendars. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSyncSettings = async (newSettings: Partial<typeof syncSettings>) => {
    try {
      const updatedSettings = { ...syncSettings, ...newSettings };
      setSyncSettings(updatedSettings);
      
      await fetch('/api/calendar/google/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
    } catch (error) {
      console.error('Error updating sync settings:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Google Calendar Integration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Connection Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h3>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              {connectionStatus === 'connected' && (
                <>
                  <Check className="h-5 w-5 text-green-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Connected to Google Calendar</p>
                    <p className="text-sm text-green-700">
                      {connectedCalendars.length} calendar(s) available for sync
                    </p>
                  </div>
                  <button
                    onClick={disconnectGoogleCalendar}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </>
              )}
              
              {connectionStatus === 'connecting' && (
                <>
                  <RefreshCw className="h-5 w-5 text-blue-600 mr-3 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Connecting to Google Calendar...</p>
                    <p className="text-sm text-blue-700">Please complete authorization in the popup window</p>
                  </div>
                </>
              )}
              
              {connectionStatus === 'disconnected' && (
                <>
                  <AlertCircle className="h-5 w-5 text-gray-600 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Not connected to Google Calendar</p>
                    <p className="text-sm text-gray-700">Connect to sync your events automatically</p>
                  </div>
                  <button
                    onClick={initiateGoogleAuth}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Connect Google Calendar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Connected Calendars */}
          {connectionStatus === 'connected' && connectedCalendars.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Calendars</h3>
              <div className="space-y-2">
                {connectedCalendars.map((calendar) => (
                  <div key={calendar.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{calendar.summary}</p>
                      <p className="text-sm text-gray-600">{calendar.description || 'No description'}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {calendar.primary && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Primary</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Settings */}
          {connectionStatus === 'connected' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Automatic Sync</p>
                    <p className="text-sm text-gray-600">Automatically sync changes every few minutes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={(e) => updateSyncSettings({ autoSync: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Direction
                  </label>
                  <select
                    value={syncSettings.syncDirection}
                    onChange={(e) => updateSyncSettings({ syncDirection: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="both">Two-way sync (Photography CRM ↔ Google Calendar)</option>
                    <option value="import">Import only (Google Calendar → Photography CRM)</option>
                    <option value="export">Export only (Photography CRM → Google Calendar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Google Calendar
                  </label>
                  <select
                    value={syncSettings.defaultCalendar}
                    onChange={(e) => updateSyncSettings({ defaultCalendar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select default calendar...</option>
                    {connectedCalendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Manual Sync */}
          {connectionStatus === 'connected' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Sync</h3>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Sync Now</p>
                  <p className="text-sm text-gray-600">
                    {lastSync ? `Last synced: ${lastSync.toLocaleString()}` : 'Never synced'}
                  </p>
                </div>
                <button
                  onClick={syncNow}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center disabled:opacity-50"
                >
                  <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Google Calendar Integration Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Photography sessions will appear as events in your Google Calendar</li>
              <li>• Changes made in either calendar will sync automatically</li>
              <li>• Client information and booking details are preserved during sync</li>
              <li>• You can choose which Google calendar to sync with</li>
              <li>• All data remains secure with Google's OAuth authentication</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarIntegration;