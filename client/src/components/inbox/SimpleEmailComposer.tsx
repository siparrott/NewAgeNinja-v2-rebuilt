import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

interface SimpleEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (data: any) => void;
}

const SimpleEmailComposer: React.FC<SimpleEmailComposerProps> = ({
  isOpen,
  onClose,
  onSent
}) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    console.log('Email sent:', { to, subject, body });
    onSent?.({ to, subject, body });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-5/6 flex flex-col overflow-hidden"
        dir="ltr"
        style={{ 
          direction: 'ltr',
          textAlign: 'left'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-semibold">Compose Email</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 flex-1">
          {/* To field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              style={{ 
                direction: 'ltr !important',
                textAlign: 'left !important',
                unicodeBidi: 'embed'
              }}
            />
          </div>

          {/* Subject field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              style={{ 
                direction: 'ltr !important',
                textAlign: 'left !important',
                unicodeBidi: 'embed'
              }}
            />
          </div>

          {/* Message body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message here..."
              rows={10}
              className="w-full border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
              style={{ 
                direction: 'ltr !important',
                textAlign: 'left !important',
                unicodeBidi: 'embed',
                writingMode: 'horizontal-tb'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Simple Email Composer
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!to || !subject}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleEmailComposer;