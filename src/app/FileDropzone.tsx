'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<
    Record<string, { status: 'pending' | 'uploading' | 'success' | 'error'; error?: string }>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        console.error(fileRejections[0]?.errors[0]?.message);
        setUploadError(
          `File rejected: ${fileRejections[0]?.errors[0]?.message || 'Unknown error'}`,
        );
        return;
      }

      const filesWithPreviews = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );

      // Initialize status for each file
      const newFileStatus: Record<
        string,
        { status: 'pending' | 'uploading' | 'success' | 'error'; error?: string }
      > = {};
      filesWithPreviews.forEach((file) => {
        newFileStatus[file.name] = { status: 'pending' };
      });
      setFileStatus((prev) => ({ ...prev, ...newFileStatus }));

      setFiles((prevFiles) => [...prevFiles, ...filesWithPreviews]);
      onFilesChange?.([...files, ...filesWithPreviews]);

      // Clear any previous errors when new files are added
      setUploadError(null);
    },
    [onFilesChange, files],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    noClick: files.length > 0, // Disable auto-click when there are files
  });

  // Separate click handler for the dropzone
  const handleDropzoneClick = (e: React.MouseEvent) => {
    // Only trigger file dialog if clicking on the dropzone itself, not on images or buttons
    if (
      e.target === e.currentTarget ||
      (e.target as HTMLElement).closest('[data-dropzone-area="true"]')
    ) {
      open();
    }
  };

  const removeFile = useCallback(
    (index: number, e?: React.MouseEvent) => {
      // Stop event propagation to prevent dropzone click
      if (e) {
        e.stopPropagation();
      }

      setFiles((prevFiles) => {
        const newFiles = [...prevFiles];
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
        onFilesChange?.(newFiles);
        return newFiles;
      });
    },
    [onFilesChange],
  );

  // Image click handler to prevent opening file dialog
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  // Function to handle file upload
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Upload each file
      let completed = 0;
      let failed = 0;
      const totalFiles = files.length;

      const uploadPromises = files.map(async (file) => {
        try {
          // Update file status to uploading
          setFileStatus((prev) => ({
            ...prev,
            [file.name]: { status: 'uploading' },
          }));

          // Step 1: Get a presigned URL from our API
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
          }

          const { uploadUrl, key } = await response.json();

          // Step 2: Upload the file directly to S3 using the presigned URL
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
          }

          // Update file status to success
          setFileStatus((prev) => ({
            ...prev,
            [file.name]: { status: 'success' },
          }));

          // Update overall progress
          completed++;
          setUploadProgress(Math.round(((completed + failed) / totalFiles) * 100));

          return { fileName: file.name, key, success: true };
        } catch (error) {
          // Update file status to error
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          setFileStatus((prev) => ({
            ...prev,
            [file.name]: { status: 'error', error: errorMessage },
          }));

          failed++;
          setUploadProgress(Math.round(((completed + failed) / totalFiles) * 100));

          return { fileName: file.name, success: false, error: errorMessage };
        }
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);
      console.log('Upload results:', results);

      // Check if there were any failures
      const failedUploads = results.filter((r) => !r.success);
      if (failedUploads.length > 0) {
        if (failedUploads.length === files.length) {
          setUploadError(`All uploads failed. Please try again later.`);
        } else {
          setUploadError(
            `${failedUploads.length} of ${files.length} uploads failed. Successfully uploaded ${
              files.length - failedUploads.length
            } files.`,
          );

          // Remove successfully uploaded files
          const successfulFileNames = results.filter((r) => r.success).map((r) => r.fileName);

          setFiles((prevFiles) =>
            prevFiles.filter((file) => !successfulFileNames.includes(file.name)),
          );
          onFilesChange?.(files.filter((file) => !successfulFileNames.includes(file.name)));
        }
      } else {
        // All uploads succeeded
        setFiles([]);
        onFilesChange?.([]);
        setFileStatus({});

        // Show success message for 3 seconds
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

        // Refetch the gallery images after successful upload
        // @ts-expect-error - Global refetch function for other components
        if (typeof window !== 'undefined' && window.refetchGallery) {
          // @ts-expect-error - Global refetch function for other components
          window.refetchGallery();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Function to retry uploading failed files
  const retryFailedUploads = () => {
    // Filter out files with 'error' status
    const failedFiles = files.filter((file) => fileStatus[file.name]?.status === 'error');
    if (failedFiles.length > 0) {
      // Reset status for failed files
      const resetStatus: Record<string, { status: 'pending' }> = {};
      failedFiles.forEach((file) => {
        resetStatus[file.name] = { status: 'pending' };
      });
      setFileStatus((prev) => ({ ...prev, ...resetStatus }));

      // Clear error message
      setUploadError(null);

      // Start upload
      handleUpload();
    }
  };

  return (
    <div className="space-y-4 p-4 border inline-block rounded-xl bg-blue-400/10">
      <div
        {...getRootProps()}
        className={cn(
          'relative aspect-4/3 flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border bg-background hover:bg-muted/50',
          className,
        )}
        ref={dropzoneRef}
        onClick={handleDropzoneClick}
        data-dropzone-area="true"
      >
        <input {...getInputProps()} />

        {/* Drag-and-drop instructions: only show if no files */}
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Drag & drop files here or click to browse</p>
              <p className="text-xs text-muted-foreground">Accepts images, GIFs, and videos</p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="w-full">
            <div className={`text-sm font-medium mb-2 ${files.length <= 3 ? 'text-center' : ''}`}>
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </div>

            {/* Single file preview - larger and centered */}
            {files.length === 1 && (
              <div className="flex justify-center w-full">
                <div className="w-3/4 max-w-64 aspect-square relative rounded-md border border-border bg-muted">
                  {files[0].type.startsWith('image/') ? (
                    <img
                      src={files[0].preview}
                      alt={files[0].name}
                      className="h-full w-full object-cover cursor-default"
                      onClick={handleImageClick}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(0, e);
                    }}
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow text-gray-700 hover:bg-gray-100 z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Two files preview - side by side and centered */}
            {files.length === 2 && (
              <div className="flex justify-center gap-4 w-full">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="w-2/5 aspect-square group relative rounded-md border border-border bg-muted"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-full w-full object-cover cursor-default"
                        onClick={handleImageClick}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index, e);
                      }}
                      className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow text-gray-700 hover:bg-gray-100 z-10 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Three files preview - special symmetric layout */}
            {files.length === 3 && (
              <div className="w-full flex flex-col items-center gap-2">
                {/* First row: single image centered */}
                <div className="w-2/5 aspect-square group relative rounded-md border border-border bg-muted">
                  {files[0].type.startsWith('image/') ? (
                    <img
                      src={files[0].preview}
                      alt={files[0].name}
                      className="h-full w-full object-cover cursor-default"
                      onClick={handleImageClick}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(0, e);
                    }}
                    className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow text-gray-700 hover:bg-gray-100 z-10 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Second row: two images side by side */}
                <div className="flex justify-center gap-4 w-full">
                  {files.slice(1, 3).map((file, index) => (
                    <div
                      key={index}
                      className="w-2/5 aspect-square group relative rounded-md border border-border bg-muted"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-full w-full object-cover cursor-default"
                          onClick={handleImageClick}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index + 1, e);
                        }}
                        className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow text-gray-700 hover:bg-gray-100 z-20 cursor-pointer"
                      >
                        <X className="h-4 w-4 hover:cursor-pointer" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Four or more files - grid layout */}
            {files.length > 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full">
                {files.slice(0, 7).map((file, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square rounded-md border border-border bg-muted"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-full w-full object-cover cursor-default"
                        onClick={handleImageClick}
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
                        removeFile(index, e);
                      }}
                      className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow text-gray-700 hover:bg-gray-100 z-10 cursor-pointer"
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
            )}
          </div>
        )}
      </div>

      {/* Error message - Contained within the same width as the dropzone */}
      {uploadError && (
        <div className="w-full px-3 py-2 text-sm text-red-800 bg-red-100 rounded-md">
          <p className="font-medium">Error: {uploadError}</p>
          {files.some((file) => fileStatus[file.name]?.status === 'error') && (
            <button
              onClick={retryFailedUploads}
              className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              Retry failed uploads
            </button>
          )}
        </div>
      )}

      {/* File error indicators with warning icon */}
      {files.length > 0 && files.some((file) => fileStatus[file.name]?.status === 'error') && (
        <div className="w-full">
          {files
            .filter((file) => fileStatus[file.name]?.status === 'error')
            .map((file, index) => (
              <div key={index} className="flex items-center text-red-600 text-xs mt-1">
                <span className="mr-1">⚠</span>
                <span className="truncate">
                  {file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name}:{' '}
                  {fileStatus[file.name]?.error?.includes('status:')
                    ? fileStatus[file.name]?.error
                    : 'Upload failed'}
                </span>
              </div>
            ))}
        </div>
      )}

      <div className={cn('w-full', className)}>
        <Button
          type="button"
          className="w-full"
          disabled={files.length === 0 || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}
            </>
          ) : showSuccess ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Success!
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
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
