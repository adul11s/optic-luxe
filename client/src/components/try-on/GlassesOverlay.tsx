"use client";

import { useEffect, useRef } from "react";

interface GlassesOverlayProps {
  glassesPath: string;
  canvasWidth: number;
  canvasHeight: number;
}

export function GlassesOverlay({ glassesPath, canvasWidth, canvasHeight }: GlassesOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const glassesRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    videoRef.current = video;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        video.srcObject = stream;
        await video.play();
        draw();
      } catch (err: any) {
        console.error("Camera error:", err.message);
      }
    };

    const draw = () => {
      if (!canvas || !ctx) return;

      if (video.readyState >= 2) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvasWidth, 0, canvasWidth, canvasHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      const glasses = glassesRef.current;
      if (glasses && glasses.complete && glasses.naturalWidth > 0) {
        const gw = canvasWidth * 0.85;
        const gh = (canvasHeight / canvasWidth) * gw;
        const gx = (canvasWidth - gw) / 2;
        const gy = (canvasHeight - gh) / 2;
        ctx.drawImage(glasses, gx, gy, gw, gh);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const loadGlasses = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = glassesPath;
      glassesRef.current = img;
    };

    initCamera();
    loadGlasses();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [glassesPath, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="w-full h-full object-cover rounded-xl"
    />
  );
}