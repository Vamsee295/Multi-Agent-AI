import React from "react";

interface HelpFlowLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showSubtitle?: boolean;
  className?: string;
  dark?: boolean;
}

export function HelpFlowLogo({
  size = "md",
  showWordmark = true,
  showSubtitle = false,
  className = "",
  dark = false,
}: HelpFlowLogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-13 h-13",
  };

  const iconPixels = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 52,
  };

  const textSizes = {
    sm: "text-[15px]",
    md: "text-[17px]",
    lg: "text-[22px]",
    xl: "text-[28px]",
  };

  const subtitleSizes = {
    sm: "text-[7.5px] tracking-[0.2em]",
    md: "text-[8.5px] tracking-[0.22em]",
    lg: "text-[10px] tracking-[0.25em]",
    xl: "text-[12px] tracking-[0.25em]",
  };

  const emblemSrc = dark ? "/logo-emblem-dark.png" : "/logo-emblem.png";
  const px = iconPixels[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Modern Emblem */}
      <div
        style={{ width: `${px}px`, height: `${px}px` }}
        className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center transition-transform group-hover:scale-105`}
      >
        <img
          src={emblemSrc}
          alt="HelpFlow Logo"
          width={px}
          height={px}
          style={{ width: `${px}px`, height: `${px}px`, objectFit: "contain" }}
          className="w-full h-full object-contain filter drop-shadow-sm"
          loading="eager"
        />
      </div>

      {/* Wordmark and Optional Subtitle */}
      {showWordmark && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span
              className={`${textSizes[size]} font-extrabold tracking-tight leading-none ${
                dark ? "text-white" : "text-[#09090B]"
              }`}
            >
              HelpFlow
            </span>
            {showSubtitle && (
              <span
                className={`${subtitleSizes[size]} font-bold uppercase ${
                  dark ? "text-zinc-400" : "text-zinc-500"
                } mt-0.5`}
              >
                Multi-Agent AI Support
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

