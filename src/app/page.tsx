'use client';

import FileGallery from './FileGallery';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div>
      <Header showUploadButton />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-baloo text-saffron-primary mb-6 text-center">
          Lovely Saffron
        </h1>
        <FileGallery />
      </div>
    </div>
  );
}
