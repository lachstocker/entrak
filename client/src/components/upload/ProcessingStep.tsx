import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface ProcessingStepProps {
  name: string;
  status: 'completed' | 'processing' | 'pending';
  progress: number;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ name, status, progress }) => {
  return (
    <div className={`flex items-center ${status === 'pending' ? 'opacity-50' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
        status === 'completed' 
          ? 'bg-[#26E07F]' 
          : status === 'processing' 
            ? 'bg-[#0F2B46]' 
            : 'bg-gray-300'
      }`}>
        {status === 'completed' ? (
          <Check className="text-white text-sm" size={16} />
        ) : status === 'processing' ? (
          <Loader2 className="text-white text-sm animate-spin" size={16} />
        ) : (
          <span className="material-icons text-white text-sm">category</span>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{name}</p>
          <p className={`
            ${status === 'completed' ? 'text-[#26E07F]' : ''} 
            ${status === 'processing' ? 'text-[#0F2B46]' : ''}
            ${status === 'pending' ? 'text-gray-500' : ''}
          `}>
            {status === 'completed' ? 'Complete' : 
              status === 'processing' && name === 'Document Upload' ? `Uploading (${progress}%)` :
              status === 'processing' && name === 'Text Extraction' ? `Extracting Text (${progress}%)` :
              status === 'processing' && name === 'AI Analysis' ? `Analyzing (${progress}%)` :
              status === 'processing' && name === 'Obligation Categorization' ? `Categorizing (${progress}%)` :
              'Pending'}
          </p>
        </div>
        
        <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
          <div 
            className={`h-1 rounded-full ${
              status === 'completed' 
                ? 'bg-[#26E07F]' 
                : status === 'processing' 
                  ? 'bg-[#0F2B46]' 
                  : 'bg-gray-300'
            }`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProcessingStep;
