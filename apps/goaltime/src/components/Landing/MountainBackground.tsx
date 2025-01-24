"use client"

import type React from "react"
import { useEffect, useRef, useState, useMemo, useLayoutEffect } from "react"
import Moon from './Moon'

const generateStars = (count: number) => {
  return Array.from({ length: count }, () => ({
    cx: Math.random() * 1920,
    cy: Math.random() * 1280,
    r: Math.random() * 2 + 0.5,
    animationDuration: `${Math.random() * 5 + 5}s`,
    animationDelay: `${Math.random() * 5}s`,
  }))
}

const Star = ({ cx, cy, r, animationDuration, animationDelay }: { cx: number, cy: number, r: number, animationDuration: string, animationDelay: string }) => {
  const [opacity, setOpacity] = useState(1);
  const animationRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const startTime = performance.now() - parseFloat(animationDelay) * 1000;
    const duration = parseFloat(animationDuration) * 1000;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = (elapsed / duration) % 1;
      const newOpacity =
        progress < 0.25
          ? progress * 4
          : progress < 0.75
          ? 1
          : (1 - progress) * 4;
      setOpacity(newOpacity);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return () => cancelAnimationFrame(animationRef.current!);
  }, [animationDuration, animationDelay]);

  return <circle cx={cx} cy={cy} r={r} fill="#fff" opacity={opacity} />;
};

const MountainBackground: React.FC = () => {
  const mountainsRef = useRef<SVGGElement>(null)
  const clocktowerRef = useRef<SVGGElement>(null)
  const moonRef = useRef<SVGSVGElement>(null)
  const [time, setTime] = useState(new Date())

  const stars = useMemo(() => generateStars(300), [])

  useEffect(() => {
    const handleParallax = () => {
      if (mountainsRef.current && clocktowerRef.current && moonRef.current) {
        const scrollPosition = window.pageYOffset
        const children = mountainsRef.current.children
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as SVGGElement
          const speed = Number.parseFloat(child.dataset.speed || "0")
          child.style.transform = `translateY(${scrollPosition * speed}px)`
        }

        // Apply combined parallax and growth effect to the clocktower
        const clocktowerSpeed = 0.0005
        const growthFactor = 1 + Math.min(scrollPosition * 0.0005, 0.5) // Max growth of 50%
        clocktowerRef.current.style.transform = `
          translateY(${scrollPosition * clocktowerSpeed}px)
          scale(${growthFactor})
        `

        // Apply subtle parallax effect and scaling to the moon
        const moonSpeed = 0.01
        const moonScaleFactor = 1 + Math.min(scrollPosition * 0.00005, 0.15) // Max scale of 150%
        const newY = scrollPosition * moonSpeed
        moonRef.current.style.transform = `translateY(${newY}px) scale(${moonScaleFactor})`
      }
    }

    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    window.addEventListener("scroll", handleParallax)
    return () => {
      window.removeEventListener("scroll", handleParallax)
      clearInterval(timer)
    }
  }, [])

  const hours = time.getHours() % 12
  const minutes = time.getMinutes()
  const seconds = time.getSeconds()

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Render the Moon component outside the main SVG */}
      <Moon ref={moonRef} top={130} right={50} />

      <svg
        viewBox="0 0 1920 1280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        aria-label="Mountain background with starry sky, shooting stars, and clocktower"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a202c" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>
          <mask id="moonMask">
            <rect x="-60" y="-60" width="120" height="120" fill="white" />
            <circle cx="15" cy="-15" r="55" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#skyGradient)" />

        {stars.map((star, index) => (
          <Star
            key={index}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            animationDuration={star.animationDuration}
            animationDelay={star.animationDelay}
          />
        ))}

        <g ref={mountainsRef}>
          <g className="parallax-layer" data-speed="0.05">
            <polygon points="0,1280 0,700 300,800 600,650 900,750 1200,650 1500,750 1800,650 1920,700 1920,1280" fill="#718096" />
          </g>
          <g className="parallax-layer" data-speed="0.1">
            <polygon points="0,1280 0,600 400,750 800,550 1200,700 1600,600 1920,650 1920,1280" fill="#4a5568" />
          </g>
          <g className="parallax-layer" data-speed="0.2">
            <polygon points="0,1280 0,700 500,800 1000,650 1500,750 1920,700 1920,1280" fill="#2d3748" />
          </g>
          <g className="parallax-layer" data-speed="0.3">
            <polygon points="0,1280 0,800 600,880 1200,830 1800,870 1920,850 1920,1280" fill="#1a202c" />

            <g transform="translate(960, 720) scale(1.2)">
              <g ref={clocktowerRef} aria-label="Clocktower">
                <rect x="-40" y="-180" width="80" height="180" fill="#1a202c" />
                <polygon points="-50,-180 50,-180 0,-220" fill="#1a202c" />
                <circle cx="0" cy="-130" r="30" fill="#2d3748" stroke="#4a5568" strokeWidth="3" />
                {[...Array(12)].map((_, i) => (
                  <text
                    key={i}
                    x="0"
                    y="-130"
                    dy="-22"
                    fontSize="8"
                    fill="#cbd5e0"
                    textAnchor="middle"
                    transform={`rotate(${i * 30}, 0, -130)`}
                  >
                    {i === 0 ? "12" : i}
                  </text>
                ))}
                <line
                  x1="0"
                  y1="-130"
                  x2="0"
                  y2="-110"
                  stroke="#4a5568"
                  strokeWidth="2"
                  transform={`rotate(${hours * 30 + minutes * 0.5 - 180}, 0, -130)`}
                  aria-label="Hour hand"
                />
                <line
                  x1="0"
                  y1="-130"
                  x2="0"
                  y2="-105"
                  stroke="#4a5568"
                  strokeWidth="1.5"
                  transform={`rotate(${minutes * 6 - 180}, 0, -130)`}
                  aria-label="Minute hand"
                />
                <line
                  x1="0"
                  y1="-130"
                  x2="0"
                  y2="-100"
                  stroke="#e53e3e"
                  strokeWidth="1"
                  transform={`rotate(${seconds * 6 - 180}, 0, -130)`}
                  aria-label="Second hand"
                />
                <circle cx="0" cy="-130" r="2" fill="#718096" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}

export default MountainBackground

