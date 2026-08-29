import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withSubtitle?: boolean;
  useImage?: boolean;
}

export function BrandLogo({ 
  className = "", 
  size = "md", 
  withSubtitle = false,
  useImage = false 
}: BrandLogoProps) {
  const sizeMap = {
    sm: { width: 130, height: 52, imgWidth: 120, imgHeight: 48 },
    md: { width: 180, height: 72, imgWidth: 170, imgHeight: 68 },
    lg: { width: 240, height: 96, imgWidth: 230, imgHeight: 92 },
    xl: { width: 320, height: 128, imgWidth: 300, imgHeight: 120 },
  };

  const current = sizeMap[size];

  if (useImage) {
    return (
      <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
        <Image
          src="/cj-courts-logo.png"
          alt="C&J's Courts Logo"
          width={current.imgWidth}
          height={current.imgHeight}
          className="object-contain drop-shadow-md rounded-xl"
          priority
        />
        {withSubtitle && (
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 mt-1">
            Pickleball Arena &amp; Pro Club
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 140"
        width={current.width}
        height={current.height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Yellow swoosh drop shadow */}
          <filter id="cj-swoosh-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* --- 1. TOP YELLOW DYNAMIC SWOOSH (tapers to sharp right tip) --- */}
        <path
          d="M 28 54 C 40 22, 110 8, 205 10 C 275 12, 320 28, 332 50 C 335 56, 328 62, 318 64 C 304 42, 258 24, 195 22 C 118 20, 56 34, 40 56 C 34 64, 25 64, 28 54 Z"
          fill="#FFDD00"
          filter="url(#cj-swoosh-glow)"
        />

        {/* --- 2. BOTTOM YELLOW DYNAMIC SWOOSH (tapers to sharp left tip) --- */}
        <path
          d="M 312 86 C 300 118, 230 132, 135 130 C 65 128, 20 112, 8 90 C 5 84, 12 78, 22 76 C 36 98, 82 116, 145 118 C 222 120, 284 106, 300 84 C 306 76, 315 76, 312 86 Z"
          fill="#FFDD00"
          filter="url(#cj-swoosh-glow)"
        />

        {/* --- 3. "C&J" MAIN RED LETTERS WITH THICK WHITE OUTLINE --- */}
        <g>
          {/* Outer White Contour / Outline */}
          <text
            x="146"
            y="70"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              fontFamily: "var(--font-heading), Impact, 'Arial Black', sans-serif",
              fontSize: "76px",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "-2px",
            }}
          >
            C&amp;J
          </text>

          {/* Primary Bold Red Fill */}
          <text
            x="146"
            y="70"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#E52521"
            style={{
              fontFamily: "var(--font-heading), Impact, 'Arial Black', sans-serif",
              fontSize: "76px",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "-2px",
            }}
          >
            C&amp;J
          </text>
        </g>

        {/* --- 4. "'s" SUPERSCRIPT ACCENT WITH WHITE OUTLINE --- */}
        <g>
          {/* White outline for 's */}
          <text
            x="248"
            y="45"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{
              fontFamily: "var(--font-heading), Impact, 'Arial Black', sans-serif",
              fontSize: "36px",
              fontWeight: 900,
              fontStyle: "italic",
            }}
          >
            &apos;s
          </text>

          {/* Red fill for 's */}
          <text
            x="248"
            y="45"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#E52521"
            style={{
              fontFamily: "var(--font-heading), Impact, 'Arial Black', sans-serif",
              fontSize: "36px",
              fontWeight: 900,
              fontStyle: "italic",
            }}
          >
            &apos;s
          </text>
        </g>

        {/* --- 5. "COURTS" BOTTOM WHITE TEXT WITH DARK BORDER --- */}
        <g>
          {/* Dark Navy / Charcoal Outline */}
          <text
            x="160"
            y="108"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#121620"
            stroke="#121620"
            strokeWidth="7"
            strokeLinejoin="round"
            style={{
              fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
              fontSize: "33px",
              fontWeight: 900,
              letterSpacing: "4px",
            }}
          >
            COURTS
          </text>

          {/* Solid White Fill */}
          <text
            x="160"
            y="108"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            style={{
              fontFamily: "var(--font-heading), var(--font-sans), sans-serif",
              fontSize: "33px",
              fontWeight: 900,
              letterSpacing: "4px",
            }}
          >
            COURTS
          </text>
        </g>
      </svg>

      {withSubtitle && (
        <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 mt-1">
          Pickleball Arena &amp; Pro Club
        </span>
      )}
    </div>
  );
}
