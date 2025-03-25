import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ProcessingStep from './ProcessingStep';
import { ProcessingStep as ProcessingStepType, Project } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

interface DocumentUploadProps {
  onUploadSuccess?: (documentId: number) => void;
  projectId?: number;
}

// Define the schema for creating a new project
const projectFormSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  user_id: z.number().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploadSuccess, projectId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Form for creating a new project
  const createProjectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      description: '',
      user_id: 1, // Default user ID
    },
  });

  const [processingSteps, setProcessingSteps] = useState<ProcessingStepType[]>([
    { id: 'upload', name: 'Document Upload', status: 'pending', progress: 0 },
    { id: 'extract', name: 'Text Extraction', status: 'pending', progress: 0 },
    { id: 'analyze', name: 'AI Analysis', status: 'pending', progress: 0 },
    { id: 'categorize', name: 'Obligation Categorization', status: 'pending', progress: 0 }
  ]);
  
  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest({ url: '/api/projects' });
        setProjects(data as Project[]);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [toast]);
  
  // Clean up any active intervals when component unmounts
  useEffect(() => {
    return () => {
      if (extractionIntervalRef.current) {
        clearInterval(extractionIntervalRef.current);
        extractionIntervalRef.current = null;
      }
    };
  }, []);

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

  // Handle creating a new project
  const handleCreateProject = async (values: ProjectFormValues) => {
    setIsCreatingProject(true);
    try {
      const newProject = await apiRequest({
        url: '/api/projects',
        method: 'POST',
        data: values,
      });
      
      // Add the new project to the projects list
      setProjects(prev => [...prev, newProject as Project]);
      
      // Select the new project in the dropdown
      setSelectedProjectId((newProject as Project).id);
      
      // Close the dialog and reset form
      setIsCreateProjectDialogOpen(false);
      createProjectForm.reset();
      
      toast({
        title: 'Success',
        description: 'Project created successfully.',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingProject(false);
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
      if (selectedProjectId) formData.append('projectId', selectedProjectId.toString());

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
      
      // Immediately mark text extraction as processing
      updateProcessingStep('extract', { status: 'processing', progress: 0 });
      
      // Start document extraction with real-time progress updates
      // The actual document processing happens here (API call)
      const extractionStartTime = Date.now();
      
      // Update extraction progress steadily based on documents of similar size completing in ~30 seconds
      const extractionProgress = { value: 0 };
      // Create new interval and store it in our ref for later access
      extractionIntervalRef.current = setInterval(() => {
        // Calculate how much time has passed since extraction started (0-100%)
        const elapsedMs = Date.now() - extractionStartTime;
        
        // Text extraction phase typically takes ~2-3 seconds for most documents
        if (elapsedMs < 3000) {
          // Text extraction phase (0-100%)
          extractionProgress.value = Math.min(Math.floor(elapsedMs / 30), 100);
          updateProcessingStep('extract', { progress: extractionProgress.value });
          
          if (extractionProgress.value >= 100) {
            // Mark extraction as complete
            updateProcessingStep('extract', { status: 'completed', progress: 100 });
            // Start AI Analysis immediately
            updateProcessingStep('analyze', { status: 'processing', progress: 0 });
          }
        } else if (elapsedMs < 45000) {
          // AI Analysis phase - takes much longer (45 seconds for average doc)
          // Convert elapsed time minus extraction phase to a percentage of expected analysis time
          const analysisTimeMs = elapsedMs - 3000;
          const analysisProgress = Math.min(Math.floor(analysisTimeMs / 420), 100);
          updateProcessingStep('analyze', { progress: analysisProgress });
          
          if (analysisProgress >= 100) {
            // Mark AI Analysis as complete when the progress reaches 100%
            updateProcessingStep('analyze', { status: 'completed', progress: 100 });
            // Start Obligation Categorization immediately
            updateProcessingStep('categorize', { status: 'processing', progress: 0 });
          }
        } else {
          // Categorization phase (remaining few seconds)
          const categorizationTimeMs = elapsedMs - 45000;
          const categorizationProgress = Math.min(Math.floor(categorizationTimeMs / 50), 100);
          updateProcessingStep('categorize', { progress: categorizationProgress });
        }
      }, 100);

      // Call the extraction API - this will actually process the document
      const extractResponse = await fetch(`/api/documents/${document.id}/extract`, {
        method: 'POST',
      });
      
      if (!extractResponse.ok) {
        // Clear any running intervals before throwing the error
        if (extractionIntervalRef.current) {
          clearInterval(extractionIntervalRef.current);
          extractionIntervalRef.current = null;
        }
        throw new Error(`Extraction failed: ${extractResponse.statusText}`);
      }
      
      // Process the extraction response
      const extractResult = await extractResponse.json();
      
      // Clear the extraction interval as we've now got the actual result
      if (extractionIntervalRef.current) {
        clearInterval(extractionIntervalRef.current);
        extractionIntervalRef.current = null;
      }
      
      // Mark all remaining steps as complete
      updateProcessingStep('extract', { status: 'completed', progress: 100 });
      updateProcessingStep('analyze', { status: 'completed', progress: 100 });
      updateProcessingStep('categorize', { status: 'completed', progress: 100 });
      
      // All processing complete
      setIsProcessing(false);
      
      const obligationCount = extractResult.count || 0;
      toast({
        title: 'Processing complete',
        description: `Document processed successfully. Found ${obligationCount} obligations.`,
      });
      
      // Invalidate documents and obligations queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/obligations'] });
      
      // Call onUploadSuccess callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(document.id);
      }
      
      // Reset the form
      setFile(null);
      setTitle('');
      setDescription('');
      // Keep the project selection for convenience
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingSteps([
        { id: 'upload', name: 'Document Upload', status: 'pending', progress: 0 },
        { id: 'extract', name: 'Text Extraction', status: 'pending', progress: 0 },
        { id: 'analyze', name: 'AI Analysis', status: 'pending', progress: 0 },
        { id: 'categorize', name: 'Obligation Categorization', status: 'pending', progress: 0 }
      ]);

    } catch (error) {
      console.error('Error uploading or processing document:', error);
      
      // Clean up interval if it exists
      if (extractionIntervalRef.current) {
        clearInterval(extractionIntervalRef.current);
        extractionIntervalRef.current = null;
      }
      
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'An error occurred during document processing',
        variant: 'destructive'
      });
      
      // Reset all states
      setIsUploading(false);
      setIsProcessing(false);
      
      // Update UI to show error states on the progress indicators
      updateProcessingStep('extract', { status: 'pending', progress: 0 });
      updateProcessingStep('analyze', { status: 'pending', progress: 0 });
      updateProcessingStep('categorize', { status: 'pending', progress: 0 });
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
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold" htmlFor="project-select">
                Project (Optional)
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center text-sm text-[#26E07F] hover:text-[#1fc068] hover:bg-[#e6f7f0]"
                onClick={() => setIsCreateProjectDialogOpen(true)}
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Create Project
              </Button>
            </div>
            <Select
              value={selectedProjectId?.toString() || "none"}
              onValueChange={(value) => setSelectedProjectId(value === "none" ? undefined : parseInt(value))}
            >
              <SelectTrigger id="project-select" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                // Keep the project selection
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
      
      {/* Create Project Dialog */}
      <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your contract documents and their obligations.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createProjectForm}>
            <form onSubmit={createProjectForm.handleSubmit(handleCreateProject)} className="space-y-4 pt-4">
              <FormField
                control={createProjectForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createProjectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateProjectDialogOpen(false);
                    createProjectForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingProject}>
                  {isCreatingProject ? (
                    <>
                      <span className="mr-2">Creating...</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUpload;
