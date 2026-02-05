"use client";

import { useEffect, useState } from "react";

interface Ripple {
  id: number;
  createdAt: number;
}

export default function BottomRippleAnimation() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRipples((prev) => {
        const newRipple = { id: nextId, createdAt: Date.now() };
        setNextId((id) => id + 1);
        return [...prev, newRipple];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [nextId]);

  useEffect(() => {
    // Remove ripples after animation completes (10s)
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRipples((prev) =>
        prev.filter((ripple) => now - ripple.createdAt < 15000),
      );
    }, 500);

    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-screen overflow-hidden pointer-events-none flex items-end justify-center">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute rounded-full border border-[#444]"
          style={{
            bottom: "0",
            left: "50%",
            transform: "translate(-50%, 50%)",
            animation: `ripple 30s ease-out forwards`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          50% {
            opacity: 0;
          }
          100% {
            width: 2000px;
            height: 2000px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
