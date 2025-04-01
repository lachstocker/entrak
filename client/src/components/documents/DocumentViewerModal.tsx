import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerModalProps {
  documentId: number | null;
  documentTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({
  documentId,
  documentTitle,
  isOpen,
  onClose
}: DocumentViewerModalProps) {
  if (!documentId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle>
            {documentTitle || 'Document Viewer'}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <DocumentViewer documentId={documentId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}