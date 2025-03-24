import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProcessingStep from './ProcessingStep';
import { ProcessingStep as ProcessingStepType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

interface DocumentUploadProps {
  onUploadSuccess?: (documentId: number) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [processingSteps, setProcessingSteps] = useState<ProcessingStepType[]>([
    { id: 'upload', name: 'Document Upload', status: 'pending', progress: 0 },
    { id: 'extract', name: 'Text Extraction', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'AI Analysis', status: 'pending', progress: 0 },
    { id: 'categorize', name: 'Obligation Categorization', status: 'pending', progress: 0 }
  ]);

  const updateProcessingStep = (id: string, updates: Partial<ProcessingStepType>) => {
    setProcessingSteps(steps => 
      steps.map(step => 
        step.id === id ? { ...step, ...updates } : step
      )
    );
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOCX, or TXT file.',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size should not exceed 10MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!validTypes.includes(droppedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOCX, or TXT file.',
          variant: 'destructive'
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size should not exceed 10MB.',
          variant: 'destructive'
        });
        return;
      }
      
      setFile(droppedFile);
      setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a title for the document.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      updateProcessingStep('upload', { status: 'processing', progress: 0 });
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          updateProcessingStep('upload', { progress: newProgress });
          return newProgress;
        });
      }, 300);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      if (description) formData.append('description', description);

      // Upload document
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      updateProcessingStep('upload', { status: 'completed', progress: 100 });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const document = await response.json();
      
      // Start processing document
      setIsProcessing(true);
      
      // Start text extraction
      updateProcessingStep('extract', { status: 'processing', progress: 0 });
      
      // Simulate extraction progress
      let extractionProgress = 0;
      const extractionInterval = setInterval(() => {
        extractionProgress += 20;
        if (extractionProgress >= 100) {
          clearInterval(extractionInterval);
          updateProcessingStep('extract', { status: 'completed', progress: 100 });
          
          // Start AI Analysis
          updateProcessingStep('analyze', { status: 'processing', progress: 0 });
          
          // Simulate AI Analysis progress
          let analysisProgress = 0;
          const analysisInterval = setInterval(() => {
            analysisProgress += 5;
            updateProcessingStep('analyze', { progress: analysisProgress });
            
            if (analysisProgress >= 100) {
              clearInterval(analysisInterval);
              updateProcessingStep('analyze', { status: 'completed', progress: 100 });
              
              // Start Obligation Categorization
              updateProcessingStep('categorize', { status: 'processing', progress: 0 });
              
              // Simulate categorization progress
              let categorizationProgress = 0;
              const categorizationInterval = setInterval(() => {
                categorizationProgress += 10;
                updateProcessingStep('categorize', { progress: categorizationProgress });
                
                if (categorizationProgress >= 100) {
                  clearInterval(categorizationInterval);
                  updateProcessingStep('categorize', { status: 'completed', progress: 100 });
                  
                  // All processing complete
                  setIsProcessing(false);
                  
                  toast({
                    title: 'Processing complete',
                    description: 'Document has been processed successfully.',
                  });
                  
                  // Invalidate documents query to refresh the list
                  queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                  
                  // Call onUploadSuccess callback if provided
                  if (onUploadSuccess) {
                    onUploadSuccess(document.id);
                  }
                  
                  // Reset the form
                  setFile(null);
                  setTitle('');
                  setDescription('');
                  setIsUploading(false);
                  setUploadProgress(0);
                  setProcessingSteps([
                    { id: 'upload', name: 'Document Upload', status: 'pending', progress: 0 },
                    { id: 'extract', name: 'Text Extraction', status: 'pending', progress: 0 },
                    { id: 'analyze', name: 'AI Analysis', status: 'pending', progress: 0 },
                    { id: 'categorize', name: 'Obligation Categorization', status: 'pending', progress: 0 }
                  ]);
                }
              }, 200);
            }
          }, 300);
        }
      }, 200);

      // Call the extraction API
      const extractResponse = await fetch(`/api/documents/${document.id}/extract`, {
        method: 'POST',
      });
      
      if (!extractResponse.ok) {
        throw new Error(`Extraction failed: ${extractResponse.statusText}`);
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive'
      });
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6 mb-8">
      <h2 className="font-montserrat font-semibold text-xl mb-6">Upload Contract Document</h2>
      
      {file && !isUploading ? (
        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" htmlFor="document-title">
              Document Title
            </label>
            <input
              id="document-title"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" htmlFor="document-description">
              Description (Optional)
            </label>
            <textarea
              id="document-description"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-[#26E07F] focus:ring focus:ring-[#26E07F] focus:ring-opacity-50"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter document description"
            />
          </div>
          
          <div className="flex items-center p-4 bg-[#E6F0F5] rounded-md mb-4">
            <FileText className="text-[#0F2B46] mr-3" />
            <div className="flex-1">
              <p className="font-semibold">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setTitle('');
                setDescription('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              Process Document
            </Button>
          </div>
        </div>
      ) : !isUploading && !isProcessing ? (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#26E07F] transition-colors cursor-pointer"
          onClick={handleFileSelect}
          onDragOver={handleDragOver}
          onDrop={handleFileDrop}
        >
          <div className="flex flex-col items-center">
            <Upload className="text-5xl text-gray-400 mb-4 w-16 h-16" />
            <h3 className="font-montserrat font-semibold text-lg mb-2">Drag and drop your document here</h3>
            <p className="text-gray-500 mb-6">or click to browse files (PDF, DOCX, TXT)</p>
            <Button variant="secondary">
              Select File
            </Button>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="font-montserrat font-semibold text-lg mb-4">
            Processing: {file?.name}
          </h3>
          
          <div className="space-y-4">
            {processingSteps.map(step => (
              <ProcessingStep 
                key={step.id}
                name={step.name}
                status={step.status}
                progress={step.progress}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
