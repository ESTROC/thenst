"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

function fmt(t: number): string {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const seek = useCallback((value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrent(value);
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => { if (!scrubbing) setCurrent(v.currentTime); };
    const onMeta = () => setDuration(v.duration);
    const onEnd = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
    };
  }, [scrubbing]);

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-navy-900 shadow-card">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onClick={togglePlay}
        className="aspect-video w-full cursor-pointer bg-black"
        playsInline
      />

      {/* center play button when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-navy-500 shadow-lg transition-transform hover:scale-105">
            <Play size={26} fill="currentColor" className="ml-1" />
          </span>
        </button>
      )}

      {/* controls bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100" style={{ opacity: playing ? undefined : 1 }}>
        {/* timeline */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          onChange={(e) => seek(Number(e.target.value))}
          onMouseDown={() => setScrubbing(true)}
          onMouseUp={() => setScrubbing(false)}
          onTouchStart={() => setScrubbing(true)}
          onTouchEnd={() => setScrubbing(false)}
          aria-label="Seek"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none"
          style={{
            background: `linear-gradient(to right, #2E90FA ${pct}%, rgba(255,255,255,.3) ${pct}%)`,
          }}
        />

        <div className="mt-2 flex items-center gap-3 text-white">
          <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="hover:text-sky">
            {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="hover:text-sky">
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <span className="text-xs tabular-nums text-white/90">
            {fmt(current)} / {fmt(duration)}
          </span>
          <button onClick={goFullscreen} aria-label="Fullscreen" className="ml-auto hover:text-sky">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border: none;
          border-radius: 9999px;
          background: #ffffff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
