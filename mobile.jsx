// mobile.jsx — Mobile (iPhone) version of the app screens

function MobileApp({ state, currentUser, dispatch }) {
  const [tab, setTab] = React.useState('dashboard');
  const [openForm, setOpenForm] = React.useState(false);
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Icon.dashboard },
    { id: 'expenses', label: 'Expenses', icon: Icon.list },
    { id: 'loans', label: 'Loans', icon: Icon.loan },
    { id: 'history', label: 'History', icon: Icon.history },
    ...(currentUser === 'Syaeful' ? [{ id: 'admin', label: 'Admin', icon: Icon.admin }] : []),
  ];

  return (
    <div className="m-shell" data-screen-label="Mobile">
      {tab === 'dashboard' && <MDashboard state={state} currentUser={currentUser} />}
      {tab === 'expenses' && <MExpenses state={state} currentUser={currentUser} onNew={() => setOpenForm(true)} />}
      {tab === 'loans' && <MLoans state={state} currentUser={currentUser} dispatch={dispatch} />}
      {tab === 'history' && <MHistory state={state} />}
      {tab === 'admin' && <MAdmin state={state} />}
      <div className="m-tabbar">
        {tabs.map(t => (
          <button key={t.id} className={`m-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <div className="ic">{t.icon(16)}</div>
            {t.label}
          </button>
        ))}
      </div>
      {(tab === 'expenses' || tab === 'dashboard') && (
        <button className="fab" onClick={() => { setTab('expenses'); setOpenForm(true); }}>{Icon.plus(20)}</button>
      )}
      <MNewExpenseSheet open={openForm} onClose={() => setOpenForm(false)} currentUser={currentUser} dispatch={dispatch} />
    </div>
  );
}

function MHeader({ title, subtitle, right }) {
  return (
    <div className="m-header">
      <div>
        <div className="title">{title}</div>
        {subtitle && <div className="text-xs mute">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function MDashboard({ state, currentUser }) {
  const myNet = netForUser(state.loans, currentUser);
  const totalSpend = state.expenses.reduce((s, e) => s + (e.status !== 'REJECTED' && e.status !== 'DRAFT' ? e.amount : 0), 0);
  const recent = [...state.expenses].sort((a, b) => b.id - a.id).slice(0, 6);
  return (
    <>
      <MHeader title="Dashboard" subtitle="Thailand fieldtrip · May 7–16" right={<Avatar name={currentUser} />} />
      <div className="m-body">
        {/* Net position hero */}
        <div className="m-card" style={{ background: myNet.net >= 0 ? 'linear-gradient(135deg, #ecfdf5 0%, #fff 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)', borderColor: myNet.net >= 0 ? '#a7f3d0' : '#fecaca' }}>
          <div className="text-xs mute semi" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your net position
          </div>
          <div className="bold tnum" style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 4, color: myNet.net > 0 ? 'var(--success-600)' : myNet.net < 0 ? 'var(--danger-600)' : 'inherit' }}>
            {myNet.net >= 0 ? '+' : '−'}฿{fmtTHB(Math.abs(myNet.net))}
          </div>
          <div className="text-xs mute" style={{ marginTop: 4 }}>
            {myNet.net > 0 ? `Others owe you · received ฿${fmtTHB(myNet.owedTo)}, owe ฿${fmtTHB(myNet.owes)}` :
             myNet.net < 0 ? `You owe ฿${fmtTHB(myNet.owes)}, others owe you ฿${fmtTHB(myNet.owedTo)}` : 'All settled'}
          </div>
        </div>

        <div className="row gap-3" style={{ marginBottom: 10 }}>
          <div className="m-kpi"><div className="lbl">Trip spend</div><div className="val">฿{fmtTHB(totalSpend, { decimals: 0 })}</div><div className="delta">{state.expenses.length} entries</div></div>
          <div className="m-kpi"><div className="lbl">Pending</div><div className="val">{state.expenses.filter(e => e.status === 'PENDING').length}</div><div className="delta">awaiting approval</div></div>
        </div>

        <div className="m-card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <div className="semi">Who owes whom</div>
          </div>
          <MWhoOwesWhom positions={computePositions(state.loans)} />
        </div>

        <div className="row between" style={{ margin: '14px 4px 8px' }}>
          <div className="semi">Recent expenses</div>
          <div className="text-xs mute">{recent.length} most recent</div>
        </div>
        {recent.map(e => (
          <div key={e.id} className="m-expense-card">
            <div className={`ic-bubble ${e.category || ''}`}>{(CATEGORY_ICONS[e.category] || Icon.inbox)(14)}</div>
            <div className="desc">
              <div className="top">
                <div className="ttl" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                <div className="amt">฿{fmtTHB(e.amount, { decimals: 0 })}</div>
              </div>
              <div className="sub">
                <UserPill name={e.recorder} />
                <span>{fmtDate(e.expense_date, { short: true })}</span>
                <Badge kind={e.status}>{e.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MWhoOwesWhom({ positions }) {
  const xs = positions.filter(p => p.remaining > 0);
  if (xs.length === 0) return <div className="mute text-sm">Everyone settled up. 🎉</div>;
  return (
    <div className="col gap-3">
      {xs.map((p, i) => (
        <div key={i} className="row" style={{ gap: 10, alignItems: 'center' }}>
          <UserPill name={p.borrower} />
          <div style={{ flex: 1, height: 2, background: 'var(--border)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)' }}>{Icon.arrowR(14)}</div>
          </div>
          <UserPill name={p.lender} />
          <div className="bold tnum" style={{ color: 'var(--danger-600)', minWidth: 80, textAlign: 'right' }}>฿{fmtTHB(p.remaining, { decimals: 0 })}</div>
        </div>
      ))}
    </div>
  );
}

function MExpenses({ state, currentUser, onNew }) {
  const [filter, setFilter] = React.useState('all');
  const xs = state.expenses
    .filter(e => filter === 'all' || e.recorder === currentUser)
    .sort((a, b) => b.id - a.id);

  // group by date
  const byDate = groupBy(xs, e => e.expense_date);
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <>
      <MHeader title="Expenses" subtitle={`${xs.length} entries`} />
      <div className="m-body">
        <div className="btn-group" style={{ marginBottom: 14, width: '100%' }}>
          <button className={filter === 'all' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'mine' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setFilter('mine')}>Mine</button>
        </div>
        {dates.map(d => (
          <div key={d}>
            <div className="text-xs mute semi" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 4px 6px' }}>
              {fmtDate(d)} · ฿{fmtTHB(byDate[d].reduce((s,e)=>s+e.amount,0), { decimals: 0 })}
            </div>
            {byDate[d].map(e => (
              <div key={e.id} className="m-expense-card">
                <div className={`ic-bubble ${e.category || ''}`}>{(CATEGORY_ICONS[e.category] || Icon.inbox)(14)}</div>
                <div className="desc">
                  <div className="top">
                    <div className="ttl" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    <div className="amt">฿{fmtTHB(e.amount, { decimals: 0 })}</div>
                  </div>
                  <div className="sub">
                    <UserPill name={e.recorder} />
                    <CategoryChip category={e.category} />
                    <Badge kind={e.status}>{e.status}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function MLoans({ state, currentUser, dispatch }) {
  const [tab, setTab] = React.useState('lent');
  const lent = state.loans.filter(l => l.lender === currentUser);
  const borrowed = state.loans.filter(l => l.borrower === currentUser);
  const xs = tab === 'lent' ? lent : borrowed;

  return (
    <>
      <MHeader title="Loans" subtitle="Track who owes whom" />
      <div className="m-body">
        <div className="row gap-3" style={{ marginBottom: 12 }}>
          <div className="m-kpi" style={{ background: 'var(--success-50)', borderColor: '#a7f3d0' }}>
            <div className="lbl">Owed to you</div>
            <div className="val" style={{ color: 'var(--success-600)' }}>฿{fmtTHB(lent.reduce((s,l)=>s+l.remaining_balance,0), { decimals: 0 })}</div>
            <div className="delta">{lent.length} loans</div>
          </div>
          <div className="m-kpi" style={{ background: 'var(--danger-50)', borderColor: '#fecaca' }}>
            <div className="lbl">You owe</div>
            <div className="val" style={{ color: 'var(--danger-600)' }}>฿{fmtTHB(borrowed.reduce((s,l)=>s+l.remaining_balance,0), { decimals: 0 })}</div>
            <div className="delta">{borrowed.length} loans</div>
          </div>
        </div>
        <div className="btn-group" style={{ width: '100%', marginBottom: 12 }}>
          <button className={tab === 'lent' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setTab('lent')}>I lent {lent.length}</button>
          <button className={tab === 'borrowed' ? 'active' : ''} style={{ flex: 1 }} onClick={() => setTab('borrowed')}>I borrowed {borrowed.length}</button>
        </div>
        {xs.slice(0, 30).map(l => {
          const e = state.expenses.find(x => x.id === l.expense_id);
          const other = tab === 'lent' ? l.borrower : l.lender;
          return (
            <div key={l.id} className="m-expense-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="row between">
                <UserPill name={other} />
                <Badge kind={l.status}>{l.status.replace('_', ' ')}</Badge>
              </div>
              <div style={{ margin: '6px 0' }}>
                <div className="semi text-sm" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e?.description}</div>
                <div className="text-xs mute">{fmtDate(e?.expense_date, { short: true })}</div>
              </div>
              <div className="row between" style={{ marginTop: 4 }}>
                <span className="text-xs mute">Remaining</span>
                <span className="bold tnum" style={{ color: l.remaining_balance > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                  ฿{fmtTHB(l.remaining_balance)} <span className="mute text-xs">/ ฿{fmtTHB(l.amount)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MHistory({ state }) {
  const events = buildAuditTrail(state).slice(0, 40);
  const byDate = groupBy(events, e => e.ts.slice(0, 10));
  const dates = Object.keys(byDate).sort().reverse();
  return (
    <>
      <MHeader title="History" subtitle="Audit log" />
      <div className="m-body">
        {dates.map(d => (
          <div key={d}>
            <div className="text-xs mute semi" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', margin: '12px 4px 6px' }}>{fmtDate(d)}</div>
            {byDate[d].map((ev, i) => (
              <div key={i} className="m-card" style={{ padding: 12 }}>
                <div className="row gap-3">
                  <Avatar name={ev.user} />
                  <div style={{ flex: 1 }}>
                    <div className="text-sm">
                      <span className="semi">{ev.user}</span>{' '}
                      <span className="mute">{ev.kind.replace(/_/g, ' ')}</span>
                    </div>
                    {ev.detail?.description && <div className="text-xs">{ev.detail.description}</div>}
                    {ev.detail?.amount && <div className="text-xs tnum semi">฿{fmtTHB(ev.detail.amount)}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function MAdmin({ state }) {
  return (
    <>
      <MHeader title="Admin" subtitle="User management" />
      <div className="m-body">
        {state.users.map(u => (
          <div key={u.id} className="m-card">
            <div className="row gap-3">
              <Avatar name={u.name} size="lg" />
              <div style={{ flex: 1 }}>
                <div className="semi">{u.name}</div>
                <div className="text-xs mute">{u.email}</div>
              </div>
              <div className="col gap-2" style={{ alignItems: 'flex-end' }}>
                <Badge kind={u.role}>{u.role}</Badge>
                <Badge kind={u.is_active ? 'ACTIVE' : 'INACTIVE'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MNewExpenseSheet({ open, onClose, currentUser, dispatch }) {
  const [form, set] = useExpenseForm();
  const toast = useToast();
  if (!open) return null;
  const save = () => {
    if (!form.amount || !form.description) return;
    dispatch({ type: 'ADD_EXPENSE', data: { ...form, amount: Number(form.amount), recorder: currentUser, status: 'PENDING' } });
    toast({ title: 'Expense added', kind: 'success' });
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: '16px 16px 28px', animation: 'slideUp 220ms ease-out' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: 'var(--border-strong)', borderRadius: 2, margin: '0 auto 14px' }} />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>New expense</h2>
        <p className="mute text-sm" style={{ margin: '4px 0 16px' }}>Logged by <UserPill name={currentUser} /></p>
        <div className="col gap-3">
          <Field label="Amount" required>
            <div className="input-affix">
              <span className="affix">฿</span>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
          </Field>
          <Field label="Description" required>
            <input className="input" placeholder="e.g. Grab to MBK" value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-2" style={{ gap: 10 }}>
            <Field label="Source" required>
              <Select value={form.source} onChange={(v) => set('source', v)} options={SOURCES} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES} placeholder="— None —" />
            </Field>
          </div>
          <div className="row gap-3" style={{ marginTop: 8 }}>
            <button className="btn btn-secondary btn-block" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-block" onClick={save}>Add expense</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MobileApp });
