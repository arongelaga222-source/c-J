"use client";

import React, { useState } from "react";
import { Sparkles, Trophy, Info, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PickleballCourtVisualizerProps {
  interactive?: boolean;
  selectedCourtName?: string;
}

export function PickleballCourtVisualizer({ 
  interactive = true, 
  selectedCourtName = "Court 1 - Indoor (Pro Cushion)" 
}: PickleballCourtVisualizerProps) {
  const [activeZone, setActiveZone] = useState<string>("kitchen");

  const zoneDescriptions: Record<string, { title: string; subtitle: string; desc: string; tip: string; color: string }> = {
    kitchen: {
      title: "Non-Volley Zone ('The Kitchen')",
      subtitle: "7 FT from both sides of the net",
      desc: "The iconic 7-foot zone where players cannot hit the ball out of the air (volley). You may only step in after the ball has bounced.",
      tip: "Hit soft 'dinks' into the opponent's kitchen to force them to pop the ball up for an overhead smash!",
      color: "border-teal-500/50 bg-teal-950/40 text-teal-400"
    },
    left_service: {
      title: "Left Service Court (Odd Court)",
      subtitle: "10' × 15' Playing Box",
      desc: "Used when the serving team's score is an odd number (1, 3, 5, etc.). The server must hit diagonally crosscourt beyond the kitchen line.",
      tip: "Target the deep backhand corner to disrupt the receiving team's transition to the net.",
      color: "border-amber-500/50 bg-amber-950/40 text-amber-400"
    },
    right_service: {
      title: "Right Service Court (Even / Server 1)",
      subtitle: "10' × 15' Playing Box",
      desc: "Where every new game begins at 0-0-2. Used when the serving team has an even score (0, 2, 4, etc.).",
      tip: "Deliver a deep, low serve to pin the returner at the baseline, allowing your partner to set up.",
      color: "border-red-500/50 bg-red-950/40 text-red-400"
    },
    net: {
      title: "Championship Steel Tension Net",
      subtitle: "36\" at Sidelines • 34\" at Center Strap",
      desc: "Regulation tournament height with heavy gauge PVC mesh and a durable red headband strap for accurate net cord bounces.",
      tip: "Keep dinks within 2-4 inches above the net cord to prevent aggressive attacks.",
      color: "border-red-500/50 bg-red-950/40 text-red-400"
    },
    baseline: {
      title: "Baseline & 8mm Cushioned Floor",
      subtitle: "22 FT from the Net",
      desc: "Rear boundary where third-shot drops and baseline drives are launched. Multi-layer polyurethane shock absorption protects player knees.",
      tip: "Execute a soft 'Third Shot Drop' from here that arcs gently into the opponent's kitchen.",
      color: "border-[#d4ff00]/50 bg-[#d4ff00]/10 text-[#d4ff00]"
    }
  };

  const currentZone = zoneDescriptions[activeZone] || zoneDescriptions.kitchen;

  return (
    <div className="w-full bg-[#131720] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden font-sans text-slate-100">
      
      {/* Top Court Information Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4ff00] animate-pulse" />
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              Interactive 20&apos; × 44&apos; USAP Court Blueprint
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any zone on the court diagram below to inspect dimensions, rules, and pro tactical tips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#d4ff00]/15 text-[#d4ff00] border border-[#d4ff00]/30 shadow-sm">
            {selectedCourtName} • 850 Lux Anti-Glare
          </span>
        </div>
      </div>

      {/* SVG Pickleball Court Diagram */}
      <div className="relative w-full max-w-3xl mx-auto py-2">
        <svg
          viewBox="0 0 620 340"
          className="w-full h-auto drop-shadow-2xl rounded-2xl overflow-visible select-none"
        >
          <defs>
            {/* Court Apron Deep Blue/Emerald */}
            <linearGradient id="court-apron-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#122b3b" />
              <stop offset="100%" stopColor="#0d1e2b" />
            </linearGradient>

            {/* Kitchen NVZ Teal Gradient */}
            <linearGradient id="kitchen-teal-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0d5c58" />
              <stop offset="100%" stopColor="#083d3b" />
            </linearGradient>

            {/* Service Court Deep Navy Playing Surface */}
            <linearGradient id="service-blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#152b47" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#d4ff00" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Surrounding Out-of-bounds Apron Floor */}
          <rect
            x="10"
            y="10"
            width="600"
            height="320"
            rx="18"
            fill="url(#court-apron-grad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />

          {/* Court Playing Perimeter (20' x 44' ratio = 520 x 240) */}
          <rect
            x="50"
            y="50"
            width="520"
            height="240"
            rx="4"
            fill="url(#service-blue-grad)"
            stroke="#d4ff00"
            strokeWidth="4"
          />

          {/* Left Side Service Courts */}
          {/* Left Side - Left Service (Odd) */}
          <g 
            onClick={() => interactive && setActiveZone("left_service")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="50"
              y="50"
              width="175"
              height="120"
              fill={activeZone === "left_service" ? "#2d5485" : "url(#service-blue-grad)"}
              stroke="#d4ff00"
              strokeWidth="2"
              className="transition-colors group-hover:fill-[#254670]"
            />
            <text x="137" y="115" fill="#f8fafc" fontSize="12" fontWeight="800" textAnchor="middle">
              Left Service (Odd)
            </text>
            <text x="137" y="132" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
              10&apos; × 15&apos;
            </text>
          </g>

          {/* Left Side - Right Service (Even) */}
          <g 
            onClick={() => interactive && setActiveZone("right_service")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="50"
              y="170"
              width="175"
              height="120"
              fill={activeZone === "right_service" ? "#2d5485" : "url(#service-blue-grad)"}
              stroke="#d4ff00"
              strokeWidth="2"
              className="transition-colors group-hover:fill-[#254670]"
            />
            <text x="137" y="235" fill="#f8fafc" fontSize="12" fontWeight="800" textAnchor="middle">
              Right Service (Even)
            </text>
            <text x="137" y="252" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
              10&apos; × 15&apos;
            </text>
          </g>

          {/* Centerlines Left */}
          <line x1="50" y1="170" x2="225" y2="170" stroke="#d4ff00" strokeWidth="3" />

          {/* Left Kitchen (The Non-Volley Zone - 7 FT) */}
          <g 
            onClick={() => interactive && setActiveZone("kitchen")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="225"
              y="50"
              width="85"
              height="240"
              fill={activeZone === "kitchen" ? "#117772" : "url(#kitchen-teal-grad)"}
              stroke="#d4ff00"
              strokeWidth={activeZone === "kitchen" ? 4 : 2}
              className="transition-colors group-hover:fill-[#0f6b66]"
            />
            <text x="267" y="170" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle" transform="rotate(-90 267 170)">
              NON-VOLLEY ZONE (7 FT)
            </text>
          </g>

          {/* Right Kitchen (The Non-Volley Zone - 7 FT) */}
          <g 
            onClick={() => interactive && setActiveZone("kitchen")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="310"
              y="50"
              width="85"
              height="240"
              fill={activeZone === "kitchen" ? "#117772" : "url(#kitchen-teal-grad)"}
              stroke="#d4ff00"
              strokeWidth={activeZone === "kitchen" ? 4 : 2}
              className="transition-colors group-hover:fill-[#0f6b66]"
            />
            <text x="352" y="170" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle" transform="rotate(90 352 170)">
              &quot;THE KITCHEN&quot;
            </text>
          </g>

          {/* Right Side Service Courts */}
          {/* Right Side - Right Service (Even) */}
          <g 
            onClick={() => interactive && setActiveZone("right_service")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="395"
              y="50"
              width="175"
              height="120"
              fill={activeZone === "right_service" ? "#2d5485" : "url(#service-blue-grad)"}
              stroke="#d4ff00"
              strokeWidth="2"
              className="transition-colors group-hover:fill-[#254670]"
            />
            <text x="482" y="115" fill="#f8fafc" fontSize="12" fontWeight="800" textAnchor="middle">
              Right Service (Even)
            </text>
            <text x="482" y="132" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
              10&apos; × 15&apos;
            </text>
          </g>

          {/* Right Side - Left Service (Odd) */}
          <g 
            onClick={() => interactive && setActiveZone("left_service")}
            className="cursor-pointer transition-all group"
          >
            <rect
              x="395"
              y="170"
              width="175"
              height="120"
              fill={activeZone === "left_service" ? "#2d5485" : "url(#service-blue-grad)"}
              stroke="#d4ff00"
              strokeWidth="2"
              className="transition-colors group-hover:fill-[#254670]"
            />
            <text x="482" y="235" fill="#f8fafc" fontSize="12" fontWeight="800" textAnchor="middle">
              Left Service (Odd)
            </text>
            <text x="482" y="252" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
              10&apos; × 15&apos;
            </text>
          </g>

          {/* Centerlines Right */}
          <line x1="395" y1="170" x2="570" y2="170" stroke="#d4ff00" strokeWidth="3" />

          {/* Net in the exact center (X=310) */}
          <g 
            onClick={() => interactive && setActiveZone("net")}
            className="cursor-pointer group"
          >
            {/* Center Net Mesh line */}
            <line x1="310" y1="36" x2="310" y2="304" stroke="#ffffff" strokeWidth="4" />
            {/* Red Headband Top Strap */}
            <line x1="310" y1="36" x2="310" y2="304" stroke="#ea2e2e" strokeWidth="3" strokeDasharray="6 2" />
            {/* Net Posts */}
            <circle cx="310" cy="36" r="6" fill="#ffffff" stroke="#ea2e2e" strokeWidth="2" />
            <circle cx="310" cy="304" r="6" fill="#ffffff" stroke="#ea2e2e" strokeWidth="2" />
            <text x="310" y="28" fill="#ea2e2e" fontSize="10" fontWeight="900" textAnchor="middle">
              NET (34&quot; CENTER / 36&quot; POSTS)
            </text>
          </g>

          {/* Baselines */}
          <g onClick={() => interactive && setActiveZone("baseline")} className="cursor-pointer">
            <line x1="50" y1="50" x2="50" y2="290" stroke="#d4ff00" strokeWidth="4" />
            <line x1="570" y1="50" x2="570" y2="290" stroke="#d4ff00" strokeWidth="4" />
          </g>

          {/* Dimensions */}
          <text x="310" y="325" fill="#94a3b8" fontSize="10" fontWeight="800" textAnchor="middle">
            ← 44 FEET OFFICIAL LENGTH • CUSHIONED TOURNAMENT FLOORING →
          </text>
          <text x="25" y="170" fill="#94a3b8" fontSize="10" fontWeight="800" textAnchor="middle" transform="rotate(-90 25 170)">
            20 FT WIDTH
          </text>
        </svg>
      </div>

      {/* Interactive Zone Inspector Info Card */}
      {interactive && (
        <div className={`p-5 rounded-2xl border transition-all duration-300 ${currentZone.color}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-black uppercase tracking-wider">
                  Zone Inspector
                </span>
                <h4 className="font-black text-white text-base">{currentZone.title}</h4>
                <span className="text-xs text-slate-300 font-medium">({currentZone.subtitle})</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{currentZone.desc}</p>
              <p className="text-xs text-white font-bold flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-[#d4ff00]" /> Pro Tip: {currentZone.tip}
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveZone("kitchen")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeZone === "kitchen" 
                    ? "bg-teal-500 text-slate-950 shadow-md" 
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                The Kitchen (NVZ)
              </button>
              <button
                type="button"
                onClick={() => setActiveZone("right_service")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeZone === "right_service" 
                    ? "bg-red-600 text-white shadow-md" 
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                Right Service (Even)
              </button>
              <button
                type="button"
                onClick={() => setActiveZone("left_service")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeZone === "left_service" 
                    ? "bg-amber-500 text-slate-950 shadow-md" 
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                Left Service (Odd)
              </button>
              <button
                type="button"
                onClick={() => setActiveZone("net")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeZone === "net" 
                    ? "bg-red-500 text-white shadow-md" 
                    : "bg-slate-900/80 text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                Center Net
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Spec Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2 border-t border-white/10 text-xs">
        <div className="p-3 rounded-2xl bg-[#0f1218] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Court Dimensions</span>
          <span className="font-black text-white">20&apos; × 44&apos; Regulation</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#0f1218] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Height</span>
          <span className="font-black text-[#d4ff00]">36&quot; Post / 34&quot; Center</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#0f1218] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Non-Volley Depth</span>
          <span className="font-black text-teal-400">7 FT Kitchen</span>
        </div>
        <div className="p-3 rounded-2xl bg-[#0f1218] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Surface Spec</span>
          <span className="font-black text-red-400">8mm Cushioned Shock-Pad</span>
        </div>
      </div>

    </div>
  );
}
