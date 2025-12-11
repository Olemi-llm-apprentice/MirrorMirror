"use client";

import { useState, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

interface ImageInputViewProps {
  onImageUploaded: (imageId: string, base64: string, mimeType: string) => void;
  onBack: () => void;
}

export function ImageInputView({ onImageUploaded, onBack }: ImageInputViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // リサイズして品質を安定させる
  const resizeImage = useCallback((file: File, maxWidth: number, maxHeight: number): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 元のサイズを取得
        let { width, height } = img;
        logger.info(`Original image size: ${width}x${height}`);
        
        // アスペクト比を維持しながらリサイズ
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
          logger.info(`Resized to: ${width}x${height}`);
        }
        
        // Canvasでリサイズ
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEGで出力（品質85%）- ファイルサイズを抑える
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64 = dataUrl.split(",")[1];
        
        logger.info(`Resized image base64 length: ${base64.length}`);
        resolve({ base64, mimeType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    logger.info(`Processing image: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    try {
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // リサイズしてbase64に変換（最大1024x1024）
      const { base64, mimeType } = await resizeImage(file, 1024, 1024);
      const imageId = `img-${Date.now()}`;
      
      logger.info(`Image processed: base64 length=${base64.length}, mime=${mimeType}`);
      logger.info(`Calling onImageUploaded with imageId=${imageId}`);
      
      onImageUploaded(imageId, base64, mimeType);
      setIsProcessing(false);
    } catch (error) {
      logger.error("Error processing image:", error);
      setIsProcessing(false);
    }
  }, [onImageUploaded, resizeImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 1280 },
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      logger.error("Camera error:", error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          stopCamera();
          processImage(file);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen flex flex-col pb-32">
      {/* Header */}
      <div className="pt-8 pb-4 px-6">
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      {/* Title */}
      <div className="text-center px-6 mb-8">
        <h2 className="font-display text-3xl text-gray-800 mb-2">CAPTURE YOUR STYLE</h2>
        <p className="text-gray-600 text-sm">Upload your photo</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6">
        {showCamera ? (
          // Camera View
          <div className="relative rounded-3xl overflow-hidden bg-white/80 shadow-lg aspect-[3/4] max-w-sm mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={stopCamera}
                className="w-14 h-14 rounded-full bg-white/80 shadow flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <div className="w-14 h-14 rounded-full border-4 border-red-500" />
              </button>
              <button
                onClick={() => {
                  // Switch camera
                }}
                className="w-14 h-14 rounded-full bg-white/80 shadow flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        ) : previewUrl ? (
          // Preview
          <div className="relative rounded-3xl overflow-hidden bg-white/80 shadow-lg aspect-[3/4] max-w-sm mx-auto animate-fade-in">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-800 text-sm">Processing...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Options
          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={startCamera}
              className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow hover:shadow-lg transition-shadow flex items-center gap-4 py-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Take Photo</p>
                <p className="text-sm text-gray-600">Capture now</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow hover:shadow-lg transition-shadow flex items-center gap-4 py-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Choose Photo</p>
                <p className="text-sm text-gray-600">Select from gallery</p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-6 mt-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow">
          <p className="text-gray-700 text-xs text-center">
            💡 For better recommendations, take a photo in good lighting
            <br />
            showing your face and full body
          </p>
        </div>
      </div>
    </div>
  );
}
