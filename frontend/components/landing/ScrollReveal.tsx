"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // delay in ms
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const current = ref.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  const getTransformClass = () => {
    if (isVisible) return "translate-x-0 translate-y-0 opacity-100";

    switch (direction) {
      case "up":
        return "translate-y-10 opacity-0";
      case "down":
        return "-translate-y-10 opacity-0";
      case "left":
        return "translate-x-10 opacity-0";
      case "right":
        return "-translate-x-10 opacity-0";
      case "none":
        return "opacity-0";
      default:
        return "translate-y-10 opacity-0";
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${getTransformClass()} ${className}`}
    >
      {children}
    </div>
  );
}
