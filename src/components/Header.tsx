'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  showUploadButton?: boolean;
  showBackButton?: boolean;
}

export function Header({ showUploadButton = false, showBackButton = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-2 border-b bg-saffron-secondary relative">
      <div>
        {showBackButton && (
          <Link href="/">
            <Button variant="ghost">Back to Gallery</Button>
          </Link>
        )}
      </div>
      <div className="flex items-center absolute left-1/2 transform -translate-x-1/2">
        <Image
          src="https://saffron-s3bucket.s3.us-east-1.amazonaws.com/assets/saffron-logo-mini.png"
          alt="Logo"
          width={64}
          height={64}
        />
      </div>
      <div>
        {showUploadButton && (
          <Link href="/upload">
            <Button className="bg-mint-green hover:bg-mint-green/90">Upload</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
