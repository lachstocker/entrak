import React, { useState, useEffect } from 'react';
import { TrashIcon, DownloadIcon, FileText, Clock, UploadCloud } from 'lucide-react';
import TopNavbar from '@/components/layout/TopNavbar';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import DocumentUpload from '@/components/upload/DocumentUpload';
import { useDocuments } from '@/hooks/useDocuments';
import { Document, Project } from '@/types';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLocation } from 'wouter';

const Documents: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const { documents, isLoading, error } = useDocuments(undefined, selectedProjectId);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Fetch projects for the filter dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await apiRequest('GET', '/api/projects') as Project[];
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  const handleDeleteClick = (documentId: number) => {
    setDeleteDocumentId(documentId);
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteDocumentId) return;
    
    try {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/documents/${deleteDocumentId}`);
      
      toast({
        title: 'Document deleted',
        description: 'The document has been deleted successfully',
      });
      
      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDocumentId(null);
    }
  };
  
  const handleDownload = async (document: Document) => {
    try {
      window.open(`/api/documents/${document.id}/download`, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleExtractObligations = async (documentId: number) => {
    try {
      toast({
        title: 'Processing',
        description: 'Extracting obligations from document...',
      });
      
      const response = await apiRequest('POST', `/api/documents/${documentId}/extract`);
      const data = await response.json();
      
      toast({
        title: 'Extraction complete',
        description: `Successfully extracted ${data.obligations.length} obligations`,
      });
      
      // Refresh documents list to update extraction status
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } catch (error) {
      console.error('Error extracting obligations:', error);
      toast({
        title: 'Extraction failed',
        description: 'Failed to extract obligations. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
  };
  
  const getFileTypeLabel = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return 'PDF';
      case 'docx': return 'DOCX';
      case 'txt': return 'TXT';
      default: return fileType.toUpperCase();
    }
  };
  
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <TopNavbar title="Documents" />
      
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-montserrat font-bold text-3xl text-[#0F2B46] mb-2">Documents</h1>
              <p className="text-gray-600">Upload and manage your contract documents</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {/* Project filter */}
              <div className="w-[200px]">
                <Select
                  value={selectedProjectId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedProjectId(value ? parseInt(value) : undefined);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="flex items-center"
                onClick={() => setShowUploadModal(true)}
              >
                <UploadCloud className="mr-2" size={18} />
                Upload Document
              </Button>
            </div>
          </div>
          
          {/* Documents Table */}
          <div className="bg-white rounded-lg shadow-[0px_4px_20px_rgba(0,0,0,0.1)] p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-red-500">
                      Error loading documents: {error instanceof Error ? error.message : 'Unknown error'}
                    </TableCell>
                  </TableRow>
                ) : documents && documents.length > 0 ? (
                  documents.map((document) => (
                    <TableRow key={document.id} className="hover:bg-[#E6F0F5] transition-colors">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="bg-[#E6F0F5] p-2 rounded-full mr-3">
                            <FileText className="text-[#0F2B46]" size={18} />
                          </div>
                          <div>
                            <div className="font-medium">{document.title}</div>
                            {document.description && (
                              <div className="text-sm text-gray-500">{document.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFileTypeLabel(document.file_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-2 text-gray-400" size={14} />
                          {formatDate(document.upload_date)}
                        </div>
                      </TableCell>
                      <TableCell>v{document.version}</TableCell>
                      <TableCell>
                        {document.project ? (
                          <div className="font-medium">{document.project.name}</div>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {document.extracted ? (
                          <Badge variant="default" className="bg-[#26E07F]">Processed</Badge>
                        ) : (
                          <Badge variant="outline">Not Processed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownload(document)}
                            title="Download"
                          >
                            <DownloadIcon size={18} />
                          </Button>
                          
                          {!document.extracted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExtractObligations(document.id)}
                              title="Extract Obligations"
                            >
                              <FileText size={18} />
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(document.id)}
                            title="Delete"
                          >
                            <TrashIcon size={18} className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No documents found. Upload a document to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Upload Document Dialog */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a contract document to extract obligations
            </DialogDescription>
          </DialogHeader>
          
          <DocumentUpload 
            onUploadSuccess={handleUploadSuccess}
            projectId={selectedProjectId}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDocumentId !== null} onOpenChange={(open) => !open && setDeleteDocumentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocumentId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Documents;
