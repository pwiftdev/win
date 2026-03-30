import { useCallback, useEffect, useRef, useState } from 'react'
import { TIKTOK_FEED_SOURCES } from './tiktokFeedVideos'

export function TikTokFeed() {
  const sectionRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [hudVisible, setHudVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const rafRef = useRef(0)
  const total = TIKTOK_FEED_SOURCES.length

  const didAutoCenterRef = useRef(false)
  const snapLockRef = useRef(false)
  const snapUnlockTimerRef = useRef<number | null>(null)

  const exitToNextSection = useCallback(() => {
    const token = document.getElementById('token')
    if (!token) return

    // "Instant" jump: use CSS `scroll-margin-top` on `#token` to keep header spacing.
    token.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [])

  const updateActiveFromScroll = useCallback(() => {
    const rail = railRef.current
    if (!rail) return
    const rr = rail.getBoundingClientRect()
    const midY = rr.top + rr.height / 2
    let best = 0
    let bestDist = Infinity
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return
      const sr = slide.getBoundingClientRect()
      const center = sr.top + sr.height / 2
      const d = Math.abs(center - midY)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setActive((p) => (p !== best ? best : p))
  }, [])

  const onScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      updateActiveFromScroll()
    })
  }, [updateActiveFromScroll])

  const scrollBySlide = useCallback((dir: 1 | -1) => {
    const rail = railRef.current
    if (!rail) return
    const step = rail.clientHeight
    rail.scrollBy({ top: dir * step, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const initFrame = requestAnimationFrame(() => updateActiveFromScroll())
    rail.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateActiveFromScroll)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollBySlide(1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollBySlide(-1)
      }
    }
    rail.addEventListener('keydown', onKeyDown)

    return () => {
      cancelAnimationFrame(initFrame)
      rail.removeEventListener('scroll', onScroll)
      rail.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', updateActiveFromScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [onScroll, scrollBySlide, updateActiveFromScroll])

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === active) {
        v.muted = isMuted || !hudVisible
        void v.play().catch(() => {
          v.muted = true
          setIsMuted(true)
          void v.play()
        })
      } else {
        v.pause()
        v.muted = true
      }
    })
  }, [active, isMuted, hudVisible])

  useEffect(() => {
    const root = sectionRef.current
    if (!root) return
    const io = new IntersectionObserver(
      ([e]) => {
        setHudVisible(Boolean(e?.isIntersecting && e.intersectionRatio > 0.12))
      },
      { threshold: [0, 0.08, 0.12, 0.2, 0.35] },
    )
    io.observe(root)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const io = new IntersectionObserver(
      ([e]) => {
        const ratio = e?.intersectionRatio ?? 0

        // Center the whole reels block once per "enter viewport" so users see it immediately.
        // Guard prevents scrollIntoView loops during normal scrolling.
        if (ratio > 0.6 && !didAutoCenterRef.current) {
          didAutoCenterRef.current = true
          el.scrollIntoView({ behavior: 'auto', block: 'center' })
          return
        }
        if (ratio < 0.15) {
          didAutoCenterRef.current = false
        }
      },
      { threshold: [0, 0.15, 0.3, 0.6, 0.9] },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const clearSnapLockTimer = () => {
      if (snapUnlockTimerRef.current !== null) {
        window.clearTimeout(snapUnlockTimerRef.current)
        snapUnlockTimerRef.current = null
      }
    }

    const onWheel = (e: WheelEvent) => {
      const rail = railRef.current
      const target = e.target as Node | null
      const isInsideRail = Boolean(rail && target && rail.contains(target))
      if (isInsideRail) {
        return
      }

      if (snapLockRef.current) {
        e.preventDefault()
        return
      }

      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const partiallyVisible = rect.top < vh * 0.78 && rect.bottom > vh * 0.22
      const closeToCenter = Math.abs(rect.top) < 3

      // Only catch when scrolling DOWN into reels from above, never while already in-feed.
      if (e.deltaY > 0 && rect.top > 0 && partiallyVisible && !closeToCenter) {
        e.preventDefault()
        snapLockRef.current = true
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        clearSnapLockTimer()
        snapUnlockTimerRef.current = window.setTimeout(() => {
          snapLockRef.current = false
          snapUnlockTimerRef.current = null
        }, 420)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      clearSnapLockTimer()
      snapLockRef.current = false
    }
  }, [])

  return (
    <section
      id="reels"
      ref={sectionRef}
      className="reels-landing"
      aria-labelledby="reels-heading"
    >
      <header className="reels-landing__intro">
        <div className="wrap">
          <h2 id="reels-heading" className="reels-landing__title">
            The Winner&apos;s Timeline
          </h2>
        </div>
      </header>

      <div className="tiktok-feed" aria-label="Short video feed">
        <div className="tiktok-feed__rail" ref={railRef} tabIndex={0}>
          {TIKTOK_FEED_SOURCES.map((src, i) => (
            <div
              key={src}
              className="tiktok-feed__slide"
              ref={(el) => {
                slideRefs.current[i] = el
              }}
            >
              <div className="tiktok-feed__frame">
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el
                  }}
                  className="tiktok-feed__video"
                  src={src}
                  playsInline
                  loop
                  muted
                  preload={i <= 1 ? 'auto' : 'metadata'}
                  aria-label={`Clip ${i + 1} of ${total}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {hudVisible ? (
        <div
          className="tiktok-feed__hud"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="tiktok-feed__hud-dots" aria-hidden>
            {TIKTOK_FEED_SOURCES.map((_, i) => (
              <span
                key={i}
                className={`tiktok-feed__hud-dot${i === active ? ' is-active' : ''}`}
              />
            ))}
          </div>
          <div className="tiktok-feed__hud-row">
            <p className="tiktok-feed__hud-label">
              <span className="tiktok-feed__hud-current">{active + 1}</span>
              <span className="tiktok-feed__hud-sep"> / </span>
              <span>{total}</span>
            </p>
            <button
              type="button"
              className="tiktok-feed__sound"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted ? 'Unmute video sound' : 'Mute video sound'}
              aria-pressed={!isMuted}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              className="tiktok-feed__exit"
              onClick={exitToNextSection}
            >
              Exit
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
