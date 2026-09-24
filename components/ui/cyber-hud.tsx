"use client";

import React from "react";
import { motion } from "framer-motion";

export function CyberHUD() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-40">
      {/* Primary Grid - NAVY ACCENT */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 128, 0.08) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(0, 0, 128, 0.08) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      {/* Larger Sub-grid - GREEN ACCENT */}
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: `linear-gradient(to right, rgba(19, 136, 8, 0.05) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(19, 136, 8, 0.05) 1px, transparent 1px)`,
          backgroundSize: '200px 200px'
        }} 
      />

      {/* Scanning Horizontal Line - SAFFRON */}
      <motion.div 
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-saffron/40 to-transparent shadow-[0_0_15px_rgba(255,153,51,0.2)]"
      />

      {/* Crosshair Markers - GREEN */}
      <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-india-green/30" />
      <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-india-green/30" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-india-green/30" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-india-green/30" />

      {/* Technical Data Bits - NAVY */}
      <div className="absolute top-24 left-10 text-[10px] font-mono text-ashoka-blue/50 space-y-1">
        <p>LAT: 28.6139° N</p> {/* New Delhi Coordinates */}
        <p>LNG: 77.2090° E</p>
        <p>ALT: 216.0m</p>
      </div>
      
      <div className="absolute top-24 right-10 text-[10px] font-mono text-ashoka-blue/50 text-right space-y-1">
        <p>STATUS: OPERATIONAL</p>
        <p>FREQ: 5.8GHZ</p>
        <p>SIG: SECURE</p>
      </div>

      {/* Circular HUD Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-saffron/10 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-india-green/10 rounded-full" />
    </div>
  );
}
