'use client'

import {useCallback, useEffect, useState} from 'react'
import Image from 'next/image'
import {AnimatePresence, motion} from 'motion/react'

export default function HeroCarousel({slides}: {slides: string[]}) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const next = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setIndex((i) => (i - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (!playing || slides.length <= 1) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [playing, next, slides.length])

  if (slides.length === 0) return null

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        <motion.div
          key={index}
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 1}}
          className="absolute inset-0"
        >
          <Image src={slides[index]} alt="" fill priority={index === 0} className="object-cover" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/60 pointer-events-none" />

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-4 right-4 z-10 flex items-center justify-between">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors backdrop-blur-sm"
            aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
          >
            {playing ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors backdrop-blur-sm text-lg"
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              onClick={next}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors backdrop-blur-sm text-lg"
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
