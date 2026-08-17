'use client'

import {useEffect, useState} from 'react'
import Image from 'next/image'

type Photo = {
  thumbUrl: string
  fullUrl: string
  caption?: string
}

export default function AlbumGallery({photos}: {photos: Photo[]}) {
  const [index, setIndex] = useState<number | null>(null)

  const close = () => setIndex(null)
  const prev = () => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))
  const next = () => setIndex((i) => (i === null ? i : (i + 1) % photos.length))

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, photos.length])

  return (
    <>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className="group relative aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white hover:border-gold transition-colors hover:shadow-md"
          >
            <Image
              src={photo.thumbUrl}
              alt={photo.caption || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {index !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center px-4"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-2 sm:left-6 text-white/70 hover:text-white text-4xl px-2"
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-[75vh]">
              <Image
                src={photos[index].fullUrl}
                alt={photos[index].caption || ''}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {photos[index].caption && (
              <p className="text-white/80 text-sm mt-3 text-center">{photos[index].caption}</p>
            )}
            <p className="text-white/40 text-xs mt-1">{index + 1} / {photos.length}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-2 sm:right-6 text-white/70 hover:text-white text-4xl px-2"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}
    </>
  )
}
