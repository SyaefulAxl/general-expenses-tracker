// lib.jsx — shared primitives, icons, utilities, state store

// ────────── Icons (inline SVG, currentColor) ──────────
const Icon = {
  dashboard: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>,
  list: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  loan: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 8h20M5 4h14a3 3 0 013 3v10a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3z" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="14" r="1.5" fill="currentColor"/></svg>,
  history: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 109-9 9.74 9.74 0 00-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  admin: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  search: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  filter: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  download: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  check: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 20h4l11-11-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  trash: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 7h18M8 7V4h8v3m-9 0v13a2 2 0 002 2h6a2 2 0 002-2V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  send: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 12l18-9-7 18-2-8-9-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  more: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>,
  sort: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M8 6l-4 4m0 0l4 4m-4-4h16M16 18l4-4m0 0l-4-4m4 4H4" stroke="currentColor" strokeWidth="2"/></svg>,
  sortAsc: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0l-5 5m5-5l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sortDesc: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowR: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowL: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5m5 5l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevronD: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cash: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2"/></svg>,
  receipt: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 4h16v18l-3-2-3 2-3-2-3 2-2-1-2 1V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  car: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 17h14m-14 0v3h3v-3m11 0v3h-3v-3M5 17l2-7h10l2 7m-14 0H3v-4l2-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>,
  utensils: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 2v8a3 3 0 003 3v9m0-12h6m-3-3v3a3 3 0 003 3v9M4 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  bed: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 17v-7h14a4 4 0 014 4v3m-18 0v3m18-3v3M2 13h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  inbox: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 13l3-9h12l3 9m-18 0v6a2 2 0 002 2h14a2 2 0 002-2v-6m-18 0h6a2 2 0 002 2v0a2 2 0 002 2v0a2 2 0 002-2v0a2 2 0 002-2h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  upload: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 20V8m0 0l-4 4m4-4l4 4M4 4h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowDownRight: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10m0 0v-6m0 6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v0m0 4v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  bank: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 21h18M4 10v8m4-8v8m4-8v8m4-8v8m4-8v8M2 10l10-6 10 6H2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>,
  user: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  setting: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

const CATEGORY_ICONS = {
  Transport: Icon.car,
  Food: Icon.utensils,
  Accommodation: Icon.bed,
  Other: Icon.inbox,
};

// ────────── Constants ──────────
const SOURCES = ['Winda Cash', 'ATM Winda', 'Syaeful Cash', 'Dina Cash', 'ATM Dina', 'Corporate'];
const CATEGORIES = ['Transport', 'Food', 'Accommodation', 'Other'];
const USERS = [
  { id: 1, name: 'Syaeful', email: 'syaeful@texcoms.com', role: 'ADMIN', is_active: true,
    last_login: '2026-05-17T08:14:00Z', joined: '2024-01-10' },
  { id: 2, name: 'Winda', email: 'winda@texcoms.com', role: 'MANAGER', is_active: true,
    last_login: '2026-05-17T07:42:00Z', joined: '2024-02-22' },
  { id: 3, name: 'Dina', email: 'dina@texcoms.com', role: 'MANAGER', is_active: true,
    last_login: '2026-05-17T07:55:00Z', joined: '2024-02-22' },
];

// Map source string → user name (owner of those funds)
function sourceOwnerOf(source) {
  if (!source) return null;
  if (source.startsWith('Winda')) return 'Winda';
  if (source.startsWith('Syaeful')) return 'Syaeful';
  if (source.startsWith('Dina')) return 'Dina';
  return null; // Corporate has no personal owner
}

// ────────── Formatting helpers ──────────
function fmtTHB(n, { sign = false, decimals = 2 } = {}) {
  if (n == null || isNaN(n)) return '—';
  const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const prefix = sign && n > 0 ? '+' : (n < 0 ? '−' : '');
  return prefix + s;
}
function fmtTHBfull(n) { return '฿' + fmtTHB(n); }
function fmtDate(iso, { short = false } = {}) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (short) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtRelative(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(iso, { short: true });
}

// ────────── Avatar + UserPill ──────────
function Avatar({ name, size = 'md' }) {
  const cls = size === 'lg' ? 'avatar lg' : size === 'xs' ? 'avatar xs' : 'avatar';
  return <div className={`${cls} ${name}`}>{name ? name[0] : '?'}</div>;
}
function UserPill({ name }) {
  return <span className={`user-pill ${name}`}><Avatar name={name} size="xs" /><span>{name}</span></span>;
}

// ────────── Badge ──────────
function Badge({ children, kind, dot = false }) {
  return <span className={`badge ${kind}`}>{dot && <span className="dot"></span>}{children}</span>;
}
function CategoryChip({ category }) {
  if (!category) return null;
  return <span className={`chip ${category}`}>{category}</span>;
}

// ────────── Modal ──────────
function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${size === 'lg' ? 'lg' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="icon-close" onClick={onClose}>{Icon.close()}</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="icon-close" onClick={onClose}>{Icon.close()}</button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </>
  );
}

// ────────── Field components ──────────
function Field({ label, required, help, error, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label">
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error ? <div className="field-error">{error}</div> :
        help ? <div className="field-help">{help}</div> : null}
    </div>
  );
}

function Select({ value, onChange, options, placeholder = '— Select —' }) {
  return (
    <select className="select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled>{placeholder}</option>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : (o.label || o.value);
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

// ────────── Toasts ──────────
const ToastCtx = React.createContext(null);
function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setItems((arr) => [...arr, { id, ...toast }]);
    setTimeout(() => setItems((arr) => arr.filter(x => x.id !== id)), toast.duration || 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map(t => (
          <div key={t.id} className={`toast ${t.kind || ''}`}>
            <div className="title">{t.title}</div>
            {t.body && <div className="body">{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
function useToast() { return React.useContext(ToastCtx); }

// ────────── State store ──────────
function loadInitial() {
  return {
    users: USERS,
    expenses: window.SEED_DATA.expenses,
    loans: window.SEED_DATA.loans,
    repayments: window.SEED_DATA.repayments,
  };
}

// Generate audit history entries for state changes
function buildAuditTrail(state) {
  // Build a synthetic audit log from expense statuses + repayment events
  const events = [];
  for (const e of state.expenses) {
    events.push({
      kind: 'expense_created',
      ts: e.created_at,
      expense_id: e.id,
      user: e.recorder,
      detail: { description: e.description, amount: e.amount, source: e.source },
    });
    if (e.status !== 'DRAFT') {
      events.push({
        kind: 'expense_submitted',
        ts: e.created_at,
        expense_id: e.id,
        user: e.recorder,
        detail: { description: e.description, status: 'PENDING' },
      });
    }
    if (e.status === 'APPROVED') {
      events.push({
        kind: 'expense_approved',
        ts: e.created_at.replace('18:00', '20:30'),
        expense_id: e.id,
        user: 'Syaeful',
        detail: { description: e.description },
      });
    } else if (e.status === 'REJECTED') {
      events.push({
        kind: 'expense_rejected',
        ts: e.created_at.replace('18:00', '21:15'),
        expense_id: e.id,
        user: 'Syaeful',
        detail: { description: e.description, reason: 'Receipt unclear' },
      });
    }
  }
  for (const r of state.repayments) {
    events.push({
      kind: 'repayment',
      ts: r.repaid_at,
      user: r.recorded_by,
      detail: { loan_id: r.loan_id, amount: r.amount, note: r.note },
    });
  }
  events.sort((a, b) => b.ts.localeCompare(a.ts));
  return events;
}

// Compute loan positions (per user pair)
function computePositions(loans) {
  const pos = {}; // {lender}_{borrower}: { total, declared, repaid, remaining, count, settled }
  for (const l of loans) {
    const k = `${l.lender}_${l.borrower}`;
    if (!pos[k]) pos[k] = { lender: l.lender, borrower: l.borrower, total: 0, declared: 0, repaid: 0, remaining: 0, count: 0, settled: 0, partial: 0, unsettled: 0 };
    pos[k].total += l.amount;
    pos[k].declared += l.declared_repayment || 0;
    pos[k].repaid += l.actual_repaid || 0;
    pos[k].remaining += l.remaining_balance || 0;
    pos[k].count += 1;
    if (l.status === 'FULLY_SETTLED') pos[k].settled += 1;
    else if (l.status === 'PARTIAL') pos[k].partial += 1;
    else pos[k].unsettled += 1;
  }
  return Object.values(pos);
}

// Per-user net (lent − borrowed) computed from REMAINING balances
function netForUser(loans, userName) {
  let owedTo = 0;   // money others owe this user
  let owes = 0;     // money this user owes others
  for (const l of loans) {
    if (l.lender === userName) owedTo += l.remaining_balance || 0;
    if (l.borrower === userName) owes += l.remaining_balance || 0;
  }
  return { owedTo, owes, net: owedTo - owes };
}

// Group helper
function groupBy(arr, fn) {
  const out = {};
  for (const x of arr) {
    const k = fn(x);
    (out[k] = out[k] || []).push(x);
  }
  return out;
}

// Export
Object.assign(window, {
  Icon, CATEGORY_ICONS, SOURCES, CATEGORIES, USERS, sourceOwnerOf,
  fmtTHB, fmtTHBfull, fmtDate, fmtDateTime, fmtRelative,
  Avatar, UserPill, Badge, CategoryChip,
  Modal, Drawer, Field, Select,
  ToastProvider, useToast, ToastCtx,
  loadInitial, buildAuditTrail, computePositions, netForUser, groupBy,
});
