"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Rocket, Brain, Code2, Sparkles, Zap } from "lucide-react";

const hypeLines = [
  "Level up your skills 🚀",
  "Your future self will thank you 💡",
  "Learning mode: activated ⚡",
  "Big things start here 🌟",
  "Let's build something amazing 🛠️",
];

const floatIcons = [Rocket, Brain, Code2, Sparkles, Zap, GraduationCap];

export function LoadingScreen() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % hypeLines.length), 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-navy-500"
    >
      {/* animated gradient glow */}
      <motion.div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky/30 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet/25 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* floating icons scattered around */}
      {floatIcons.map((Icon, i) => {
        const positions = [
          { left: "12%", top: "22%" },
          { left: "82%", top: "28%" },
          { left: "18%", top: "70%" },
          { left: "78%", top: "68%" },
          { left: "50%", top: "14%" },
          { left: "50%", top: "82%" },
        ];
        return (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-white/20"
            style={positions[i]}
            animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          >
            <Icon size={28 + (i % 3) * 6} />
          </motion.div>
        );
      })}

      {/* center logo with bounce + spin ring */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* spinning ring */}
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-dashed border-sky/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky to-violet text-white shadow-lg">
            <GraduationCap size={32} />
          </span>
        </motion.div>

        <motion.p
          className="mt-6 font-display text-3xl font-bold text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          NST<span className="bg-gradient-to-r from-sky to-violet bg-clip-text text-transparent"> Learn</span>
        </motion.p>

        {/* rotating hype line */}
        <div className="mt-2 h-6 overflow-hidden">
          <motion.p
            key={line}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-medium text-navy-100"
          >
            {hypeLines[line]}
          </motion.p>
        </div>

        {/* bouncing dots loader */}
        <div className="mt-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-sky"
              animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
