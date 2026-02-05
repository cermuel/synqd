"use client";
import { useState } from "react";

export default function ShareCard({
  frontContent,
  backContent,
  buttons,
}: {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  buttons?: React.ReactNode;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center  p-4">
      <div className="perspective-1000">
        <div
          className={`relative transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-x-180" : ""
          }`}
        >
          <div className="backface-hidden flex items-center justify-center">
            {frontContent}
          </div>
          <div className="absolute inset-0 backface-hidden rotate-x-180 flex items-center justify-center">
            {backContent}
          </div>
        </div>
      </div>
      {buttons || (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setIsFlipped(false)}
            style={{
              backgroundColor: !isFlipped ? "#C79101" : "white",
              color: !isFlipped ? "white" : "#1D1D1D",
            }}
            className="py-2 w-20 font-semibold tracking-wider text-sm rounded cursor-pointer transition-all duration-300"
          >
            Scan
          </button>
          <button
            onClick={() => setIsFlipped(true)}
            style={{
              backgroundColor: isFlipped ? "#C79101" : "white",
              color: isFlipped ? "white" : "#1D1D1D",
            }}
            className="py-2 w-20 font-semibold tracking-wider text-sm rounded cursor-pointer transition-all duration-300"
          >
            Manual
          </button>
        </div>
      )}
    </div>
  );
}
