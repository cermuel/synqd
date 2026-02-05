"use client";

type Props = {
  message: string;
  type: "default" | "success" | "error";
  show: boolean;
};

export default function Toast({ message, type, show }: Props) {
  return (
    <div
      className={`
        fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out
      ${
        show
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-3 scale-90 pointer-events-none"
      }
      `}
    >
      <div
        className={`
          px-5 py-2 rounded-full text-sm font-semibold backdrop-blur-xl shadow-xl whitespace-nowrap
          bg-white text-black
          ${type === "success" && "bg-emerald-500/90 text-white"}
          ${type === "error" && "bg-red-500/90 text-white"}
        `}
      >
        {message}
      </div>
    </div>
  );
}
