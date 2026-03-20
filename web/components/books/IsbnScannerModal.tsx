'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
      }
      getSupportedFormats?: () => Promise<string[]>
    }
  }
}

interface IsbnScannerModalProps {
  open: boolean
  onClose: () => void
  onDetected: (isbn: string) => void
}

export default function IsbnScannerModal({ open, onClose, onDetected }: IsbnScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const detectorRef = useRef<{ detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>> } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supported = useMemo(() => typeof window !== 'undefined' && !!window.BarcodeDetector, [])

  useEffect(() => {
    if (!open) return
    if (!supported) {
      setError('Live ISBN scanning is not supported in this browser. You can still type or paste the ISBN manually.')
      return
    }

    let cancelled = false

    const stopCamera = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    const scanFrame = async () => {
      if (cancelled || !videoRef.current || !detectorRef.current) return
      try {
        if (videoRef.current.readyState >= 2) {
          const results = await detectorRef.current.detect(videoRef.current)
          const rawValue = results.find(result => result.rawValue)?.rawValue || ''
          const isbn = rawValue.replace(/[^0-9Xx]/g, '').toUpperCase()
          if (isbn.length === 10 || isbn.length === 13) {
            stopCamera()
            onDetected(isbn)
            onClose()
            return
          }
        }
      } catch (err: any) {
        setError(err.message || 'Unable to scan ISBN from camera feed')
      }
      frameRef.current = requestAnimationFrame(scanFrame)
    }

    const start = async () => {
      setLoading(true)
      setError('')
      try {
        const Detector = window.BarcodeDetector
        if (!Detector) throw new Error('Barcode detector not available')
        detectorRef.current = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        frameRef.current = requestAnimationFrame(scanFrame)
      } catch (err: any) {
        setError(err.message || 'Unable to access the camera for ISBN scanning')
      } finally {
        setLoading(false)
      }
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, onClose, onDetected, supported])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-gray-950 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan ISBN</h3>
            <p className="text-sm text-gray-500">Point your camera at the barcode on the back cover.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="aspect-video rounded-2xl bg-gray-100 dark:bg-gray-900 overflow-hidden flex items-center justify-center relative">
            {supported ? (
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <div className="text-center px-6 text-gray-500">
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p>Camera scanning is unavailable here.</p>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[70%] h-[40%] border-2 border-white/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />
            </div>
          </div>

          {loading && (
            <div className="inline-flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Starting camera...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-500">
            Tip: Most barcodes encode the ISBN-13. If scanning fails, type the ISBN manually below and use the autofill button instead.
          </p>
        </div>
      </div>
    </div>
  )
}
