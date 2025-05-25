'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Wand2 } from 'lucide-react';

interface S3Image {
  key: string;
  url: string;
  fileName: string;
  lastModified?: Date;
  size?: number;
}

// Function to fetch images from API
const fetchImages = async (): Promise<S3Image[]> => {
  const response = await fetch('/api/images');

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();

  if (data.images) {
    // Convert string dates to Date objects
    return data.images.map((img: S3Image) => ({
      ...img,
      lastModified: img.lastModified ? new Date(img.lastModified) : undefined,
    }));
  }

  return [];
};

export default function FileGallery() {
  // Use React Query to fetch images
  const {
    data: images = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
  });

  // Make refetch function available globally for other components to use
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Global refetch function for other components
    window.refetchGallery = refetch;
  }

  return (
    <div className="w-full mt-8 p-4 bg-white rounded-lg">
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-saffron-primary"></div>
        </div>
      )}

      {error instanceof Error && (
        <div className="text-red-500 p-4 rounded-md bg-red-50 mb-4">
          {error.message || 'Failed to load images. Please try again later.'}
        </div>
      )}

      {!isLoading && images.length === 0 && !error && (
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No images found. Upload some images to see them here!</p>
        </div>
      )}

      {/* Image Grid - 5 columns on lg screens, 2 columns on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <Link
            key={image.key}
            href={`/image/${encodeURIComponent(image.key)}`}
            className="relative group aspect-square rounded-md overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200 block"
          >
            <Image
              src={image.url}
              alt={image.fileName}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover z-0"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-all duration-200 z-10" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              <span className="text-white font-semibold text-lg px-3 py-1 rounded-md">View</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
              {image.fileName}
            </div>
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
              <Wand2 className="h-4 w-4 text-saffron-primary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
