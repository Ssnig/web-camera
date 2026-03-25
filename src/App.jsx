import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

function App() {
  const shellRef = useRef(null)
  const frameRef = useRef(null)
  const actionRef = useRef(null)
  const flashRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [captureUrl, setCaptureUrl] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return window.localStorage.getItem('camera-last-shot') ?? ''
  })
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.localStorage.getItem('camera-theme') ?? 'light'
  })
  const [cameraState, setCameraState] = useState('Requesting camera access...')
  const [isReady, setIsReady] = useState(false)

  const isDark = theme === 'dark'

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [shellRef.current, frameRef.current, actionRef.current],
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
        },
      )
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    window.localStorage.setItem('camera-theme', theme)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark, theme])

  useEffect(() => {
    let isMounted = true

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('Camera access is not supported in this browser.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
          },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setIsReady(true)
        setCameraState('Live camera ready')
      } catch (error) {
        console.error(error)
        setCameraState('Camera access was blocked. Check browser permissions.')
      }
    }

    startCamera()

    return () => {
      isMounted = false

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const saveCapture = (dataUrl) => {
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    link.href = dataUrl
    link.download = `capture-${timestamp}.png`
    link.click()
  }

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !isReady) {
      return
    }

    const width = video.videoWidth
    const height = video.videoHeight

    if (!width || !height) {
      setCameraState('Camera is warming up. Try again.')
      return
    }

    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/png')
    setCaptureUrl(dataUrl)
    window.localStorage.setItem('camera-last-shot', dataUrl)
    setCameraState('Image captured and saved locally')
    saveCapture(dataUrl)

    gsap.fromTo(
      flashRef.current,
      { opacity: 0.95 },
      { opacity: 0, duration: 0.45, ease: 'power2.out' },
    )
  }

  return (
    <main
      className={`min-h-screen px-6 py-8 transition-colors duration-300 sm:px-8 lg:px-12 ${
        isDark
          ? 'bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.16),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-50'
          : 'bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.06),_transparent_28%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] text-slate-950'
      }`}
    >
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`fixed right-6 top-6 z-20 inline-flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-medium transition sm:right-8 sm:top-8 ${
          isDark
            ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
        }`}
        aria-label={`Switch to ${isDark ? 'day' : 'night'} mode`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isDark ? 'bg-slate-100 text-slate-950' : 'bg-slate-950 text-white'
          }`}
        >
          {isDark ? '☀' : '☾'}
        </span>
        <span>{isDark ? 'Day' : 'Night'}</span>
      </button>

      <section
        ref={shellRef}
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center"
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p
              className={`mb-3 text-xs font-medium uppercase tracking-[0.35em] ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Camera App
            </p>
            <h1 className="font-['Aptos','Segoe_UI_Variable','Trebuchet_MS',sans-serif] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Minimal capture station
            </h1>
          </div>
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_112px]">
          <div
            ref={frameRef}
            className={`relative overflow-hidden rounded-[2rem] border p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)] transition-colors sm:p-6 ${
              isDark
                ? 'border-slate-800 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.45)]'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`mb-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <span>Live View</span>
              <span>{cameraState}</span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-slate-950">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              <div
                ref={flashRef}
                className="pointer-events-none absolute inset-0 bg-white opacity-0"
              />

              {captureUrl ? (
                <div
                  className={`absolute bottom-4 left-4 rounded-2xl border px-3 py-2 backdrop-blur ${
                    isDark
                      ? 'border-slate-700/60 bg-slate-900/80'
                      : 'border-white/60 bg-white/80'
                  }`}
                >
                  <p
                    className={`text-[0.65rem] font-medium uppercase tracking-[0.24em] ${
                      isDark ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    Last shot saved
                  </p>
                </div>
              ) : null}

              {!isReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
                    Starting camera...
                  </div>
                </div>
              ) : null}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Browser camera capture
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Works on supported browsers with camera permission enabled.
                </p>
              </div>

              {captureUrl ? (
                <a
                  href={captureUrl}
                  download="camera-capture.png"
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isDark
                      ? 'border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-900'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Download last image
                </a>
              ) : null}
            </div>
          </div>

          <div
            ref={actionRef}
            className="flex items-center justify-center lg:min-h-full"
          >
            <button
              type="button"
              onClick={handleCapture}
              disabled={!isReady}
              className={`group inline-flex h-24 w-24 items-center justify-center rounded-full border shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
              aria-label="Capture image"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full border-8 transition group-hover:scale-95 ${
                  isDark ? 'border-slate-100' : 'border-slate-950'
                }`}
              >
                <span className={`h-5 w-5 rounded-full ${isDark ? 'bg-slate-100' : 'bg-slate-950'}`} />
              </span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
