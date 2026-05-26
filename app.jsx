// app.jsx — Main App shell, state reducer, role switcher, tweaks, stage

const { useState, useReducer, useEffect, useCallback, useMemo, useRef } = React;

// ────────── Reducer ──────────
function stateReducer(state, action) {
  switch (action.type) {
    case 'ADD_EXPENSE': {
      const id = Math.max(...state.expenses.map(e => e.id)) + 1;
      const exp = {
        id, ...action.data,
        created_at: new Date().toISOString(),
        attachment_path: null,
      };
      let loans = state.loans;
      // Auto-create loan if source owner != recorder and status != DRAFT
      const owner = sourceOwnerOf(exp.source);
      if (owner && owner !== exp.recorder && exp.status !== 'DRAFT' && exp.status !== 'REJECTED') {
        const lid = Math.max(...state.loans.map(l => l.id), 5000) + 1;
        loans = [...loans, {
          id: lid, expense_id: id, lender: owner, borrower: exp.recorder,
          amount: exp.amount, declared_repayment: null, actual_repaid: 0,
          remaining_balance: exp.amount, status: 'UNSETTLED',
          created_at: exp.created_at,
        }];
      }
      return { ...state, expenses: [...state.expenses, exp], loans };
    }
    case 'UPDATE_EXPENSE': {
      const expenses = state.expenses.map(e => e.id === action.id ? { ...e, ...action.data } : e);
      return { ...state, expenses };
    }
    case 'SUBMIT_EXPENSE': {
      const expenses = state.expenses.map(e => e.id === action.id ? { ...e, status: 'PENDING' } : e);
      const exp = expenses.find(e => e.id === action.id);
      // If a loan doesn't exist yet for this expense and source owner != recorder, create one
      let loans = state.loans;
      const owner = sourceOwnerOf(exp.source);
      if (owner && owner !== exp.recorder && !loans.find(l => l.expense_id === exp.id)) {
        const lid = Math.max(...state.loans.map(l => l.id), 5000) + 1;
        loans = [...loans, {
          id: lid, expense_id: exp.id, lender: owner, borrower: exp.recorder,
          amount: exp.amount, declared_repayment: null, actual_repaid: 0,
          remaining_balance: exp.amount, status: 'UNSETTLED',
          created_at: exp.created_at,
        }];
      }
      return { ...state, expenses, loans };
    }
    case 'APPROVE_EXPENSE': {
      return { ...state, expenses: state.expenses.map(e => e.id === action.id ? { ...e, status: 'APPROVED' } : e) };
    }
    case 'REJECT_EXPENSE': {
      const expenses = state.expenses.map(e => e.id === action.id ? { ...e, status: 'REJECTED' } : e);
      // Cancel any associated loan
      const loans = state.loans.filter(l => l.expense_id !== action.id);
      return { ...state, expenses, loans };
    }
    case 'DELETE_EXPENSE': {
      return { ...state, expenses: state.expenses.filter(e => e.id !== action.id) };
    }
    case 'DECLARE_REPAYMENT': {
      const loans = state.loans.map(l => l.id === action.id ? {
        ...l,
        declared_repayment: action.amount,
        remaining_balance: action.amount - l.actual_repaid,
        status: l.actual_repaid >= action.amount ? 'FULLY_SETTLED' : l.actual_repaid > 0 ? 'PARTIAL' : 'UNSETTLED',
      } : l);
      return { ...state, loans };
    }
    case 'RECORD_REPAYMENT': {
      const loan = state.loans.find(l => l.id === action.id);
      const declared = loan.declared_repayment || loan.amount;
      const newRepaid = loan.actual_repaid + action.amount;
      const newRem = Math.max(0, declared - newRepaid);
      const status = newRepaid > declared ? 'OVERPAID' :
                     newRepaid >= declared ? 'FULLY_SETTLED' :
                     newRepaid > 0 ? 'PARTIAL' : 'UNSETTLED';
      const loans = state.loans.map(l => l.id === action.id ? {
        ...l, actual_repaid: newRepaid, remaining_balance: newRem, status,
        declared_repayment: loan.declared_repayment || loan.amount,
      } : l);
      const rid = Math.max(...state.repayments.map(r => r.id), 9000) + 1;
      const repayments = [...state.repayments, {
        id: rid, loan_id: action.id, recorded_by: loan.lender,
        amount: action.amount, note: action.note || '',
        repaid_at: new Date().toISOString(),
      }];
      return { ...state, loans, repayments };
    }
    case 'TOGGLE_USER_ROLE': {
      const users = state.users.map(u => u.id === action.id ? { ...u, role: u.role === 'ADMIN' ? 'MANAGER' : 'ADMIN' } : u);
      return { ...state, users };
    }
    case 'TOGGLE_USER_ACTIVE': {
      const users = state.users.map(u => u.id === action.id ? { ...u, is_active: !u.is_active } : u);
      return { ...state, users };
    }
    default:
      return state;
  }
}

// ────────── Top bar: nav + user switcher ──────────
function TopBar({ currentUser, setCurrentUser, page, setPage, state }) {
  const role = USERS.find(u => u.name === currentUser).role;
  const showAdmin = role === 'ADMIN';
  const myPending = state.expenses.filter(e => e.status === 'PENDING' && e.recorder === currentUser).length;
  const myOpenLoans = state.loans.filter(l => l.borrower === currentUser && l.remaining_balance > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard },
    { id: 'expenses', label: 'List of Data', icon: Icon.list, badge: myPending > 0 ? myPending : null },
    { id: 'loans', label: 'Loan Data', icon: Icon.loan, badge: myOpenLoans > 0 ? myOpenLoans : null },
    { id: 'history', label: 'History', icon: Icon.history },
    ...(showAdmin ? [{ id: 'admin', label: 'Admin', icon: Icon.admin }] : []),
  ];

  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">฿</div>
        <span>Expenses</span>
        <span className="subtitle">Thailand</span>
      </div>
      <nav>
        {navItems.map(item => (
          <a key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
            {item.icon(14)} {item.label}
            {item.badge && <span className="badge-num">{item.badge}</span>}
          </a>
        ))}
      </nav>
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button className="user-switcher" onClick={() => setMenuOpen(v => !v)}>
          <Avatar name={currentUser} />
          <div className="who">
            <div className="name">{currentUser}</div>
            <div className="role">{role}</div>
          </div>
          {Icon.chevronD(14)}
        </button>
        {menuOpen && (
          <div className="user-menu">
            <div className="text-xs mute" style={{ padding: '6px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Switch user (for demo)
            </div>
            {USERS.map(u => (
              <div key={u.id} className={`user-menu-item ${u.name === currentUser ? 'current' : ''}`}
                   onClick={() => { setCurrentUser(u.name); setMenuOpen(false); if (page === 'admin' && u.role !== 'ADMIN') setPage('dashboard'); }}>
                <Avatar name={u.name} />
                <div>
                  <div className="semi">{u.name}</div>
                  <div className="text-xs mute">{u.email}</div>
                </div>
                <span className="role">{u.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ────────── Desktop app body ──────────
function DesktopApp({ state, currentUser, setCurrentUser, dispatch, tweaks, initialPage = 'dashboard', initialNewInput = false }) {
  const [page, setPage] = useState(initialPage);
  const [openDetail, setOpenDetail] = useState(null);
  const [newInputFlag, setNewInputFlag] = useState(initialNewInput);

  // If admin tab selected by non-admin (after switch), redirect
  React.useEffect(() => {
    const role = USERS.find(u => u.name === currentUser)?.role;
    if (page === 'admin' && role !== 'ADMIN') setPage('dashboard');
  }, [currentUser, page]);

  const navigate = (target, opts = {}) => {
    setPage(target);
    if (opts.newInput) setNewInputFlag(true);
    else setNewInputFlag(false);
  };

  return (
    <div className="app-shell">
      <TopBar currentUser={currentUser} setCurrentUser={setCurrentUser} page={page} setPage={navigate} state={state} />
      {page === 'dashboard' && (
        <DashboardScreen state={state} currentUser={currentUser} navigate={navigate} openExpense={setOpenDetail}
                         dashboardLayout={tweaks.dashboardLayout} />
      )}
      {page === 'expenses' && (
        <ListOfDataScreen state={state} currentUser={currentUser} dispatch={dispatch}
                          newInputOnInit={newInputFlag} entryStyle={tweaks.entryStyle}
                          openExpense={setOpenDetail} />
      )}
      {page === 'loans' && (
        <LoanDataScreen state={state} currentUser={currentUser} dispatch={dispatch}
                        loanView={tweaks.loanView} />
      )}
      {page === 'history' && <HistoryScreen state={state} currentUser={currentUser} />}
      {page === 'admin' && <AdminScreen state={state} dispatch={dispatch} />}
      {openDetail && (
        <ExpenseDetailDrawer expense={openDetail} onClose={() => setOpenDetail(null)}
                             state={state} currentUser={currentUser} dispatch={dispatch} />
      )}
    </div>
  );
}

// ────────── Stage (side-by-side desktop + mobile) ──────────
function Stage({ desktop, mobile }) {
  const stageRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const update = () => {
      if (!stageRef.current || !innerRef.current) return;
      const vw = stageRef.current.clientWidth;
      const stageWidth = innerRef.current.scrollWidth;
      const s = Math.min(1, vw / stageWidth);
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stageRef.current);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  return (
    <div className="stage-viewport" ref={stageRef}>
      <div className="stage" ref={innerRef} style={{ transform: `scale(${scale})` }}>
        <div className="desktop-cell">{desktop}</div>
        <div className="mobile-cell">{mobile}</div>
      </div>
    </div>
  );
}

// ────────── Main app: top-level state ──────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "view": "both",
  "dashboardLayout": "matrix",
  "loanView": "split",
  "entryStyle": "modal",
  "density": "comfortable",
  "theme": "light",
  "accent": "blue",
  "typeface": "default"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [state, dispatch] = useReducer(stateReducer, null, loadInitial);
  const [currentUser, setCurrentUser] = useState('Syaeful');

  // Apply theme attrs to the html element so CSS variables flip
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-theme', t.theme === 'dark' ? 'dark' : 'light');
    html.setAttribute('data-density', t.density);
    html.setAttribute('data-accent', t.accent);
    html.setAttribute('data-typeface', t.typeface);
  }, [t.theme, t.density, t.accent, t.typeface]);

  // shared content
  const desktop = (
    <DesktopApp state={state} currentUser={currentUser} setCurrentUser={setCurrentUser}
                dispatch={dispatch} tweaks={t} />
  );
  const mobile = (
    <MobileApp state={state} currentUser={currentUser} dispatch={dispatch} />
  );

  let view;
  if (t.view === 'desktop') {
    view = <div style={{ height: '100vh' }}>{desktop}</div>;
  } else if (t.view === 'mobile') {
    view = (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--surface-100)' }}>
        <IOSDevice width={402} height={874}>{mobile}</IOSDevice>
      </div>
    );
  } else {
    // side-by-side
    const desktopFrame = (
      <ChromeWindow tabs={[{ title: 'Thailand Expenses · Texcoms' }]}
        url="thai.expenses.syaefulaz.my.id"
        width={1240} height={780}>
        {desktop}
      </ChromeWindow>
    );
    const mobileFrame = <IOSDevice width={390} height={780}>{mobile}</IOSDevice>;
    view = <Stage desktop={desktopFrame} mobile={mobileFrame} />;
  }

  return (
    <ToastProvider>
      {view}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout">
          <TweakRadio label="View" value={t.view} options={[
            { value: 'both', label: 'Both' },
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Mobile' },
          ]} onChange={(v) => setTweak('view', v)} />
        </TweakSection>

        <TweakSection label="Dashboard">
          <TweakRadio label="Loan visual" value={t.dashboardLayout} options={[
            { value: 'matrix', label: 'Matrix' },
            { value: 'graph',  label: 'Graph' },
            { value: 'table',  label: 'Table' },
          ]} onChange={(v) => setTweak('dashboardLayout', v)} />
        </TweakSection>

        <TweakSection label="Loan Data screen">
          <TweakSelect label="View style" value={t.loanView} options={[
            { value: 'split', label: 'Split tabs (Lent / Borrowed)' },
            { value: 'unified', label: 'Unified table + role filter' },
          ]} onChange={(v) => setTweak('loanView', v)} />
        </TweakSection>

        <TweakSection label="Expense entry">
          <TweakRadio label="Form" value={t.entryStyle} options={[
            { value: 'modal', label: 'Modal' },
            { value: 'drawer', label: 'Drawer' },
            { value: 'inline', label: 'Inline' },
          ]} onChange={(v) => setTweak('entryStyle', v)} />
        </TweakSection>

        <TweakSection label="Theme & density">
          <TweakRadio label="Theme" value={t.theme} options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]} onChange={(v) => setTweak('theme', v)} />
          <TweakRadio label="Accent" value={t.accent} options={[
            { value: 'blue', label: 'Blue' },
            { value: 'warm', label: 'Warm' },
            { value: 'teal', label: 'Teal' },
          ]} onChange={(v) => setTweak('accent', v)} />
          <TweakRadio label="Density" value={t.density} options={[
            { value: 'comfortable', label: 'Comfy' },
            { value: 'compact', label: 'Compact' },
          ]} onChange={(v) => setTweak('density', v)} />
        </TweakSection>

        <TweakSection label="Typography">
          <TweakSelect label="Typeface" value={t.typeface} options={[
            { value: 'default', label: 'Inter (PrimeNG default)' },
            { value: 'grotesk', label: 'Space Grotesk' },
            { value: 'serif-display', label: 'Inter + Serif display' },
            { value: 'mono-accent', label: 'Inter + Mono display' },
          ]} onChange={(v) => setTweak('typeface', v)} />
        </TweakSection>
      </TweaksPanel>
    </ToastProvider>
  );
}

// Expose for Variations.html / external mounting
Object.assign(window, {
  App, DesktopApp, stateReducer, TWEAK_DEFAULTS, TopBar, Stage,
});

// Auto-mount unless caller opts out (e.g. Variations.html renders its own tree)
if (!window.__SKIP_AUTO_MOUNT && document.getElementById('root')) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
