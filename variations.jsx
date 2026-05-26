// variations.jsx — Design canvas of variants

const { useReducer: useReducerVar, useState: useStateVar, useEffect: useEffectVar, useRef: useRefVar } = React;

// LazyMount — defers child rendering until near the viewport.
// Falls back to a bounding-rect check on mount so the first batch
// reliably renders even when IntersectionObserver doesn't fire on first observe.
function LazyMount({ children, width, height }) {
  const ref = useRefVar(null);
  const [visible, setVisible] = useStateVar(false);
  useEffectVar(() => {
    if (visible || !ref.current) return;
    const el = ref.current;

    // Synchronous fallback: if we're already within rootMargin, mount immediately.
    const checkNow = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const margin = 800;
      if (r.bottom > -margin && r.top < vh + margin) {
        setVisible(true);
        return true;
      }
      return false;
    };
    if (checkNow()) return;

    // IntersectionObserver for off-screen boards.
    let io;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setVisible(true); io.disconnect(); }
      }, { rootMargin: '800px' });
      io.observe(el);
    }
    // Belt-and-braces: also poll on scroll
    const onScroll = () => { if (checkNow()) window.removeEventListener('scroll', onScroll, true); };
    window.addEventListener('scroll', onScroll, true);

    return () => {
      if (io) io.disconnect();
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [visible]);
  return (
    <div ref={ref} style={{ width: width ?? '100%', height: height ?? '100%' }}>
      {visible ? children : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-linear-gradient(45deg, #f1f5f9, #f1f5f9 12px, #e2e8f0 12px, #e2e8f0 13px)',
          color: '#475569', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif',
          border: '1px dashed #cbd5e1', borderRadius: 12,
        }}>
          <div style={{ background: 'white', padding: '8px 14px', borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            ⏳ Loading…
          </div>
        </div>
      )}
    </div>
  );
}

// VariantApp — a self-contained instance of the app (own state, own tweaks)
function VariantApp({
  tweaks = {},
  currentUser: initialUser = 'Syaeful',
  initialPage = 'dashboard',
  initialNewInput = false,
  mode = 'desktop',
}) {
  const [state, dispatch] = useReducerVar(stateReducer, null, loadInitial);
  const [currentUser, setCurrentUser] = useStateVar(initialUser);
  const t = { ...TWEAK_DEFAULTS, ...tweaks };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ToastProvider>
        {mode === 'desktop' ? (
          <DesktopApp
            state={state}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            dispatch={dispatch}
            tweaks={t}
            initialPage={initialPage}
            initialNewInput={initialNewInput}
          />
        ) : (
          <MobileApp
            state={state}
            currentUser={currentUser}
            dispatch={dispatch}
          />
        )}
      </ToastProvider>
    </div>
  );
}

function DesktopBoard({ tweaks, currentUser, initialPage, initialNewInput, width = 1240, height = 780 }) {
  return (
    <LazyMount width={width} height={height}>
      <ChromeWindow tabs={[{ title: 'Thailand Expenses · Texcoms' }]}
        url="thai.expenses.syaefulaz.my.id"
        width={width} height={height}>
        <div data-theme={tweaks?.theme === 'dark' ? 'dark' : 'light'}
             data-density={tweaks?.density || 'comfortable'}
             data-accent={tweaks?.accent || 'blue'}
             data-typeface={tweaks?.typeface || 'default'}
             style={{ height: '100%' }}>
          <VariantApp tweaks={tweaks} currentUser={currentUser}
                      initialPage={initialPage} initialNewInput={initialNewInput}
                      mode="desktop" />
        </div>
      </ChromeWindow>
    </LazyMount>
  );
}

function MobileBoard({ currentUser, width = 390, height = 780 }) {
  return (
    <LazyMount width={width} height={height}>
      <IOSDevice width={width} height={height}>
        <VariantApp currentUser={currentUser} mode="mobile" />
      </IOSDevice>
    </LazyMount>
  );
}

// ───────────────────────────────────────────────────────────────
// The canvas
// ───────────────────────────────────────────────────────────────
function VariationsApp() {
  return (
    <DesignCanvas>
      {/* HERO — overview */}
      <DCSection id="hero" title="Thailand Expenses Tracker — Variations"
                 subtitle="Same data (real Excel import: 160 expenses, 101 loans), different design directions. Toggleable individually from the prototype's Tweaks panel.">
        <DCArtboard id="hero-desktop" label="Default — Syaeful · Dashboard" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ dashboardLayout: 'matrix', loanView: 'split', entryStyle: 'modal',
              density: 'comfortable', theme: 'light', accent: 'blue', typeface: 'default' }} />
        </DCArtboard>
        <DCArtboard id="hero-mobile" label="Mobile — Syaeful · Dashboard" width={390} height={780}>
          <MobileBoard currentUser="Syaeful" />
        </DCArtboard>
        <DCArtboard id="hero-winda" label="Winda (Manager) — net lender" width={1240} height={800}>
          <DesktopBoard currentUser="Winda" initialPage="dashboard"
            tweaks={{ dashboardLayout: 'matrix' }} />
        </DCArtboard>
      </DCSection>

      {/* DASHBOARD LAYOUTS */}
      <DCSection id="dashboard" title="Dashboard — who owes whom"
                 subtitle="3 ways to express the team's net position. Same data, different visual emphasis.">
        <DCArtboard id="dash-matrix" label="A · Matrix grid (3×3)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ dashboardLayout: 'matrix' }} />
        </DCArtboard>
        <DCArtboard id="dash-graph" label="B · Net-flow graph" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ dashboardLayout: 'graph' }} />
        </DCArtboard>
        <DCArtboard id="dash-table" label="C · Compact table" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ dashboardLayout: 'table' }} />
        </DCArtboard>
      </DCSection>

      {/* LOAN DATA VIEW */}
      <DCSection id="loans" title="Loan Data — split vs unified"
                 subtitle="Lender-driven settlement flow. The unified view lets users see both sides of the ledger without switching tabs.">
        <DCArtboard id="loans-split" label="A · Split tabs (Lent / Borrowed)" width={1240} height={800}>
          <DesktopBoard currentUser="Winda" initialPage="loans"
            tweaks={{ loanView: 'split' }} />
        </DCArtboard>
        <DCArtboard id="loans-unified" label="B · Unified table + role filter" width={1240} height={800}>
          <DesktopBoard currentUser="Winda" initialPage="loans"
            tweaks={{ loanView: 'unified' }} />
        </DCArtboard>
      </DCSection>

      {/* EXPENSE ENTRY STYLES */}
      <DCSection id="entry" title="Expense entry — modal · drawer · inline"
                 subtitle="Three patterns for capturing a new expense. Modal is the default (PrimeNG canonical); drawer is faster for power users; inline-row is fastest for repeated bulk entry.">
        <DCArtboard id="entry-modal" label="A · Modal dialog" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="expenses" initialNewInput
            tweaks={{ entryStyle: 'modal' }} />
        </DCArtboard>
        <DCArtboard id="entry-drawer" label="B · Side drawer" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="expenses" initialNewInput
            tweaks={{ entryStyle: 'drawer' }} />
        </DCArtboard>
        <DCArtboard id="entry-inline" label="C · Inline-row entry" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="expenses" initialNewInput
            tweaks={{ entryStyle: 'inline' }} />
        </DCArtboard>
      </DCSection>

      {/* THEME EXPLORATIONS */}
      <DCSection id="theme" title="Theme — accent and dark mode"
                 subtitle="The visual baseline is PrimeNG Sakai (cool blue + slate). Below: warm and teal accents, plus dark mode.">
        <DCArtboard id="theme-blue" label="A · Blue accent (default)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ accent: 'blue', theme: 'light' }} />
        </DCArtboard>
        <DCArtboard id="theme-warm" label="B · Warm (orange) — Thailand-trip energy" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ accent: 'warm', theme: 'light' }} />
        </DCArtboard>
        <DCArtboard id="theme-teal" label="C · Teal — minimalist" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ accent: 'teal', theme: 'light' }} />
        </DCArtboard>
        <DCArtboard id="theme-dark" label="D · Dark mode (blue accent)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ accent: 'blue', theme: 'dark' }} />
        </DCArtboard>
      </DCSection>

      {/* DENSITY */}
      <DCSection id="density" title="Density — comfortable vs compact"
                 subtitle="Compact mode reduces row height by ~20% — useful for power users scanning long lists of receipts.">
        <DCArtboard id="dens-comfy" label="A · Comfortable (default)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="expenses"
            tweaks={{ density: 'comfortable' }} />
        </DCArtboard>
        <DCArtboard id="dens-compact" label="B · Compact" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="expenses"
            tweaks={{ density: 'compact' }} />
        </DCArtboard>
      </DCSection>

      {/* TYPOGRAPHY */}
      <DCSection id="type" title="Typography pairings"
                 subtitle="Body always Inter (PrimeNG default). The display face changes the personality.">
        <DCArtboard id="type-inter" label="A · Inter only" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ typeface: 'default' }} />
        </DCArtboard>
        <DCArtboard id="type-grotesk" label="B · Space Grotesk (geometric)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ typeface: 'grotesk' }} />
        </DCArtboard>
        <DCArtboard id="type-serif" label="C · Inter + Source Serif (editorial)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ typeface: 'serif-display' }} />
        </DCArtboard>
        <DCArtboard id="type-mono" label="D · Inter + JetBrains Mono (technical)" width={1240} height={800}>
          <DesktopBoard currentUser="Syaeful" initialPage="dashboard"
            tweaks={{ typeface: 'mono-accent' }} />
        </DCArtboard>
      </DCSection>

      {/* MOBILE */}
      <DCSection id="mobile" title="Mobile — per-user views"
                 subtitle="The trip happens in Bangkok. Mobile is where expenses get entered in the moment.">
        <DCArtboard id="m-syaeful" label="Syaeful (ADMIN) — Dashboard" width={390} height={780}>
          <MobileBoard currentUser="Syaeful" />
        </DCArtboard>
        <DCArtboard id="m-winda" label="Winda (MANAGER) — net lender" width={390} height={780}>
          <MobileBoard currentUser="Winda" />
        </DCArtboard>
        <DCArtboard id="m-dina" label="Dina (MANAGER)" width={390} height={780}>
          <MobileBoard currentUser="Dina" />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<VariationsApp />);
