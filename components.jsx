// components.jsx — Shared UI: Avatar, StatusBadge, Modal, Drawer, ExpenseForm, RepayDialog, etc.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ user, size, className = '' }) {
  if (!user) return null;
  const sizeCls = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : '';
  return (
    <span className={`avatar ${sizeCls} ${user.avatarClass || ''} ${className}`} title={user.name}>
      {user.initials}
    </span>
  );
}

function UserCell({ user, sub }) {
  if (!user) return <span className="muted">—</span>;
  return (
    <span className="user-cell">
      <Avatar user={user} size="sm" />
      <span>
        <span className="strong">{user.name}</span>
        {sub ? <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>{sub}</span> : null}
      </span>
    </span>
  );
}

// ── Status badges ─────────────────────────────────────────────────────────
function ExpenseStatusBadge({ status }) {
  const map = {
    DRAFT:    { cls: 'draft',    label: 'Draft' },
    PENDING:  { cls: 'pending',  label: 'Pending' },
    APPROVED: { cls: 'approved', label: 'Approved' },
    REJECTED: { cls: 'rejected', label: 'Rejected' },
  };
  const s = map[status] || map.DRAFT;
  return <span className={`badge ${s.cls}`}><span className="dot" />{s.label}</span>;
}

function LoanStatusBadge({ status }) {
  const map = {
    UNSETTLED:     { cls: 'unsettled', label: 'Unsettled' },
    PARTIAL:       { cls: 'partial',   label: 'Partial' },
    FULLY_SETTLED: { cls: 'settled',   label: 'Settled' },
    OVERPAID:      { cls: 'overpaid',  label: 'Overpaid' },
  };
  const s = map[status] || map.UNSETTLED;
  return <span className={`badge ${s.cls}`}><span className="dot" />{s.label}</span>;
}

function CategoryBadge({ value }) {
  if (!value) return <span className="muted">—</span>;
  return <span className="badge tag">{value}</span>;
}

// ── Modal / Drawer ───────────────────────────────────────────────────────
function Scrim({ onClick }) {
  return <div className="scrim" onClick={onClick} />;
}

function Modal({ title, onClose, footer, children, width }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <Scrim onClick={onClose} />
      <div className="modal" style={width ? { width } : null} role="dialog" aria-modal="true">
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><IconX size={16} /></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer ? <div className="modal-ft">{footer}</div> : null}
      </div>
    </>
  );
}

function Drawer({ title, onClose, footer, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <>
      <Scrim onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><IconX size={16} /></button>
        </div>
        <div className="modal-bd">{children}</div>
        {footer ? <div className="modal-ft">{footer}</div> : null}
      </div>
    </>
  );
}

// ── Toast (top-right notification) ───────────────────────────────────────
const ToastContext = React.createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((xs) => [...xs, { id, ...t }]);
    setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), t.timeout || 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderLeft: `3px solid ${t.kind === 'error' ? 'var(--danger-500)' : t.kind === 'success' ? 'var(--success-500)' : 'var(--primary)'}`,
            borderRadius: 8, padding: '10px 14px', minWidth: 260, maxWidth: 380,
            boxShadow: 'var(--shadow-2)', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{t.title}</div>
            {t.msg ? <div style={{ marginTop: 2, color: 'var(--text-muted)', fontSize: 12 }}>{t.msg}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
function useToast() { return React.useContext(ToastContext); }

// ── Expense form (used in Modal, Drawer, or inline) ──────────────────────
function ExpenseForm({ initial, onCancel, onSubmit, submitLabel = 'Save draft', users, currentUser, showSubmitNow }) {
  const today = new Date().toISOString().slice(0, 10);
  const [expense_date, setDate] = useState(initial?.expense_date || today);
  const [amount, setAmount]     = useState(initial?.amount ?? '');
  const [description, setDesc]  = useState(initial?.description || '');
  const [source, setSource]     = useState(initial?.source || 'Syaeful Cash');
  const [category, setCat]      = useState(initial?.category || '');
  const [attachment, setAtt]    = useState(initial?.attachment || null);

  const ownerId = sourceOwnerId(source);
  const ownerOther = ownerId != null && ownerId !== currentUser.id;
  const ownerUser = ownerId != null ? userById({ users }, ownerId) : null;

  const valid = expense_date && amount > 0 && description.trim() && source;

  const submit = (status) => {
    if (!valid) return;
    onSubmit({
      expense_date,
      amount: Number(amount),
      description: description.trim(),
      source,
      category: category || null,
      attachment,
      status, // 'DRAFT' or 'PENDING'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      <div className="form-grid">
        <div className="field">
          <label>Expense date<span className="req">*</span></label>
          <div className="input-wrap">
            <IconCalendar size={14} className="icon-leading" />
            <input type="date" className="input with-icon" value={expense_date}
                   onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="hint">Date the expense occurred — not submission date.</div>
        </div>
        <div className="field">
          <label>Amount (THB)<span className="req">*</span></label>
          <input type="number" className="input mono" min="0" step="0.01"
                 placeholder="0.00" value={amount}
                 onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="field span-2">
          <label>Description<span className="req">*</span></label>
          <input className="input" placeholder="e.g. Grab rides — Suvarnabhumi to Sukhumvit"
                 value={description} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="field">
          <label>Source<span className="req">*</span></label>
          <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {ownerOther && (
            <div className="hint" style={{ color: 'var(--warn-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconInfo size={12} />
              On submit, will auto-create a loan: <b style={{ marginLeft: 2 }}>{currentUser.name} owes {ownerUser?.name} {amount ? fmtTHB(Number(amount)) : '—'} ฿</b>
            </div>
          )}
        </div>
        <div className="field">
          <label>Category</label>
          <select className="select" value={category} onChange={(e) => setCat(e.target.value)}>
            <option value="">— None —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field span-2">
          <label>Attachment</label>
          {attachment ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <IconPaperclip size={14} />
              <span style={{ flex: 1, fontSize: 12 }}>{typeof attachment === 'string' ? attachment : attachment.name}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setAtt(null)}><IconX size={14} /></button>
            </div>
          ) : (
            <label className="file-zone" style={{ display: 'block', cursor: 'default' }}>
              <IconUpload className="file-icon" size={22} />
              <div>Drag receipt here or <b style={{ color: 'var(--primary)' }}>browse</b></div>
              <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG or PDF · max 5 MB</div>
              <input type="file" hidden accept="image/*,.pdf"
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) setAtt(f); }} />
            </label>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-secondary" disabled={!valid} onClick={() => submit('DRAFT')}>{submitLabel}</button>
        {showSubmitNow ? (
          <button className="btn" disabled={!valid} onClick={() => submit('PENDING')}>
            <IconSend size={13} /> Submit
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Repayment dialog ─────────────────────────────────────────────────────
function RepaymentDialog({ loan, lender, borrower, onClose, onDeclare, onRecord }) {
  const remaining = loanRemaining(loan);
  const declared  = loan.declared_repayment;

  // sub-views: declare / record / overview
  const [view, setView] = useState(declared == null ? 'declare' : 'record');
  const [declareAmt, setDeclareAmt] = useState(declared ?? loan.amount);
  const [recordAmt, setRecordAmt] = useState(remaining);
  const [note, setNote] = useState('');

  return (
    <Modal title="Manage loan settlement" onClose={onClose} width={560}>
      <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
        {/* summary header */}
        <div style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap: 8 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
              <Avatar user={borrower} />
              <span className="muted" style={{ fontSize: 12 }}>owes</span>
              <Avatar user={lender} />
            </div>
            <LoanStatusBadge status={loan.status} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 12 }}>
            <Stat label="Original" value={fmtTHB(loan.amount)} unit="฿" />
            <Stat label="Declared"  value={declared == null ? '—' : fmtTHB(declared)} unit="฿" />
            <Stat label="Remaining" value={fmtTHB(remaining)} unit="฿" emphasis />
          </div>
        </div>

        {/* tabs inside dialog */}
        <div className="tabs">
          <button className={view === 'declare' ? 'active' : ''} onClick={() => setView('declare')}>
            Declare repayment
          </button>
          <button className={view === 'record' ? 'active' : ''} onClick={() => setView('record')} disabled={declared == null}>
            Record actual payment
          </button>
        </div>

        {view === 'declare' && (
          <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
            <div className="field">
              <label>Amount {borrower.name} agrees to repay (THB)</label>
              <input className="input mono" type="number" min="0" step="0.01"
                     value={declareAmt} onChange={(e) => setDeclareAmt(e.target.value)} />
              <div className="hint">Up to the original {fmtTHB(loan.amount)} ฿. May be less if {borrower.name} only repays a portion.</div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn" disabled={!declareAmt || declareAmt <= 0}
                      onClick={() => { onDeclare(Number(declareAmt)); }}>
                <IconCheck size={13} /> Save declared amount
              </button>
            </div>
          </div>
        )}

        {view === 'record' && (
          <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
            <div className="field">
              <label>Repayment amount received (THB)</label>
              <input className="input mono" type="number" min="0" step="0.01"
                     value={recordAmt} onChange={(e) => setRecordAmt(e.target.value)} />
              <div className="hint">Remaining: {fmtTHB(remaining)} ฿ · You can record a partial or full repayment.</div>
            </div>
            <div className="field">
              <label>Note</label>
              <input className="input" placeholder="e.g. Cash over dinner, PromptPay…"
                     value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-success" disabled={!recordAmt || recordAmt <= 0}
                      onClick={() => { onRecord(Number(recordAmt), note); }}>
                <IconCheck size={13} /> Record repayment
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, unit, emphasis }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 2, fontSize: emphasis ? 22 : 18, fontWeight: 700, letterSpacing: '-0.01em',
                    color: emphasis ? 'var(--primary)' : 'var(--text-strong)',
                    fontVariantNumeric: 'tabular-nums' }}>
        {value} {unit ? <small style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</small> : null}
      </div>
    </div>
  );
}

// ── Confirm dialog ───────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width={420}
           footer={(
             <>
               <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
               <button className={`btn ${danger ? 'btn-danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
             </>
           )}>
      <div style={{ color: 'var(--text)' }}>{message}</div>
    </Modal>
  );
}

// ── Simple bar / horizontal-list chart for KPIs / by-category ────────────
function HBarChart({ data, total, formatter = fmtTHBShort, colorOf, max }) {
  const _max = max ?? Math.max(...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d, i) => {
        const w = _max > 0 ? Math.max(2, (d.value / _max) * 100) : 0;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text)' }}>{d.label}</span>
              <span className="mono muted">{formatter(d.value)} ฿ {total ? <span style={{ marginLeft: 6, opacity: .7 }}>({Math.round((d.value/total) * 100)}%)</span> : null}</span>
            </div>
            <div className="progress" style={{ height: 6 }}>
              <span style={{ width: `${w}%`, background: colorOf ? colorOf(d, i) : 'var(--primary)' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Who-owes-whom flow graph (SVG, viewer-agnostic) ──────────────────────
function NetworkGraph({ users, pairs, currentUserId }) {
  // place 3 users around a triangle.
  const W = 520, H = 360;
  const center = { x: W / 2, y: H / 2 };
  const R = 130;
  const positions = users.map((u, i) => {
    const angle = (-Math.PI / 2) + (i * (2 * Math.PI / users.length));
    return { user: u, x: center.x + R * Math.cos(angle), y: center.y + R * Math.sin(angle) };
  });
  const posOf = (id) => positions.find((p) => p.user.id === id);

  // edge geometry
  const edges = pairs.map((p) => {
    const a = posOf(p.borrower_id), b = posOf(p.lender_id);
    if (!a || !b) return null;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const offset = 30; // pull endpoints back from node center
    const x1 = a.x + ux * offset, y1 = a.y + uy * offset;
    const x2 = b.x - ux * offset, y2 = b.y - uy * offset;
    return { p, a, b, x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }).filter(Boolean);

  const isViewer = (id) => id === currentUserId;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="8" refY="5"
                orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--danger-500)"/>
        </marker>
      </defs>

      {edges.map((e, i) => (
        <g key={i}>
          <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke="var(--danger-500)" strokeWidth="1.6" markerEnd="url(#arrowHead)" />
          <g transform={`translate(${e.mx}, ${e.my})`}>
            <rect x="-44" y="-12" width="88" height="22" rx="11"
                  fill="var(--panel)" stroke="var(--border)" strokeWidth="1"/>
            <text textAnchor="middle" y="4" fontFamily="var(--font)" fontSize="11"
                  fontWeight="700" fill="var(--text-strong)">
              {fmtTHB(e.p.amount, { decimals: 0 })} ฿
            </text>
          </g>
        </g>
      ))}

      {positions.map(({ user, x, y }) => {
        const color =
          user.avatarClass === 'syaeful' ? '#6366f1' :
          user.avatarClass === 'winda'   ? '#ec4899' : '#14b8a6';
        return (
          <g key={user.id} transform={`translate(${x}, ${y})`}>
            <circle r="32" fill={color} />
            {isViewer(user.id) && <circle r="38" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" opacity=".5"/>}
            <text textAnchor="middle" y="6" fill="white" fontWeight="700" fontFamily="var(--font)" fontSize="18">
              {user.initials}
            </text>
            <text textAnchor="middle" y="56" fill="var(--text)" fontWeight="600" fontFamily="var(--font)" fontSize="13">
              {user.name}
            </text>
          </g>
        );
      })}

      {pairs.length === 0 && (
        <text x={W/2} y={H - 18} textAnchor="middle" fill="var(--text-muted)" fontSize="12">
          All settled — no outstanding balances 🎉
        </text>
      )}
    </svg>
  );
}

// ── small filter chip ────────────────────────────────────────────────────
function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        appearance: 'none', font: 'inherit',
        background: active ? 'var(--primary-soft)' : 'var(--panel)',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        border: `1px solid ${active ? 'var(--primary-soft-2)' : 'var(--border)'}`,
        borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 500,
        cursor: 'default', whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  );
}

// expose
Object.assign(window, {
  Avatar, UserCell, ExpenseStatusBadge, LoanStatusBadge, CategoryBadge,
  Modal, Drawer, Scrim, ToastProvider, useToast,
  ExpenseForm, RepaymentDialog, Stat, ConfirmDialog, HBarChart, NetworkGraph, Chip,
});
