"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrthographicCamera } from "@react-three/drei";
import { ScanFace, Heart, Minus, Plus, Star, Truck, Shield, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button, Card, Badge, Skeleton } from "@/components/ui"; // Adjust imports to your actual UI library path
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { Product, Review } from "@/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ==========================================
// 1. MAIN PAGE COMPONENT
// ==========================================
export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [selectedImage, setSelectedImage] = useState(0);
  const [showTryOn, setShowTryOn] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<{ data: Product }>(`/products/${slug}`),
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", product?.data?.data?.id],
    queryFn: () => api.get<{ data: Review[] }>(`/reviews/product/${product?.data?.data?.id}`),
    enabled: !!product?.data?.data?.id,
  });

  if (isLoading) return <ProductDetailSkeleton />;

  const p = product?.data?.data as Product | undefined;
  
  if (!p) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <Card className="text-center py-12 px-8">
          <h2 className="text-xl font-semibold text-brand-950 mb-2">Product not found</h2>
          <p className="text-brand-500 mb-4">The product you're looking for doesn't exist.</p>
          <Link href="/shop"><Button>Back to Shop</Button></Link>
        </Card>
      </div>
    );
  }

  const images = p.images.length > 0 ? p.images : [{ id: "1", url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800", isPrimary: true, sortOrder: 0 }];
  const variants = p.variants || [];
  const reviews = (reviewsData?.data?.data || []) as Review[];

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleAddToCart = async () => {
    if (variants.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    }
    alert("Added to cart!");
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <nav className="flex items-center gap-2 text-sm text-brand-500 mb-8">
          <Link href="/home" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-brand-700">Shop</Link>
          <span>/</span>
          <span className="text-brand-950">{p.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm">
              <img src={images[selectedImage]?.url} alt={p.name} className="w-full h-full object-cover" />
              {p.isNewArrival && <Badge className="absolute top-4 left-4" variant="info">New Arrival</Badge>}
              {p.discountPrice && <Badge className="absolute top-4 right-4" variant="danger">Sale</Badge>}
              
              {/* Try On Button */}
              <Button
                className="absolute bottom-4 left-4"
                size="sm"
                leftIcon={<ScanFace className="w-4 h-4" />}
                onClick={() => setShowTryOn(true)}
              >
                Try On
              </Button>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? "border-brand-950" : "border-transparent hover:border-brand-200"
                    }`}
                  >
                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={{ delay: 0.1 }} className="space-y-6">
            <div>
              <p className="text-sm text-brand-500 uppercase tracking-wider mb-2">{p.brand}</p>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-brand-950 mb-4">{p.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= Number(averageRating) ? "fill-accent-gold text-accent-gold" : "text-brand-300"}`} />
                  ))}
                </div>
                <span className="text-sm text-brand-600">{averageRating} ({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center gap-4">
                {p.discountPrice ? (
                  <>
                    <span className="text-3xl font-bold text-brand-950">{formatPrice(p.discountPrice)}</span>
                    <span className="text-xl text-brand-400 line-through">{formatPrice(p.basePrice)}</span>
                    <Badge variant="danger">{Math.round((1 - p.discountPrice / p.basePrice) * 100)}% OFF</Badge>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-brand-950">{formatPrice(p.basePrice)}</span>
                )}
              </div>
            </div>

            <div className="prose prose-brand max-w-none">
              <p className="text-brand-600 leading-relaxed">{p.description}</p>
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-700 mb-3">Select Color</label>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant.id)}
                        className={`px-4 py-2 rounded-full border-2 transition-all ${
                          selectedVariant === variant.id ? "border-brand-950 bg-brand-950 text-white" : "border-brand-200 hover:border-brand-400"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {variant.colorHex && <span className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: variant.colorHex }} />}
                          {variant.colorName || variant.sizeLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-brand-700">Quantity:</span>
                  <div className="flex items-center border border-brand-200 rounded-full">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-brand-600 hover:text-brand-950">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-brand-600 hover:text-brand-950">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>Add to Cart</Button>
              <Button variant="outline" size="lg" leftIcon={<Heart className="w-5 h-5" />}>Wishlist</Button>
            </div>
            
            {/* Features Card */}
            <Card className="bg-brand-50 border-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-brand-600" /><div><p className="text-sm font-medium">Free Shipping</p></div></div>
                <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-brand-600" /><div><p className="text-sm font-medium">2 Year Warranty</p></div></div>
                <div className="flex items-center gap-3"><RotateCcw className="w-5 h-5 text-brand-600" /><div><p className="text-sm font-medium">30 Day Returns</p></div></div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Render the Modal */}
      {showTryOn && p && (
        <TryOnModal
          product={p}
          variantId={selectedVariant || (variants[0]?.id ?? '')}
          onClose={() => setShowTryOn(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// 2. 3D GLASSES COMPONENT (THREE.JS)
// ==========================================
function GlassesModel({ 
  glbUrl, 
  faceDataRef, 
  videoSize 
}: { 
  glbUrl: string; 
  faceDataRef: React.MutableRefObject<{ x: number; y: number; width: number; angle: number } | null>; 
  videoSize: { width: number; height: number } 
}) {
  const { scene } = useGLTF(glbUrl);
  const modelRef = useRef<THREE.Group>(null);
  const currentOpacity = useRef(0);

  // Safely traverse materials for fade-out support
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((mat) => {
            const newMat = mat.clone();
            newMat.transparent = true;
            newMat.needsUpdate = true;
            return newMat;
          });
        } else {
          mesh.material = mesh.material.clone();
          mesh.material.transparent = true;
          mesh.material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (!modelRef.current) return;

    // Smooth Opacity Fade
    const targetOpacity = faceDataRef.current ? 1 : 0;
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity, delta * 10);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => (mat.opacity = currentOpacity.current));
        } else {
          mesh.material.opacity = currentOpacity.current;
        }
      }
    });

    // Positioning and Scaling
    if (faceDataRef.current) {
      const { x, y, width, angle } = faceDataRef.current;

      const mirroredX = videoSize.width - x;
      const threeX = mirroredX - videoSize.width / 2;
      const threeY = -(y - videoSize.height / 2);

      // CALIBRATION: Tweak these numbers based on your specific .glb file
      const SCALE_MULTIPLIER = 0.8; // Adjust if glasses are too big/small
      const Y_OFFSET = 0; // Negative moves glasses down the nose, positive moves up

      const finalScale = width * SCALE_MULTIPLIER;

      modelRef.current.position.set(threeX, threeY + Y_OFFSET, 0);
      modelRef.current.rotation.z = -angle;
      modelRef.current.scale.set(finalScale, finalScale, finalScale);
      
    } else if (currentOpacity.current < 0.01) {
      // Hide completely when face is lost and fade is done
      modelRef.current.scale.set(0, 0, 0);
    }
  });

  return <primitive ref={modelRef} object={scene} />;
}

// ==========================================
// 3. TRY-ON MODAL COMPONENT
// ==========================================
function TryOnModal({ product, variantId, onClose }: { product: Product; variantId: string; onClose: () => void }) {
  const variant = product.variants?.find(v => v.id === variantId);
  const colorKey = (variant?.colorName || 'black').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slugKey = product.slug.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Asset Paths
  const glbPath = `/assets/tryon/${slugKey}-${colorKey}.glb`;
  const MODEL_URL = '/models/face-api'; // Ensure face-api models are in public/models/
  
  // Resolution Constants
  const VIDEO_W = 640;
  const VIDEO_H = 480;
  const videoSize = { width: VIDEO_W, height: VIDEO_H };

  // State
  const [cameraActive, setCameraActive] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading AI models...');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null); // NEW: Hardware stream lock
  const faceDataRef = useRef<{ x: number; y: number; width: number; angle: number } | null>(null);
  const modelsLoadedRef = useRef(false);

  // START HARDWARE CAMERA
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Let device choose native resolution
        audio: false,
      });
      
      streamRef.current = mediaStream; // Save stream to prevent unmount memory leak

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      alert("Could not access camera: " + err.message);
    }
  };

  // STOP HARDWARE CAMERA & CLOSE
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    onClose();
  };

  // LOAD AI MODELS
  useEffect(() => {
    if (!cameraActive) return;
    let stopped = false;

    const loadModels = async () => {
      if (modelsLoadedRef.current) return;
      try {
        setLoadingText('Loading AI models...');
        const faceapi = await import('face-api.js');
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        if (stopped) return;
        
        setLoadingText('Loading facial landmarks...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (stopped) return;
        
        modelsLoadedRef.current = true;
        setModelsReady(true);
      } catch (err) {
        console.error('Face API load error:', err);
        modelsLoadedRef.current = true;
        setModelsReady(true);
      }
    };

    loadModels();
    return () => { stopped = true; };
  }, [cameraActive]);

  // TRACKING & DRAWING LOOPS
  useEffect(() => {
    if (!cameraActive) return;

    let intervalId: ReturnType<typeof setInterval>;
    let animId: number;
    let isDrawing = true;

    // 2D Video Mirror Loop
    const drawLoop = () => {
      if (!isDrawing) return;
      const c = canvasRef.current;
      const v = videoRef.current;
      
      if (c && v && v.readyState >= 2) {
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(v, -VIDEO_W, 0, VIDEO_W, VIDEO_H);
          ctx.restore();
        }
      }
      animId = requestAnimationFrame(drawLoop);
    };

    animId = requestAnimationFrame(drawLoop);

    // AI Tracking Loop
    const trackFace = async () => {
      const v = videoRef.current;
      if (!v || !v.srcObject || v.readyState < 2 || !modelsLoadedRef.current) return;

      try {
        const faceapi = await import('face-api.js');
        const detection = await faceapi.detectSingleFace(
          v,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        ).withFaceLandmarks();

        if (detection) {
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const lx = leftEye.reduce((sum, pt) => sum + pt.x, 0) / leftEye.length;
          const ly = leftEye.reduce((sum, pt) => sum + pt.y, 0) / leftEye.length;
          const rx = rightEye.reduce((sum, pt) => sum + pt.x, 0) / rightEye.length;
          const ry = rightEye.reduce((sum, pt) => sum + pt.y, 0) / rightEye.length;

          const centerX = (lx + rx) / 2;
          const centerY = (ly + ry) / 2;

          const dx = rx - lx;
          const dy = ry - ly;
          const angle = Math.atan2(dy, dx);

          const jaw = landmarks.getJawOutline();
          const faceWidth = jaw[16].x - jaw[0].x;

          faceDataRef.current = { x: centerX, y: centerY, width: faceWidth, angle };
        } else {
          faceDataRef.current = null;
        }
      } catch (e) {
        faceDataRef.current = null;
      }
    };

    // Run tracking at ~16 FPS to save CPU
    trackFace();
    intervalId = setInterval(trackFace, 60);

    // Cleanup Phase
    return () => {
      isDrawing = false;
      clearInterval(intervalId);
      cancelAnimationFrame(animId);
      
      // Fallback cleanup in case handleClose isn't triggered
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-100">
          <h3 className="font-semibold text-brand-950">Virtual 3D Try On</h3>
          <button onClick={handleClose} className="p-1 hover:bg-brand-100 rounded-full transition-colors">✕</button>
        </div>

        {/* Camera/Canvas Container */}
        <div className="bg-gray-200 relative flex items-center justify-center overflow-hidden w-full" style={{ aspectRatio: `${VIDEO_W}/${VIDEO_H}` }}>
          
          {/* CRITICAL: Hidden Video Source */}
          <video ref={videoRef} autoPlay playsInline muted className="hidden" width={VIDEO_W} height={VIDEO_H} />

          {!cameraActive ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                <ScanFace className="w-16 h-16 text-gray-500" />
              </div>
              <p className="text-brand-600 text-sm">Camera is off</p>
            </div>
          ) : (
            <>
              {/* Layer 1: 2D Canvas (Mirrored Background) */}
              <canvas ref={canvasRef} width={VIDEO_W} height={VIDEO_H} className="absolute inset-0 w-full h-full object-cover" />

              {/* Layer 2: 3D Canvas (Glasses Overlay) */}
              <div className="absolute inset-0 w-full h-full pointer-events-none">
                <Canvas>
                  <OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} left={-VIDEO_W / 2} right={VIDEO_W / 2} top={VIDEO_H / 2} bottom={-VIDEO_H / 2} />
                  <ambientLight intensity={1.5} />
                  <directionalLight position={[10, 10, 5]} intensity={2} />

                  <Suspense fallback={null}>
                    {modelsReady && (
                      <GlassesModel glbUrl={glbPath} faceDataRef={faceDataRef} videoSize={videoSize} />
                    )}
                  </Suspense>
                </Canvas>
              </div>
            </>
          )}

          {/* Loading Overlay */}
          {cameraActive && !modelsReady && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-white text-sm font-medium">{loadingText}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-brand-50 flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-600">{product.name} — {variant?.colorName}</p>
            <p className="text-xs text-brand-400 mt-1">
              {cameraActive && modelsReady ? "Position your face in the camera" : cameraActive ? "Loading..." : "Click to start camera"}
            </p>
          </div>
          <button
            onClick={cameraActive ? handleClose : startCamera}
            className="px-6 py-2 bg-brand-950 text-white rounded-full text-sm font-medium hover:bg-brand-800 transition-colors"
          >
            {cameraActive ? "Done" : "Start Camera"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. SKELETON LOADER
// ==========================================
function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-brand-50">
      <div className="container-wide py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="w-20 h-20 rounded-xl" />))}
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}