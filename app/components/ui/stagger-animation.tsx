"use client"

import { type ReactNode } from "react"

interface StaggerChildProps {
  children: ReactNode
  index: number
  className?: string
}

export function StaggerChild({ children, index, className }: StaggerChildProps) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        animation: `fade-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface HeroAnimationProps {
  children: ReactNode
}

export function HeroAnimation({ children }: HeroAnimationProps) {
  return (
    <div
      style={{
        opacity: 0,
        animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) forwards`,
        animationDelay: "50ms",
      }}
    >
      {children}
    </div>
  )
}
