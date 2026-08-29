"use client";

import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface PickleballCourtVisualizerProps {
  interactive?: boolean;
  selectedCourtName?: string;
}

export function PickleballCourtVisualizer({ 
  interactive = true, 
  selectedCourtName = "Court 1" 
}: PickleballCourtVisualizerProps) {
  const [activeZone, setActiveZone] = useState<string>("kitchen");

  const zoneDescriptions: Record<string, { title: string; desc: string; tip: string }> = {
    kitchen: {
      title: "Non-Volley Zone ('The Kitchen')",
      desc: "7 feet on both sides of the net. Players cannot volley (hit the ball in the air) while standing in this zone.",
      tip: "Master the soft 'Dink' shot here to control the pace of the rally!",
    },
    left_service: {
      title: "Left Service Court (Odd Court)",
      desc: "10' × 15' court area used when the serving team's score is an odd number (1, 3, 5, etc.).",
      tip: "Aim deep towards the opponent's backhand for high-pressure returns.",
    },
    right_service: {
      title: "Right Service Court (Even / First Server)",
      desc: "10' × 15' court area where every new game begins at 0-0-2 score.",
      tip: "Keep serves deep and low past the transition zone.",
    },
    net: {
      title: "Official Championship Net",
      desc: "36 inches high at the sidelines and 34 inches in the exact center.",
      tip: "Our tournament courts use heavy steel tension posts for true ball response.",
    },
    baseline: {
      title: "20-Foot Baseline & Transition Zone",
      desc: "The rear boundary where players execute third-shot drops and deep drives.",
      tip: "8mm Cushioned multi-layer polyurethane reduces impact on knees and ankles.",
    }
  };

  const currentZone = zoneDescriptions[activeZone] || zoneDescriptions.kitchen;

  return (
    <div className="w-full bg-[#181b22] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden font-sans text-slate-100">
      
      {/* Top Court Information Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              Official 20&apos; × 44&apos; Pickleball Court Spec
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tournament-grade polyurethane cushion surface with USA Pickleball certified dimensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {selectedCourtName} • 850 Lux Lighting
          </span>
        </div>
      </div>

      {/* SVG Authentic Pickleball Court Diagram */}
      <div className="relative w-full max-w-2xl mx-auto py-2">
        <svg
          viewBox="0 0 600 320"
          className="w-full h-auto drop-shadow-2xl rounded-2xl overflow-visible select-none"
        >
          <defs>
            {/* Pickleball Perforated Ball Pattern */}
            <pattern id="pickleball-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="rgba(255, 221, 0, 0.15)" />
            </pattern>

            {/* Gradient for court surface */}
            <linearGradient id="court-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E232E" />
              <stop offset="100%" stopColor="#14171F" />
            </linearGradient>

            <linearGradient id="kitchen-bg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991B1B" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#D97706" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#991B1B" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Surrounding Out-of-bounds Apron */}
          <rect x="10" y="10" width="580" height="300" rx="16" fill="url(#court-bg)" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
          
          {/* Main Court Playing Surface (20' x 44' ratio = 500 x 240) */}
          <rect
            x="50"
            y="40"
            width="500"
            height="240"
            rx="4"
            fill="#1B202A"
            stroke="#FFFFFF"
            strokeWidth="4"
          />

          {/* Court Center Net Line (Heavy Net representation with mesh) */}
          <g 
            onClick={() => interactive && setActiveZone("net")}
            className="cursor-pointer group"
          >
            <line x1="300" y1="28" x2="300" y2="292" stroke="#FFDD00" strokeWidth="6" strokeDasharray="6 3" />
            <circle cx="300" cy="28" r="5" fill="#FFDD00" />
            <circle cx="300" cy="292" r="5" fill="#FFDD00" />
            <text x="300" y="20" fill="#FFDD00" fontSize="10" fontWeight="900" textAnchor="middle">
              NET (34&quot; CENTER)
            </text>
          </g>

          {/* Left Kitchen Zone (7 ft from net = 80px) */}
          <g 
            onClick={() => interactive && setActiveZone("kitchen")}
            className="cursor-pointer"
          >
            <rect
              x="220"
              y="40"
              width="80"
              height="240"
              fill="url(#kitchen-bg)"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "kitchen" ? "stroke-amber-400 stroke-[3px]" : ""}`}
            />
            <text x="260" y="165" fill="#FDE047" fontSize="13" fontWeight="900" textAnchor="middle" transform="rotate(-90 260 165)">
              THE KITCHEN
            </text>
          </g>

          {/* Right Kitchen Zone (7 ft from net = 80px) */}
          <g 
            onClick={() => interactive && setActiveZone("kitchen")}
            className="cursor-pointer"
          >
            <rect
              x="300"
              y="40"
              width="80"
              height="240"
              fill="url(#kitchen-bg)"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "kitchen" ? "stroke-amber-400 stroke-[3px]" : ""}`}
            />
            <text x="340" y="165" fill="#FDE047" fontSize="13" fontWeight="900" textAnchor="middle" transform="rotate(90 340 165)">
              NON-VOLLEY 7 FT
            </text>
          </g>

          {/* Left Side Service Courts (Divided by centerline) */}
          {/* Left Side - Right Service (Even) */}
          <g 
            onClick={() => interactive && setActiveZone("right_service")}
            className="cursor-pointer"
          >
            <rect
              x="50"
              y="160"
              width="170"
              height="120"
              fill="#222834"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "right_service" ? "fill-red-950/50 stroke-red-500" : ""}`}
            />
            <text x="135" y="225" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              Right Service (Even)
            </text>
          </g>

          {/* Left Side - Left Service (Odd) */}
          <g 
            onClick={() => interactive && setActiveZone("left_service")}
            className="cursor-pointer"
          >
            <rect
              x="50"
              y="40"
              width="170"
              height="120"
              fill="#1F2530"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "left_service" ? "fill-red-950/50 stroke-red-500" : ""}`}
            />
            <text x="135" y="105" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              Left Service (Odd)
            </text>
          </g>

          {/* Right Side Service Courts */}
          {/* Right Side - Left Service (Odd) */}
          <g 
            onClick={() => interactive && setActiveZone("left_service")}
            className="cursor-pointer"
          >
            <rect
              x="380"
              y="160"
              width="170"
              height="120"
              fill="#1F2530"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "left_service" ? "fill-red-950/50 stroke-red-500" : ""}`}
            />
            <text x="465" y="225" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              Left Service (Odd)
            </text>
          </g>

          {/* Right Side - Right Service (Even) */}
          <g 
            onClick={() => interactive && setActiveZone("right_service")}
            className="cursor-pointer"
          >
            <rect
              x="380"
              y="40"
              width="170"
              height="120"
              fill="#222834"
              stroke="#FFFFFF"
              strokeWidth="2"
              className={`transition-all ${activeZone === "right_service" ? "fill-red-950/50 stroke-red-500" : ""}`}
            />
            <text x="465" y="105" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">
              Right Service (Even)
            </text>
          </g>

          {/* Centerlines (Y=160 from X=50 to 220, and X=380 to 550) */}
          <line x1="50" y1="160" x2="220" y2="160" stroke="#FFFFFF" strokeWidth="3" />
          <line x1="380" y1="160" x2="550" y2="160" stroke="#FFFFFF" strokeWidth="3" />

          {/* Baselines (X=50 and X=550) */}
          <g onClick={() => interactive && setActiveZone("baseline")} className="cursor-pointer">
            <line x1="50" y1="40" x2="50" y2="280" stroke="#E52521" strokeWidth="5" />
            <line x1="550" y1="40" x2="550" y2="280" stroke="#E52521" strokeWidth="5" />
          </g>

          {/* Dimension Indicators */}
          <text x="300" y="310" fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle">
            ← 44 FEET LENGTH (22 FT PER SIDE) →
          </text>
          <text x="25" y="165" fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle" transform="rotate(-90 25 165)">
            20 FT WIDTH
          </text>
        </svg>
      </div>

      {/* Interactive Zone Inspector Info Card */}
      {interactive && (
        <div className="p-4 rounded-2xl bg-[#14161b] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/30">
                Interactive Inspector
              </span>
              <h4 className="font-bold text-white text-sm">{currentZone.title}</h4>
            </div>
            <p className="text-xs text-slate-300">{currentZone.desc}</p>
            <p className="text-xs text-amber-400 font-semibold flex items-center gap-1 pt-0.5">
              <Sparkles className="w-3 h-3" /> Pro Tip: {currentZone.tip}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveZone("kitchen")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeZone === "kitchen" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              The Kitchen
            </button>
            <button
              type="button"
              onClick={() => setActiveZone("right_service")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeZone === "right_service" ? "bg-red-500 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Service Box
            </button>
            <button
              type="button"
              onClick={() => setActiveZone("net")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeZone === "net" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Net
            </button>
          </div>
        </div>
      )}

      {/* Quick Pickleball Spec Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1 border-t border-white/10 text-xs">
        <div className="p-2.5 rounded-xl bg-[#14161b] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Court Dimensions</span>
          <span className="font-black text-white">20&apos; × 44&apos; Standard</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#14161b] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Height</span>
          <span className="font-black text-amber-400">36&quot; Post / 34&quot; Center</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#14161b] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Non-Volley Depth</span>
          <span className="font-black text-white">7 Feet Each Side</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#14161b] border border-white/5 space-y-0.5">
          <span className="text-slate-400 block text-[10px] font-bold uppercase">Surface Cushion</span>
          <span className="font-black text-red-400">8mm Polyurethane</span>
        </div>
      </div>

    </div>
  );
}
