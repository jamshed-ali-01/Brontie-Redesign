'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: string) => void;
  onClose: () => void;
  onManualRedeem?: () => void;
}

export default function QRScanner({ onScanSuccess, onScanError, onClose, onManualRedeem }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef(false);

  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  const cleanup = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    isInitializingRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = mediaStream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = null;
        video.srcObject = mediaStream;

        const handleLoadedMetadata = () => {
          setIsScanning(true);
          if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              scanIntervalRef.current = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                  const qrResult = detectQRCode(imageData);
                  if (qrResult) {
                    cleanup();
                    onScanSuccessRef.current(qrResult);
                  }
                }
              }, 100);
            }
          }
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        try {
          await video.play();
        } catch (playError) {
          console.warn('Video play error:', playError);
          setTimeout(async () => {
            try {
              await video.play();
            } catch (retryError) {
              console.error('Video play retry failed:', retryError);
            }
          }, 100);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      onScanErrorRef.current(errorMessage);
    } finally {
      isInitializingRef.current = false;
    }
  }, [cleanup]);

  useEffect(() => {
    startCamera();
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [startCamera]);

  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      return code ? code.data : null;
    } catch (error) {
      console.error('QR detection error:', error);
      return null;
    }
  };

  const handleManualInput = () => {
    const input = prompt('Enter QR code data manually (for testing):');
    if (input) {
      cleanup();
      onScanSuccessRef.current(input);
    }
  };

  const handleConfirmManualRedeem = () => {
    setShowManualConfirm(false);
    cleanup();
    if (onManualRedeem) onManualRedeem();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex flex-col">

      <div className="bg-amber-700 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Scan QR Code</h1>
        <button onClick={onClose} className="text-white hover:text-amber-200 text-2xl">×</button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full bg-gray-900 text-white p-6">
            <div className="text-center">
              <div className="text-red-400 text-4xl mb-4">📷</div>
              <h2 className="text-xl font-semibold mb-2">Camera Error</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="block w-full bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleManualInput}
                  className="block w-full bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Enter Manually (Testing)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-lg"></div>
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-amber-400 opacity-75 animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Redeem Confirmation Dialog */}
      {showManualConfirm && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full">
            <p className="text-lg font-semibold text-gray-800 mb-2">Are you at the café right now?</p>
            <p className="text-sm text-gray-500 mb-6">Confirming will redeem your voucher. This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowManualConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmManualRedeem}
                className="flex-1 bg-amber-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Yes, redeem now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-700 text-white p-4 text-center">
        <p className="text-sm">
          Point your camera at the QR code displayed at the merchant location
        </p>
        {onManualRedeem && (
          <button
            onClick={() => setShowManualConfirm(true)}
            className="mt-2 bg-amber-800 text-white px-4 py-2 rounded text-sm hover:bg-amber-900 transition-colors"
          >
            Camera won't open? Click here to redeem manually
          </button>
        )}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleManualInput}
            className="mt-2 ml-2 bg-gray-700 text-white px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
          >
            Manual Input (Dev)
          </button>
        )}
      </div>

    </div>
  );
}
