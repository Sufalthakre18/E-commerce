'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function ImageGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState(0);

  if (!images.length) return null;

  return (
    <>
      <div className="relative h-72 w-full rounded-lg overflow-hidden">
        <Image
          src={images[selected]}
          alt="Product Image"
          fill
          className="object-cover"
        />
      </div>

      <div className="flex gap-2 mt-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={i}
            className={`h-16 w-16 relative rounded border ${
              selected === i ? 'border-black' : 'border-gray-300'
            }`}
            onClick={() => setSelected(i)}
          >
            <Image src={img} alt="thumb" fill className="object-cover rounded" />
          </button>
        ))}
      </div>
    </>
  );
}
