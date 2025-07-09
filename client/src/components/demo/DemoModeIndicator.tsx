import React from 'react';
import { Eye, ExternalLink } from 'lucide-react';

interface DemoModeIndicatorProps {
  onGetStarted?: () => void;
}

export const DemoModeIndicator: React.FC<DemoModeIndicatorProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 text-center relative">
      <div className="flex items-center justify-center space-x-2 text-sm">
        <Eye size={16} />
        <span className="font-medium">You're viewing a live demo</span>
        <span className="hidden sm:inline">- Explore all features with sample data</span>
      </div>
      
      <button
        onClick={onGetStarted}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors flex items-center space-x-1"
      >
        <span>Get Started</span>
        <ExternalLink size={12} />
      </button>
    </div>
  );
};

export default DemoModeIndicator;