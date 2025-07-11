import React, { useState } from 'react';
import { Upload, Download, Calendar, AlertCircle, Check } from 'lucide-react';

interface ImportCalendarEventsProps {
  onImportComplete: (count: number) => void;
}

const ImportCalendarEvents: React.FC<ImportCalendarEventsProps> = ({ onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleGoogleCalendarImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // First, try to export from Google Calendar
      const response = await fetch('/api/calendar/import/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'import_existing',
          // In a real implementation, this would use OAuth tokens
          // For now, we'll provide instructions for manual import
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult({ success: true, count: result.imported });
      onImportComplete(result.imported);
    } catch (error) {
      setImportResult({ success: false, error: 'Import failed. Please try manual import.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualImport = () => {
    // Provide instructions for manual import
    alert('Manual Import Instructions:\n\n1. Go to Google Calendar\n2. Click gear icon > Settings\n3. Select your calendar\n4. Click "Export" to download .ics file\n5. Upload the file here');
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Import Existing Calendar Events</h4>
        <p className="text-sm text-blue-800 mb-3">
          Import your existing Google Calendar bookings into the photography CRM system.
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGoogleCalendarImport}
            disabled={isImporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Calendar size={16} />
                <span>Auto Import from Google</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleManualImport}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <Upload size={16} />
            <span>Manual Import (.ics)</span>
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center space-x-2">
            {importResult.success ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
              {importResult.success 
                ? `Successfully imported ${importResult.count} events!` 
                : 'Import failed'
              }
            </span>
          </div>
          {importResult.error && (
            <p className="text-sm text-red-800 mt-2">{importResult.error}</p>
          )}
        </div>
      )}

      <div className="bg-amber-50 p-4 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">Alternative: Manual Entry</h4>
        <p className="text-sm text-amber-800">
          You can also manually create photography sessions in the CRM for your existing bookings. 
          This gives you full control over client details, pricing, and session information.
        </p>
      </div>
    </div>
  );
};

export default ImportCalendarEvents;