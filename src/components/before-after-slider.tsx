"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  height?: number
  width?: number
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = "Before image",
  afterAlt = "After image",
  height = 600,
  width = 400,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))

    setSliderPosition(newPosition)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width))
    const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))

    setSliderPosition(newPosition)
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg shadow-lg"
      style={{ width: width, height: height }}
    >
      {/* Before Image (Background) */}
      <div className="absolute inset-0">
        <Image src={beforeImage || "/placeholder.svg"} alt={beforeAlt} fill className="object-cover" loading="eager" />
      </div>

      {/* After Image (Foreground with clip) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
        }}
      >
        <Image src={afterImage || "/placeholder.svg"} alt={afterAlt} fill className="object-cover" loading="eager" />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Slider Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md cursor-ew-resize"
          style={{ left: 0 }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 text-sm rounded">Before</div>
      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 text-sm rounded">After</div>
    </div>
  )
}
