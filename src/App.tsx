import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TransitionEvent,
} from 'react'
import { PUMP_FUN_URL, SOCIAL, TOKEN_CA } from './config'
import { TikTokFeed } from './TikTokFeed'
import './App.css'

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function SolanaGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M4.3 11.6c.1-.1.2-.2.4-.2h15.1c.2 0 .3.3.1.4l-2.8 2.8c-.1.1-.2.2-.4.2H1.6c-.2 0-.3-.3-.1-.4l2.8-2.8zm0-5.5c.1-.1.2-.2.4-.2h15.1c.2 0 .3.3.1.4l-2.8 2.8c-.1.1-.2.2-.4.2H1.6c-.2 0-.3-.3-.1-.4l2.8-2.8zm15.4 10.9c.2-.1.2-.4-.1-.4H4.5c-.2 0-.3.1-.4.2l-2.8 2.8c-.2.2-.1.4.1.4h15.1c.2 0 .3-.1.4-.2l2.8-2.8z"
      />
    </svg>
  )
}

function ScrollProgress() {
  const [pct, setPct] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const measure = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const next = max <= 0 ? 0 : (el.scrollTop / max) * 100
      setPct(Math.min(100, Math.max(0, next)))
    }

    const onScrollOrResize = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        measure()
      })
    }

    measure()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const rounded = Math.round(pct)

  return (
    <div
      className="scroll-progress"
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div className="scroll-progress__track">
        <div className="scroll-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const [copiedCA, setCopiedCA] = useState(false)
  const copyResetTimerRef = useRef<number | null>(null)

  const [loaderMounted, setLoaderMounted] = useState(true)
  const [loaderExiting, setLoaderExiting] = useState(false)
  const [heroAudioEnabled, setHeroAudioEnabled] = useState(false)
  const [heroAspectRatio, setHeroAspectRatio] = useState<number | null>(null)
  const entryBtnRef = useRef<HTMLButtonElement>(null)
  const heroVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!loaderMounted) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    const prevHtmlOverscroll = html.style.overscrollBehavior
    const prevBodyOverscroll = body.style.overscrollBehavior
    const prevHtmlTouchAction = html.style.touchAction
    const prevBodyTouchAction = body.style.touchAction
    const prevHtmlHeight = html.style.height
    const prevBodyHeight = body.style.height
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    html.style.touchAction = 'none'
    body.style.touchAction = 'none'
    html.style.height = '100%'
    body.style.height = '100%'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      html.style.overscrollBehavior = prevHtmlOverscroll
      body.style.overscrollBehavior = prevBodyOverscroll
      html.style.touchAction = prevHtmlTouchAction
      body.style.touchAction = prevBodyTouchAction
      html.style.height = prevHtmlHeight
      body.style.height = prevBodyHeight
    }
  }, [loaderMounted])

  useEffect(() => {
    if (loaderMounted && !loaderExiting) {
      entryBtnRef.current?.focus()
    }
  }, [loaderMounted, loaderExiting])

  useEffect(() => {
    if (!loaderMounted) {
      document.getElementById('main')?.focus()
    }
  }, [loaderMounted])

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const heroVideo = heroVideoRef.current
    if (!heroVideo || !heroAudioEnabled) return

    const syncMuteWithViewport = (inView: boolean) => {
      heroVideo.muted = !inView
      if (inView) {
        void heroVideo.play().catch(() => {
          heroVideo.muted = true
        })
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        const inView = Boolean(entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.35)
        syncMuteWithViewport(inView)
      },
      { threshold: [0, 0.2, 0.35, 0.6, 1] },
    )

    io.observe(heroVideo)
    return () => io.disconnect()
  }, [heroAudioEnabled])

  const dismissLoader = useCallback(() => {
    setHeroAudioEnabled(true)
    const heroVideo = heroVideoRef.current
    if (heroVideo) {
      heroVideo.currentTime = 0
      heroVideo.muted = false
      void heroVideo.play().catch(() => {
        // Keep playback resilient if the browser still blocks unmuted autoplay.
        heroVideo.muted = true
      })
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLoaderMounted(false)
      return
    }
    setLoaderExiting(true)
  }, [])

  const onLoaderTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (e.propertyName !== 'opacity') return
      if (loaderExiting) setLoaderMounted(false)
    },
    [loaderExiting],
  )

  const socialItems = [
    { key: 'x', label: 'X', href: SOCIAL.x },
    { key: 'telegram', label: 'Telegram', href: SOCIAL.telegram },
    { key: 'discord', label: 'Discord', href: SOCIAL.discord },
  ].filter((item) => item.href)

  const onCopyCA = useCallback(async () => {
    const ca = TOKEN_CA.trim()
    if (!ca) return
    try {
      await navigator.clipboard.writeText(ca)
      setCopiedCA(true)
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current)
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedCA(false)
        copyResetTimerRef.current = null
      }, 1500)
    } catch {
      // no-op if clipboard API is unavailable or denied
    }
  }, [])

  return (
    <div className="app">
      {loaderMounted ? (
        <div
          className={`entry-loader${loaderExiting ? ' entry-loader--exit' : ''}`}
          onTransitionEnd={onLoaderTransitionEnd}
          aria-hidden={loaderExiting}
        >
          <div className="entry-loader__spin" aria-hidden />
          <div className="entry-loader__fx" aria-hidden />
          <div className="entry-loader__grid" aria-hidden />
          <div className="entry-loader__noise" aria-hidden />
          <div
            className="entry-loader__inner"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-loader-title"
          >
            <p className="entry-loader__kicker">$WIN</p>
            <h1 id="entry-loader-title" className="entry-loader__title">
              Are you ready to win?
            </h1>
            <button
              ref={entryBtnRef}
              type="button"
              className="btn-primary entry-loader__primary"
              onClick={dismissLoader}
            >
              WIN.
            </button>
          </div>
        </div>
      ) : null}

      <div className="app__bg" aria-hidden />

      <a href="#main" className="sr-only">
        Skip to content
      </a>

      <header className="site-header">
        <a href="#top" className="site-header__brand" onClick={closeNav}>
          <img
            src="/hero1.jpeg"
            alt=""
            className="site-header__logo"
            width={40}
            height={40}
            decoding="async"
          />
          <span className="site-header__ticker">WIN</span>
        </a>

        <button
          type="button"
          className="site-header__menu-toggle"
          aria-expanded={navOpen}
          aria-controls="site-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          {navOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <nav
          id="site-nav"
          className={`site-header__nav${navOpen ? ' is-open' : ''}`}
          aria-label="Primary"
        >
          <a href="#story" onClick={closeNav}>
            Story
          </a>
          <a href="#token" onClick={closeNav}>
            Token
          </a>
          {TOKEN_CA ? (
            <button
              type="button"
              className="site-header__copy"
              onClick={onCopyCA}
              aria-live="polite"
            >
              {copiedCA ? 'Copied' : 'Copy CA'}
            </button>
          ) : null}
          {SOCIAL.x ? (
            <a
              href={SOCIAL.x}
              target="_blank"
              rel="noopener noreferrer"
              className="site-header__x"
              aria-label="X"
            >
              <XLogo />
            </a>
          ) : null}
        </nav>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        <section
          id="top"
          className="section section--tight-top hero-section"
          style={
            heroAspectRatio
              ? ({ '--hero-aspect': `${heroAspectRatio}` } as CSSProperties)
              : undefined
          }
        >
          <div className="wrap hero">
            <div className="hero__content">
              <p className="hero__eyebrow">Solana · Pump.fun</p>
              <h1 className="hero__title">
                It&apos;s not over{' '}
                <em>
                  until I <strong>win.</strong>
                </em>
              </h1>
              <p className="hero__lead">
                <strong>$WIN</strong> is for everyone who refuses to quit when nobody believes,
                when the lights go out, and when the dream is all you have left.{' '}
                <strong>Keep reviewing it. Every single day.</strong>
              </p>
              <div className="hero__actions">
                <a
                  className="btn-primary"
                  href={PUMP_FUN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Trade on Pump.fun
                </a>
                <a className="btn-ghost" href="#story">
                  Read the story
                </a>
              </div>
              <div className="hero__badges">
                <span className="badge">
                  <SolanaGlyph />
                  Solana
                </span>
                <span className="badge">Ticker · WIN</span>
              </div>
            </div>
          </div>

          <div className="hero__visual" aria-hidden>
            <video
              ref={heroVideoRef}
              src="/herovideo.mp4"
              muted={!heroAudioEnabled}
              loop
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const { videoWidth, videoHeight } = e.currentTarget
                if (videoWidth > 0 && videoHeight > 0) {
                  setHeroAspectRatio(videoWidth / videoHeight)
                }
              }}
            />
          </div>
        </section>

        <section id="story" className="section manifesto" aria-labelledby="manifesto-heading">
          <div className="wrap manifesto__wrap">
            <p className="manifesto__credit">Written by Les Brown</p>
            <div className="manifesto__inner">
              <h2 id="manifesto-heading" className="manifesto__label">
                The line that matters
              </h2>
              <ul className="manifesto__lines">
                <li>Nobody believes in you,</li>
                <li>You&apos;ve lost again,</li>
                <li>and again,</li>
                <li>and again.</li>
                <li>The lights are cut off,</li>
                <li>But you still looking at your dream.</li>
                <li>Reviewing it every day,</li>
                <li>And say to yourself.</li>
                <li>It&apos;s not over until I WIN.</li>
              </ul>
            </div>
          </div>
        </section>

        <section
          id="winners-timeline"
          className="section winners-timeline"
          aria-labelledby="winners-timeline-heading"
        >
          <div className="wrap winners-timeline__wrap">
            <h2 id="winners-timeline-heading" className="winners-timeline__title">
              The Winner&apos;s Timeline
            </h2>
            <p className="winners-timeline__lead">
              We curated the most popular motivational videos about winning. Watch them
              every day, stay locked in, and boost your chances of winning when it matters.
            </p>
            <div className="winners-timeline__actions">
              <a href="#reels" className="btn-primary">
                Start watching
              </a>
            </div>
          </div>
        </section>

        <TikTokFeed />

        <section id="token" className="section">
          <div className="wrap">
            <div className="grid-2">
              <article className="card card--boxing-why">
                <h2>Why WIN</h2>
                <p>
                  <strong>Hold the vision</strong> when the evidence says otherwise.{' '}
                  <strong>Hold the line.</strong> Outlast the doubt. That&apos;s the energy
                  behind $WIN—a rallying cry, not a consolation prize.
                </p>
                <p>
                  The same fire runs through Les Brown&apos;s work on persistence: show up
                  when it hurts, and <strong>refuse to surrender the dream.</strong>
                </p>
              </article>
              <article className="card card--boxing-launch">
                <h2>Launch</h2>
                <p>
                  <strong>Live on Solana.</strong> Born on Pump.fun—fast, transparent, and
                  built for the trenches. No excuses. Just execution.
                </p>
                <p className="disclaimer">
                  For entertainment and community purposes only. Not financial advice.
                  Cryptocurrencies are volatile; you can lose your entire stake.
                </p>
                <p className="disclaimer">
                  Inspired by public motivational themes associated with Les Brown. Not
                  affiliated with or endorsed by Les Brown, his companies, or
                  publishers.
                </p>
              </article>
            </div>

            <div className="token-row" style={{ marginTop: 'var(--space-lg)' }}>
              <div className="token-row__info">
                <strong>$WIN</strong>
                <span>It&apos;s not over until I win · Solana</span>
              </div>
              <div className="token-row__actions">
                <a
                  className="btn-primary"
                  href={PUMP_FUN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Pump.fun
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">WIN · Solana</div>
          {socialItems.length > 0 ? (
            <div className="site-footer__social">
              {socialItems.map(({ key, label, href }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              ))}
            </div>
          ) : null}
          <p className="site-footer__legal">
            © {new Date().getFullYear()} $WIN community. DYOR.
          </p>
        </div>
      </footer>

      {!loaderMounted ? <ScrollProgress /> : null}
    </div>
  )
}
