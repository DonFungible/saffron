'use client';

import React from 'react';

export default function FontTest() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-lg text-gray-500 mb-2">Using utility classes</h2>
        <h1 className="font-baloo text-4xl font-bold">Baloo heading with .font-baloo class</h1>
        <p className="font-nunito text-xl">Nunito paragraph with .font-nunito class</p>
      </div>

      <div>
        <h2 className="text-lg text-gray-500 mb-2">Using inline styles</h2>
        <h1 style={{ fontFamily: "'Baloo 2', cursive" }} className="text-4xl font-bold">
          Baloo heading with inline style
        </h1>
        <p style={{ fontFamily: 'Nunito, sans-serif' }} className="text-xl">
          Nunito paragraph with inline style
        </p>
      </div>

      <div>
        <h2 className="text-lg text-gray-500 mb-2">Direct font-family CSS</h2>
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'baloo' }}>
          Baloo heading with direct font-family
        </h1>
      </div>

      <div>
        <h2 className="text-lg text-gray-500 mb-2">Font weights</h2>
        <div className="space-y-2">
          <p className="font-baloo font-normal">Baloo - Normal (400)</p>
          <p className="font-baloo font-medium">Baloo - Medium (500)</p>
          <p className="font-baloo font-semibold">Baloo - Semibold (600)</p>
          <p className="font-baloo font-bold">Baloo - Bold (700)</p>
          <p className="font-baloo font-extrabold">Baloo - ExtraBold (800)</p>
        </div>
      </div>
    </div>
  );
}
