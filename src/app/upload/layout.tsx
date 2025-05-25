'use client';

import { Header } from '@/components/Header';

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header showBackButton />
      {children}
    </div>
  );
}
