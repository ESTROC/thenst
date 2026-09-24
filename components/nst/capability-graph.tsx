"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, BookOpen, Building2, Compass } from "lucide-react";

interface NodeData {
  id: string;
  label: string;
  x3d: number;
  y3d: number;
  z3d: number;
  icon: React.ComponentType<{ className?: string }>;
  descriptor: string;
  description: string;
}

const NODES: NodeData[] = [
  {
    id: "people",
    label: "PEOPLE",
    x3d: -1.75,
    y3d: 0.65,
    z3d: 0.5,
    icon: Users,
    descriptor: "Professionals, Experts & Educators",
    description: "Practitioners, analysts, and instructors shaping national security capability."
  },
  {
    id: "strategy",
    label: "STRATEGY",
    x3d: 0,
    y3d: 1.75,
    z3d: -0.2,
    icon: Shield,
    descriptor: "Doctrine & Strategic Frameworks",
    description: "Multi-domain defense doctrine, cyber deterrence, and crisis coordination."
  },
  {
    id: "knowledge",
    label: "KNOWLEDGE",
    x3d: 1.75,
    y3d: 0.7,
    z3d: 0.4,
    icon: BookOpen,
    descriptor: "Research, Curricula & Intelligence",
    description: "Peer-reviewed intelligence briefs, doctrinal analyses, and structured courses."
  },
  {
    id: "organisations",
    label: "ORGANISATIONS",
    x3d: 1.25,
    y3d: -1.25,
    z3d: -0.6,
    icon: Building2,
    descriptor: "Institutions & Employers",
    description: "Research foundations, sovereign departments, and partner consortia."
  },
  {
    id: "opportunities",
    label: "OPPORTUNITIES",
    x3d: -1.25,
    y3d: -1.2,
    z3d: -0.4,
    icon: Compass,
    descriptor: "Projects, Fellowships & Missions",
    description: "Collaborative research calls, operational field projects, and professional paths."
  }
];

export function CapabilityGraph() {
  const [activeNode, setActiveNode] = useState<NodeData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let tilt = 0.18;
    let targetTilt = 0.18;
    let targetAngle = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetAngle = nx * 0.35;
      targetTilt = 0.18 + ny * 0.2;
    };

    const handleMouseLeave = () => {
      targetAngle = 0;
      targetTilt = 0.18;
      setActiveNode(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Subtle ambient background particles
    const particles = Array.from({ length: 24 }, () => ({
      x: (Math.random() - 0.5) * 3.4,
      y: (Math.random() - 0.5) * 3.0,
      z: (Math.random() - 0.5) * 3.0,
      size: Math.random() * 1.2 + 0.4,
      speed: (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1)
    }));

    const render = () => {
      angle += 0.006;
      tilt += (targetTilt - tilt) * 0.05;
      const effectiveAngle = angle + targetAngle;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 + 6;
      const fov = 265;

      const project = (x: number, y: number, z: number) => {
        const cosY = Math.cos(effectiveAngle);
        const sinY = Math.sin(effectiveAngle);
        const rx = x * cosY - z * sinY;
        const rz = x * sinY + z * cosY;

        const cosX = Math.cos(tilt);
        const sinX = Math.sin(tilt);
        const ry = y * cosX - rz * sinX;
        const rzFinal = y * sinX + rz * cosX + 4.1;

        const scale = fov / Math.max(rzFinal, 0.1);
        return {
          px: cx + rx * scale,
          py: cy - ry * scale,
          scale,
          z: rzFinal
        };
      };

      // Draw subtle orbital rings
      ctx.strokeStyle = "rgba(217, 83, 37, 0.08)";
      ctx.lineWidth = 1;
      [-0.7, 0, 0.7].forEach((gridY) => {
        ctx.beginPath();
        for (let i = 0; i <= 32; i++) {
          const a = (i / 32) * Math.PI * 2;
          const gx = Math.cos(a) * 2.1;
          const gz = Math.sin(a) * 2.1;
          const p = project(gx, gridY, gz);
          if (i === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();
      });

      // Draw particles
      particles.forEach((pt) => {
        pt.y += pt.speed;
        if (pt.y > 1.7) pt.y = -1.7;
        if (pt.y < -1.7) pt.y = 1.7;
        const p = project(pt.x, pt.y, pt.z);
        const alpha = Math.max(0.1, Math.min(0.4, 1 - p.z / 6));
        ctx.fillStyle = `rgba(217, 83, 37, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.px, p.py, pt.size, 0, Math.PI * 2);
        ctx.fill();
      });

      const projectedNodes = NODES.map((n) => ({
        ...n,
        proj: project(n.x3d, n.y3d, n.z3d)
      }));

      // Connections
      const connections: [number, number][] = [
        [0, 1], // people -> strategy
        [1, 2], // strategy -> knowledge
        [2, 3], // knowledge -> organisations
        [3, 4], // organisations -> opportunities
        [4, 0], // opportunities -> people
        [4, 1], // opportunities -> strategy
        [3, 1], // organisations -> strategy
        [0, 2], // people -> knowledge
      ];

      // Mesh fill
      ctx.beginPath();
      projectedNodes.forEach((node, idx) => {
        if (idx === 0) ctx.moveTo(node.proj.px, node.proj.py);
        else ctx.lineTo(node.proj.px, node.proj.py);
      });
      ctx.closePath();
      const meshGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w / 2);
      meshGrad.addColorStop(0, "rgba(217, 83, 37, 0.10)");
      meshGrad.addColorStop(1, "rgba(217, 83, 37, 0.01)");
      ctx.fillStyle = meshGrad;
      ctx.fill();

      // Connecting lines
      connections.forEach(([i, j]) => {
        const p1 = projectedNodes[i].proj;
        const p2 = projectedNodes[j].proj;

        ctx.strokeStyle = "rgba(217, 83, 37, 0.65)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();

        // Subtle traveling pulse
        const pulseT = ((Date.now() * 0.0012 + i * 0.35) % 1);
        const bx = p1.px + (p2.px - p1.px) * pulseT;
        const by = p1.py + (p2.py - p1.py) * pulseT;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nodes and Labels
      projectedNodes.forEach((node) => {
        const p = node.proj;
        const isCurrent = activeNode?.id === node.id;

        const glowRad = isCurrent ? 14 : 7;
        const grad = ctx.createRadialGradient(p.px, p.py, 2, p.px, p.py, glowRad);
        grad.addColorStop(0, "rgba(217, 83, 37, 0.85)");
        grad.addColorStop(1, "rgba(217, 83, 37, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.px, p.py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isCurrent ? "#ffffff" : "#d95325";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.px, p.py, isCurrent ? 5.5 : 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isCurrent ? "#ffffff" : "#d95325";
        ctx.beginPath();
        ctx.arc(p.px, p.py, isCurrent ? 2.5 : 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.fillStyle = isCurrent ? "#ffffff" : "#a2a8b2";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const labelY = p.py + (node.y3d > 0 ? -14 : 16);
        ctx.fillText(node.label, p.px, labelY);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, [activeNode]);

  return (
    <div className="relative w-full max-w-[500px] mx-auto group">
      {/* 2D / 3D Canvas Box */}
      <div className="relative aspect-[1/0.82] w-full border border-[#3b414a] bg-[#181c23] overflow-hidden shadow-2xl">
        <div className="network-grid-bg absolute inset-0 pointer-events-none opacity-40" />

        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

        {/* Hover / Inspection Card */}
        <AnimatePresence>
          {activeNode && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3 right-3 bg-[#111419]/95 backdrop-blur-md border border-[#d95325]/40 p-3.5 z-30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#d95325]/20 flex items-center justify-center text-[#d95325]">
                    <activeNode.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-white uppercase font-sans">
                    {activeNode.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#d95325]">
                  Core Pillar
                </span>
              </div>
              <p className="text-[11px] text-[#c5c9ce] leading-relaxed font-sans mb-1">
                {activeNode.descriptor}
              </p>
              <p className="text-[10px] text-[#8e95a0] leading-relaxed font-sans">
                {activeNode.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption directly requested */}
      <p className="text-[11px] text-[#898f97] mt-3.5 tracking-[0.5px]">
        A connected view of national security capability
      </p>
    </div>
  );
}
