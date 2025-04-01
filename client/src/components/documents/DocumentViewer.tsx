import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentViewerProps {
  documentId: number;
  onBack?: () => void;
}

export function DocumentViewer({ documentId, onBack }: DocumentViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHtmlContent = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiRequest({
          url: `/api/documents/${documentId}/html`,
          method: 'GET'
        });
        
        setHtmlContent(response.html);
      } catch (err) {
        console.error('Error fetching document HTML:', err);
        setError('Failed to load document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHtmlContent();
  }, [documentId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading document...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!htmlContent) {
    return (
      <div className="p-4">
        <Alert>
          <AlertDescription>
            This document needs to be converted to HTML before it can be viewed in the browser.
            Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-auto p-4 bg-white">
      <div
        className="document-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      
      <style jsx global>{`
        .document-content {
          font-family: 'Open Sans', sans-serif;
          line-height: 1.6;
        }
        
        .document-content h1,
        .document-content h2,
        .document-content h3,
        .document-content h4,
        .document-content h5,
        .document-content h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          color: #0F2B46;
        }
        
        .document-content h1 {
          font-size: 1.8rem;
        }
        
        .document-content h2 {
          font-size: 1.5rem;
        }
        
        .document-content h3 {
          font-size: 1.25rem;
        }
        
        .document-content p {
          margin-bottom: 1em;
        }
        
        .document-content ul,
        .document-content ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }
        
        .document-content li {
          margin-bottom: 0.5em;
        }
        
        .document-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        
        .document-content th,
        .document-content td {
          border: 1px solid #e2e8f0;
          padding: 0.5em;
        }
        
        .document-content th {
          background-color: #f7fafc;
          font-weight: 600;
        }
        
        .document-content img {
          max-width: 100%;
          height: auto;
        }
        
        .document-content a {
          color: #3182ce;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}