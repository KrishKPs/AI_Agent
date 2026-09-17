function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect width="30" height="30" fill="var(--accent)" />
      <path d="M8 20L13 13L17 16L22 9" stroke="#1a1206" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="9" r="2" fill="#1a1206" />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <LogoMark />
          <div className="brand-text">
            <span className="brand-name">Lift</span>
            <span className="brand-tagline">Promo Profit Finder</span>
          </div>
        </div>
        <div className="app-header-meta">
          <span className="live-dot" aria-hidden="true" />
          Connected to simulator
        </div>
      </div>
    </header>
  );
}
