'use client';

import { FileDropzone } from '../FileDropzone';

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold font-baloo text-saffron-primary mb-6">Upload Files</h1>
        <FileDropzone className="w-full max-w-md" />
      </div>
    </div>
  );
}
