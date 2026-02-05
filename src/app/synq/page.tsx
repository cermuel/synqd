"use client";
import AppWrapper from "@/components/layout/app-wrapper";
import { useRouter } from "next/navigation";
import { useState, useRef, KeyboardEvent, ChangeEvent } from "react";

const Connect = () => {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string): void => {
    if (value.length > 1) {
      value = value[0];
    }

    // Accept only alphanumeric characters (letters and numbers)
    if (!/^[A-Za-z0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.toUpperCase(); // Convert to uppercase for consistency
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async (): Promise<void> => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        console.error("Clipboard API not available");
        return;
      }

      const text = await navigator.clipboard.readText();

      // Extract only alphanumeric characters and convert to uppercase
      const cleanText = text.toUpperCase().replace(/[^A-Z0-9]/g, "");

      // Take first 6 alphanumeric characters
      const characters = cleanText.slice(0, 6);
      const newOtp = characters.split("").concat(Array(6).fill("")).slice(0, 6);
      setOtp(newOtp);

      if (characters.length > 0) {
        inputRefs.current[Math.min(characters.length, 5)]?.focus();
      }
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const handleSynq = (): void => {
    const code = otp.join("");
    router.push(`/${code}`);
  };

  const isComplete: boolean = otp.every((digit) => digit !== "");

  return (
    <AppWrapper>
      <div className="flex-1 h-full flex-col flex items-center py-6">
        <h1 className="text-3xl sm:text-5xl md:text-6xl mb-10 font-bold tracking-tight text-white text-center">
          Share files instantly
          <br />
          <span className="text-[#C79101] text-3xl sm:text-4xl md:text-5xl">
            no cloud, no limits
          </span>
        </h1>

        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="flex gap-2 items-center">
            {otp.map((digit, index) => (
              <div key={index} className="flex items-center">
                <input
                  //@ts-ignore
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange(index, e.target.value)
                  }
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, e)
                  }
                  className="w-12 h-14 text-center text-2xl font-semibold bg-[#222] border border-[#333] rounded-lg text-white uppercase focus:border-[#C79101] focus:outline-none transition-colors"
                />
                {index === 2 && (
                  <span className="text-[#555] text-2xl mx-2 font-semibold">
                    -
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handlePaste}
            className="px-6 py-2 bg-white rounded-full text-black font-semibold hover:bg-gray-100 transition-colors"
          >
            Paste
          </button>

          {isComplete && (
            <button
              onClick={handleSynq}
              className="px-8 py-3 bg-[#C79101] cursor-pointer rounded-lg text-white font-bold text-lg transition-all mt-2"
            >
              SYNQ
            </button>
          )}
        </div>
      </div>
    </AppWrapper>
  );
};

export default Connect;
