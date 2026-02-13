"use client";

import { toast } from "@/context/ToastContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGithub, FaStar, FaCopy } from "react-icons/fa";

const Navbar = ({stars}: {stars?: number}) => {
  const pathname = usePathname();

  const isConnectPage = pathname.includes("synq");
  const isHomePage = pathname === "/";

  const handleCopyPath = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(pathname.slice(1))
        .then(() => toast(`Copied "${pathname}"`, "default"))
        .catch(() => toast("Failed to copy", "error"));
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = pathname.slice(1);
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        toast(`Copied "${pathname.slice(1)}"`, "default");
      } catch {
        toast("Failed to copy", "error");
      }
      document.body.removeChild(textarea);
    }
  };

  return (
    <nav className="h-12 border-b border-b-[#222] w-full fixed top-0 left-0 flex items-center justify-center gap-4 bg-black/50 backdrop-blur-sm z-50">
      <div className="max-w-7xl h-full w-full flex items-center gap-4 px-5">
        <Link href={"/"} className="sm:text-xl font-bold text-white">
          Synqd
        </Link>

        {!isHomePage && !isConnectPage ? (
          <button
            onClick={handleCopyPath}
            className="ml-auto flex items-center gap-1 bg-white text-sm font-semibold px-4 py-1.25 rounded-full cursor-pointer hover:px-6 transition-all duration-300"
          >
            {pathname.slice(1)}
          </button>
        ) : (
          <Link
            href={isConnectPage ? "/" : "/synq"}
            className="ml-auto bg-white text-sm font-semibold px-4 py-1.25 rounded-full cursor-pointer hover:px-6 transition-all duration-300"
          >
            {isConnectPage
              ? "START"
              : isHomePage
                ? "CONNECT"
                : pathname.slice(1)}
          </Link>
        )}

        <Link
          href={"https://github.com/cermuel/synqd"}
          target="_blank"
          className="rounded-full cursor-pointer hover:scale-105 duration-300 transition-all hover:bg-[#C791011A] px-2 py-1.5 border border-[#333] flex items-center gap-2"
        >
          <FaGithub color="#EEE" />
          <div className="h-4 w-px bg-[#444]" />
          <div className="flex items-center gap-0.5">
            <FaStar color="#e4ad16" size={14} />
            <span className="text-white font-bold text-xs mt-0.75">{stars}</span>
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
