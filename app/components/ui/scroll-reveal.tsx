"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade-in" | "scale-in"
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  animation = "fade-up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const animationClass = {
    "fade-up": "animate-fade-up",
    "fade-in": "animate-fade-in",
    "scale-in": "animate-scale-in",
  }[animation]

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? undefined : 0,
        animationDelay: isVisible ? `${delay}ms` : undefined,
        animationFillMode: "forwards",
      }}
    >
      <div className={isVisible ? animationClass : undefined}>
        {children}
      </div>
    </div>
  )
}
