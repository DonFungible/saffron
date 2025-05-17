'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageIcon, UploadIcon, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';

// Types
interface FileWithPreview extends File {
  preview: string;
}

interface FileDropzoneProps {
  onFilesChange?: (files: FileWithPreview[]) => void;
  className?: string;
}

export function FileDropzone({ onFilesChange, className }: FileDropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        console.error(fileRejections[0]?.errors[0]?.message);
        return;
      }

      const filesWithPreviews = acceptedFiles.map((file) => 
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles((prevFiles) => [...prevFiles, ...filesWithPreviews]);
      onFilesChange?.(filesWithPreviews);
    },
    [onFilesChange]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      onFilesChange?.(newFiles);
      return newFiles;
    });
  }, [onFilesChange]);

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  return (

			<div className="space-y-4 p-4 border inline-block rounded-xl bg-blue-400/10">
      <div
        {...getRootProps()}
        className={cn(
          'relative aspect-4/3 flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-background hover:bg-muted/50',
          className
        )}
      >
        <input {...getInputProps()} />
        
        {/* Drag-and-drop instructions: only show if no files */}
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag & drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts images, GIFs, and videos
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="w-full">
            <div className="text-sm font-medium mb-2">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
              {files.slice(0, 7).map((file, index) => (
                <div key={index} className="group relative aspect-square rounded-md overflow-hidden border border-border bg-muted">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {files.length > 8 && (
                <div className="flex aspect-square items-center justify-center rounded-md border border-border bg-muted text-muted-foreground px-[2px]">
                  <span className="text-xs font-medium">+{files.length - 7} more</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={cn('w-full', className)}>
        <Button 
          type="button" 
          className="w-full"
          disabled={files.length === 0}
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );
}

// Usage Example
export default function FileDropzoneExample() {
  const handleFilesChange = (files: FileWithPreview[]) => {
    console.log('Files changed:', files);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Files</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop images, GIFs, or videos to upload
          </p>
        </div>
        
        <FileDropzone onFilesChange={handleFilesChange} />
      </div>
    </div>
  );
}
