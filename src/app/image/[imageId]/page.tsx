'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';

interface ImageDetails {
  key: string;
  url: string;
  fileName: string;
  lastModified?: Date;
  size?: number;
}

export default function ImageStyleTransfer() {
  const params = useParams();
  const imageId = params.imageId as string;

  const [imageDetails, setImageDetails] = useState<ImageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Fetch image details
  useEffect(() => {
    async function fetchImageDetails() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all images
        const response = await fetch('/api/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }

        const data = await response.json();

        // Find the specific image by key/id
        const image = data.images.find(
          (img: ImageDetails) =>
            img.key === decodeURIComponent(imageId) ||
            img.key.includes(decodeURIComponent(imageId)),
        );

        if (!image) {
          throw new Error('Image not found');
        }

        // Convert date string to Date object if needed
        if (image.lastModified && typeof image.lastModified === 'string') {
          image.lastModified = new Date(image.lastModified);
        }

        setImageDetails(image);
      } catch (err) {
        console.error('Error fetching image details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load image');
      } finally {
        setLoading(false);
      }
    }

    if (imageId) {
      fetchImageDetails();
    }
  }, [imageId]);

  // Handle style transfer generation
  const handleStyleTransfer = async () => {
    if (!prompt.trim() || !imageDetails) return;

    try {
      setGenerating(true);
      setError(null);

      // Simulate API call for style transfer (in a real app, call your actual API)
      // In a real implementation, you would call an actual AI service API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // For demo purposes, we're just using the original image URL
      // In a real app, this would be the URL of the newly generated image
      setGeneratedImageUrl(imageDetails.url);
    } catch (err) {
      console.error('Error generating styled image:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate styled image');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Header showBackButton showUploadButton />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-baloo text-saffron-primary mb-6 text-center">
          Style Transfer
        </h1>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-saffron-primary" />
          </div>
        )}

        {error && (
          <div className="text-red-500 p-4 rounded-md bg-red-50 mb-4 text-center">{error}</div>
        )}

        {imageDetails && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original Image */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Original Image</h2>
              <div className="relative aspect-square w-full mb-4">
                <Image
                  src={imageDetails.url}
                  alt={imageDetails.fileName}
                  fill
                  className="object-contain rounded-md"
                />
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">Filename:</span> {imageDetails.fileName}
                </p>
                {imageDetails.size && (
                  <p>
                    <span className="font-medium">Size:</span> {formatFileSize(imageDetails.size)}
                  </p>
                )}
              </div>
            </div>

            {/* Style Transfer Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Apply Style Transfer</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Style Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the style you want to apply (e.g., 'Van Gogh starry night style' or 'Cyberpunk neon aesthetic')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="h-24"
                  />
                </div>

                <Button
                  onClick={handleStyleTransfer}
                  disabled={!prompt.trim() || generating}
                  className="w-full bg-saffron-primary hover:bg-saffron-primary/90"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Styled Image'
                  )}
                </Button>

                {/* Generated Image Preview */}
                {generatedImageUrl && !generating && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Generated Image</h3>
                    <div className="relative aspect-square w-full border rounded-md overflow-hidden">
                      <Image
                        src={generatedImageUrl}
                        alt="Generated image"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button className="mt-3 w-full" variant="outline">
                      <a
                        href={generatedImageUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
