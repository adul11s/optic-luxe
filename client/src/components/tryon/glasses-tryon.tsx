'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  FaceMesh,
  Results as FaceMeshResults,
} from '@mediapipe/face_mesh';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

const LANDMARKS = {
  NOSE_BRIDGE: 6,
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_OUTER: 263,
  NOSE_TIP: 1,
  FOREHEAD: 10,
};

interface VariantAsset {
  variantId: string;
  colorName: string;
  colorHex: string;
  assets: {
    spriteUrl: string;
    modelUrl: string;
    thumbnailUrl: string;
  };
}

interface GlassesOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  spriteUrl: string | null;
  landmarks: Landmark[];
  videoWidth: number;
  videoHeight: number;
  mode: '2d' | '3d';
}

function GlassesOverlayCanvas({
  videoRef,
  canvasRef,
  spriteUrl,
  landmarks,
  videoWidth,
  videoHeight,
  mode,
}: GlassesOverlayProps) {
  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const [spriteLoaded, setSpriteLoaded] = useState(false);

  useEffect(() => {
    if (!spriteUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = spriteUrl;
    img.onload = () => {
      spriteImageRef.current = img;
      setSpriteLoaded(true);
    };
    img.onerror = () => setSpriteLoaded(false);
  }, [spriteUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mode === '2d' && landmarks.length > 0 && spriteLoaded && spriteImageRef.current) {
      const bridge = landmarks[LANDMARKS.NOSE_BRIDGE];
      const leftTemple = landmarks[LANDMARKS.LEFT_TEMPLE];
      const rightTemple = landmarks[LANDMARKS.RIGHT_TEMPLE];
      const leftEye = landmarks[LANDMARKS.LEFT_EYE_OUTER];
      const rightEye = landmarks[LANDMARKS.RIGHT_EYE_OUTER];

      if (!bridge || !leftTemple || !rightTemple || !leftEye || !rightEye) return;

      const templeDist = Math.hypot(
        (rightTemple.x - leftTemple.x) * videoWidth,
        (rightTemple.y - leftTemple.y) * videoHeight
      );
      const glassesWidth = templeDist * 1.6;

      const rollAngle = Math.atan2(
        (rightEye.y - leftEye.y) * videoHeight,
        (rightEye.x - leftEye.x) * videoWidth
      );

      const centerX = ((leftTemple.x + rightTemple.x) / 2) * videoWidth;
      const centerY = bridge.y * videoHeight;

      const sprite = spriteImageRef.current;
      const scale = glassesWidth / sprite.width;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rollAngle);
      ctx.scale(scale, scale);
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      ctx.restore();
    }
  }, [canvasRef, videoRef, landmarks, videoWidth, videoHeight, spriteLoaded, mode]);

  useEffect(() => {
    const interval = setInterval(draw, 16);
    return () => clearInterval(interval);
  }, [draw]);

  return null;
}

interface GlassesModelProps {
  landmarks: Landmark[];
  modelUrl: string;
  videoWidth: number;
  videoHeight: number;
}

function GlassesModel({ landmarks, modelUrl, videoWidth, videoHeight }: GlassesModelProps) {
  const { scene } = useThree();
  const mixerRef = useRef<any>(null);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    if (!modelUrl) return;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        modelRef.current = gltf.scene;
        if (mixerRef.current) mixerRef.current = null;
      },
      undefined,
      (err) => console.error('GLTF load error:', err)
    );
  }, [modelUrl]);

  useFrame(() => {
    if (!modelRef.current || landmarks.length === 0) return;

    const bridge = landmarks[LANDMARKS.NOSE_BRIDGE];
    const leftTemple = landmarks[LANDMARKS.LEFT_TEMPLE];
    const rightTemple = landmarks[LANDMARKS.RIGHT_TEMPLE];
    const leftEye = landmarks[LANDMARKS.LEFT_EYE_OUTER];
    const rightEye = landmarks[LANDMARKS.RIGHT_EYE_OUTER];
    const noseTip = landmarks[LANDMARKS.NOSE_TIP];
    const forehead = landmarks[LANDMARKS.FOREHEAD];

    if (!bridge || !leftTemple || !rightTemple || !leftEye || !rightEye || !noseTip || !forehead) return;

    const templeDist = Math.hypot(
      rightTemple.x - leftTemple.x,
      rightTemple.y - leftTemple.y
    );
    const expectedTempleDist = 0.09;
    const yaw = Math.atan2(
      (leftTemple.x + rightTemple.x) / 2 - 0.5,
      templeDist
    );

    const rollAngle = Math.atan2(
      rightEye.y - leftEye.y,
      rightEye.x - leftEye.x
    );

    const pitch = Math.atan2(
      noseTip.y - forehead.y,
      0.05
    );

    const centerX = ((leftTemple.x + rightTemple.x) / 2);
    const centerY = bridge.y;

    const model = modelRef.current;
    model.position.set(centerX * videoWidth - videoWidth / 2, -(centerY * videoHeight - videoHeight / 2), 0);
    model.rotation.set(pitch, yaw, rollAngle);
  });

  return modelRef.current ? <primitive object={modelRef.current} /> : null;
}

interface GlassesTryOnProps {
  productId: string;
  variants: VariantAsset[];
  activeVariantId: string | null;
  onVariantChange: (variant: VariantAsset) => void;
  onAddToCart: (productId: string, variantId: string) => void;
  onClose?: () => void;
}

type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export function GlassesTryOn({
  productId,
  variants,
  activeVariantId,
  onVariantChange,
  onAddToCart,
  onClose,
}: GlassesTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [activeVariant, setActiveVariant] = useState<VariantAsset | null>(
    activeVariantId ? variants.find((v) => v.variantId === activeVariantId) ?? null : variants[0] ?? null
  );
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const activeSprite = activeVariant?.assets.spriteUrl ?? null;
  const activeModel = activeVariant?.assets.modelUrl ?? null;

  useEffect(() => {
    const img = new Image();
    img.src = '/logo-watermark.png';
    img.onload = () => setLogoImg(img);
  }, []);

  const initCamera = useCallback(async () => {
    setCameraStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setVideoDims({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
      }
      setCameraStatus('active');

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results: FaceMeshResults) => {
        if (results.multiFaceLandmarks?.[0]) {
          setLandmarks(results.multiFaceLandmarks[0]);
        }
      });
      faceMeshRef.current = faceMesh;

      const processFrame = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2 && faceMeshRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
        rafRef.current = requestAnimationFrame(processFrame);
      };
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      setCameraStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, []);

  useEffect(() => {
    initCamera();
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      faceMeshRef.current?.close();
    };
  }, [initCamera]);

  const handleTakePhoto = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = videoDims.width;
    canvas.height = videoDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0);
    }

    if (mode === '2d' && canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0);
    }

    if (logoImg) {
      const logoW = canvas.width * 0.15;
      const logoH = logoW * (logoImg.height / logoImg.width);
      ctx.globalAlpha = 0.6;
      ctx.drawImage(logoImg, canvas.width - logoW - 12, canvas.height - logoH - 12, logoW, logoH);
      ctx.globalAlpha = 1.0;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    const link = document.createElement('a');
    link.download = 'my-glasses-look.jpg';
    link.href = dataUrl;
    link.click();
    setCapturedImage(null);
  }, [videoDims, mode, logoImg]);

  const handleShare = useCallback(async () => {
    if (!capturedImage) return;
    setIsSharing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoDims.width;
      canvas.height = videoDims.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      if (videoRef.current) ctx.drawImage(videoRef.current, 0, 0);
      if (mode === '2d' && canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0);
      if (logoImg) {
        const logoW = canvas.width * 0.15;
        const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(logoImg, canvas.width - logoW - 12, canvas.height - logoH - 12, logoW, logoH);
        ctx.globalAlpha = 1.0;
      }

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Failed to create image blob');

      const file = new File([blob], 'my-look.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My glasses from Optic Luxe' });
      } else {
        const fallbackLink = document.createElement('a');
        fallbackLink.download = 'my-look.jpg';
        fallbackLink.href = canvas.toDataURL('image/jpeg', 0.92);
        fallbackLink.click();
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsSharing(false);
    }
  }, [capturedImage, videoDims, mode, logoImg]);

  const handleAddToCart = useCallback(async () => {
    if (!activeVariant) return;
    setIsAddingToCart(true);
    try {
      await onAddToCart(productId, activeVariant.variantId);
    } finally {
      setIsAddingToCart(false);
    }
  }, [activeVariant, productId, onAddToCart]);

  const handleVariantSelect = useCallback((variant: VariantAsset) => {
    setActiveVariant(variant);
    onVariantChange(variant);
  }, [onVariantChange]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video + Canvas container */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {mode === '2d' && cameraStatus === 'active' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {mode === '3d' && cameraStatus === 'active' && (
          <Canvas
            className="absolute inset-0 w-full h-full"
            camera={{ position: [0, 0, 1], left: 0, right: 0, top: 0, bottom: 0 }}
            gl={{ alpha: true, antialias: true }}
          >
            <GlassesModel
              landmarks={landmarks}
              modelUrl={activeModel || ''}
              videoWidth={videoDims.width}
              videoHeight={videoDims.height}
            />
          </Canvas>
        )}

        {cameraStatus === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-white text-sm">Accessing camera...</p>
          </div>
        )}

        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <p className="text-red-400 text-sm text-center px-8">{errorMessage}</p>
            <button
              onClick={initCamera}
              className="mt-4 px-6 py-2 bg-white text-black rounded-xl text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-8">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setMode('2d')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors ${
                mode === '2d' ? 'bg-white text-black' : 'bg-black/40 text-white'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setMode('3d')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-colors ${
                mode === '3d' ? 'bg-white text-black' : 'bg-black/40 text-white'
              }`}
            >
              3D
            </button>
          </div>
        </div>

        {/* Color variant pills */}
        <div className="absolute top-20 left-4 right-4 z-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {variants.map((v) => (
              <button
                key={v.variantId}
                onClick={() => handleVariantSelect(v)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium transition-all"
                style={{
                  backgroundColor: activeVariant?.variantId === v.variantId ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.4)',
                  color: activeVariant?.variantId === v.variantId ? '#000' : '#fff',
                }}
              >
                <span
                  className="w-3 h-3 rounded-full border border-white/30"
                  style={{ backgroundColor: v.colorHex || '#666' }}
                />
                {v.colorName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="relative z-10 bg-black/80 backdrop-blur-md px-6 pt-4 pb-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        {/* Variant selector strip */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
          {variants.map((v) => (
            <button
              key={v.variantId}
              onClick={() => handleVariantSelect(v)}
              className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all"
              style={{
                borderColor: activeVariant?.variantId === v.variantId ? '#fff' : 'transparent',
                opacity: activeVariant?.variantId === v.variantId ? 1 : 0.6,
              }}
            >
              <img
                src={v.assets.thumbnailUrl}
                alt={v.colorName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleTakePhoto}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
            aria-label="Take photo"
          >
            <div className="w-10 h-10 rounded-full border-4 border-gray-300" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium mr-2 transition-colors disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {isSharing ? 'Sharing...' : 'Share look'}
          </button>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="flex-1 py-3 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-sm font-medium ml-2 transition-colors disabled:opacity-50"
          >
            {isAddingToCart ? 'Adding...' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { GlassesSelector };
export type { VariantAsset };