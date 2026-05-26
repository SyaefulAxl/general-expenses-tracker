// screens.jsx — desktop screens (Dashboard, ListOfData, LoanData, History, Admin)

// ════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════
function DashboardScreen({ state, currentUser, dashboardLayout, navigate, openExpense }) {
  const { expenses, loans } = state;
  const totalSpend = expenses.reduce((s, e) => s + (e.status !== 'REJECTED' && e.status !== 'DRAFT' ? e.amount : 0), 0);
  const myExpenses = expenses.filter(e => e.recorder === currentUser);
  const mySpend = myExpenses.reduce((s, e) => s + (e.status !== 'REJECTED' && e.status !== 'DRAFT' ? e.amount : 0), 0);
  const pendingCount = expenses.filter(e => e.status === 'PENDING').length;
  const myNet = netForUser(loans, currentUser);

  // Trip days
  const dates = expenses.map(e => e.expense_date).sort();
  const firstDay = dates[0], lastDay = dates[dates.length - 1];
  const tripDays = firstDay && lastDay ?
    Math.round((new Date(lastDay) - new Date(firstDay)) / 86400000) + 1 : 0;

  const positions = computePositions(loans);
  const recentExpenses = [...expenses].sort((a,b) => b.id - a.id).slice(0, 6);

  return (
    <div className="page" data-screen-label="Dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Thailand fieldtrip · {fmtDate(firstDay)} – {fmtDate(lastDay)} · {tripDays} days · {expenses.length} expense entries
          </p>
        </div>
        <div className="row gap-3">
          <button className="btn btn-secondary"><span className="icon">{Icon.download(14)}</span> Export</button>
          <button className="btn btn-primary" onClick={() => navigate('expenses', { newInput: true })}>
            <span className="icon">{Icon.plus()}</span> New expense
          </button>
        </div>
      </div>

      {/* HERO: Net position for current user */}
      <div className="section">
        <NetPositionHero user={currentUser} net={myNet} />
      </div>

      {/* KPI Row */}
      <div className="section">
        <div className="grid grid-4">
          <Kpi label="Total trip spend" value={fmtTHB(totalSpend)} prefix="฿" sub={`across ${expenses.length} entries`} icon={Icon.cash(18)} />
          <Kpi label="Your contribution" value={fmtTHB(mySpend)} prefix="฿"
               sub={`${myExpenses.length} entries you recorded`} icon={Icon.receipt(18)} accent />
          <Kpi label="Pending approval" value={pendingCount} sub="awaiting admin review" icon={Icon.inbox(18)} />
          <Kpi label="Outstanding settle" value={fmtTHB(positions.reduce((s,p) => s + p.remaining, 0))} prefix="฿"
               sub={`${positions.filter(p => p.remaining > 0).length} open balances`} icon={Icon.loan(18)} />
        </div>
      </div>

      {/* MAIN AREA: layout switches based on tweak */}
      {dashboardLayout === 'matrix' ? (
        <div className="section">
          <h2 style={{ margin: '0 0 12px', fontSize: 'var(--fs-lg)', fontWeight: 600 }}>Who owes whom</h2>
          <LoanMatrix positions={positions} />
        </div>
      ) : dashboardLayout === 'graph' ? (
        <div className="section">
          <h2 style={{ margin: '0 0 12px', fontSize: 'var(--fs-lg)', fontWeight: 600 }}>Net loan flow</h2>
          <NetFlowGraph loans={loans} />
        </div>
      ) : (
        <div className="section">
          <h2 style={{ margin: '0 0 12px', fontSize: 'var(--fs-lg)', fontWeight: 600 }}>Balance summary</h2>
          <CompactBalanceTable positions={positions} />
        </div>
      )}

      <div className="grid grid-2 section">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Spend by category</h3>
              <p className="card-subtitle">Across the entire trip</p>
            </div>
          </div>
          <div className="card-body"><CategoryBreakdown expenses={expenses} /></div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent activity</h3>
              <p className="card-subtitle">Last 6 entries</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('expenses')}>View all {Icon.arrowR(12)}</button>
          </div>
          <div className="card-body flush">
            {recentExpenses.map(e => (
              <div key={e.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => openExpense(e)}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {(CATEGORY_ICONS[e.category] || Icon.inbox)(14)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--fs-base)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                  <div className="text-xs mute" style={{ marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <UserPill name={e.recorder} />
                    <span>· {fmtDate(e.expense_date, { short: true })}</span>
                    <span>· {e.source}</span>
                  </div>
                </div>
                <div className="tnum semi">฿{fmtTHB(e.amount)}</div>
                <Badge kind={e.status}>{e.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NetPositionHero({ user, net }) {
  const sign = net.net > 0 ? 'up' : net.net < 0 ? 'down' : '';
  const msg = net.net > 0
    ? `You are net owed money. ${net.owedTo > 0 ? `Others should pay you back.` : ''}`
    : net.net < 0
      ? `You owe more than is owed to you.`
      : 'All settled up — nice.';
  const prefix = net.net > 0 ? '+฿' : net.net < 0 ? '−฿' : '฿';
  return (
    <div className="net-hero">
      <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2>Net position for <UserPill name={user} /></h2>
          <div className={`big ${sign}`}>
            {prefix}{fmtTHB(Math.abs(net.net))}
          </div>
          <p className="msg">{msg}</p>
        </div>
        <div className="right-stats">
          <div>
            <div className="lbl">Owed to you</div>
            <div className="v" style={{ color: 'var(--success-600)' }}>฿{fmtTHB(net.owedTo)}</div>
          </div>
          <div className="divider" />
          <div>
            <div className="lbl">You owe</div>
            <div className="v" style={{ color: 'var(--danger-600)' }}>฿{fmtTHB(net.owes)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, prefix, sub, icon, accent }) {
  return (
    <div className={`kpi ${accent ? 'kpi-accent' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {prefix && <span className="currency">{prefix}</span>}{value}
      </div>
      <div className="kpi-delta">{sub}</div>
      {icon && <div className="kpi-icon">{icon}</div>}
    </div>
  );
}

function LoanMatrix({ positions }) {
  const names = ['Syaeful', 'Winda', 'Dina'];
  const get = (l, b) => positions.find(p => p.lender === l && p.borrower === b);
  return (
    <div className="loan-matrix">
      <div className="cell head">Lender ↓ / Borrower →</div>
      {names.map(b => <div key={b} className="cell head"><UserPill name={b} /></div>)}
      {names.map(l => (
        <React.Fragment key={l}>
          <div className="cell head" style={{ textAlign: 'left', justifyContent: 'flex-start' }}><UserPill name={l} /></div>
          {names.map(b => {
            if (l === b) return <div key={b} className="cell diag">—</div>;
            const p = get(l, b);
            if (!p || p.total === 0) return <div key={b} className="cell zero"><div className="amt">฿0</div><div className="sub">no loans</div></div>;
            const settled = p.remaining === 0;
            return (
              <div key={b} className={`cell ${settled ? 'settled' : 'has-remaining'}`}>
                <div className="amt">฿{fmtTHB(p.remaining)}</div>
                <div className="sub">
                  {settled ? 'fully settled' : `of ฿${fmtTHB(p.total)} · ${p.count} loans`}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function NetFlowGraph({ loans }) {
  const positions = computePositions(loans);
  // Net per user
  const net = { Syaeful: 0, Winda: 0, Dina: 0 };
  for (const p of positions) {
    net[p.lender] += p.remaining;
    net[p.borrower] -= p.remaining;
  }
  // Edges between any pair (lender → borrower) where remaining > 0
  // Net edges: subtract reverse direction so we only show one arrow per pair
  const pairs = [['Syaeful', 'Winda'], ['Winda', 'Dina'], ['Syaeful', 'Dina']];
  const flow = pairs.map(([a, b]) => {
    const ab = positions.find(p => p.lender === a && p.borrower === b);
    const ba = positions.find(p => p.lender === b && p.borrower === a);
    const remAB = ab ? ab.remaining : 0;
    const remBA = ba ? ba.remaining : 0;
    if (remAB > remBA) return { from: a, to: b, amount: remAB - remBA };
    if (remBA > remAB) return { from: b, to: a, amount: remBA - remAB };
    return null;
  }).filter(Boolean);

  // Positions: triangle
  // SVG canvas 720 x 360
  const positions3 = {
    Syaeful: { x: 360, y: 70 },
    Winda:   { x: 160, y: 280 },
    Dina:    { x: 560, y: 280 },
  };

  return (
    <div className="flow-graph" style={{ minHeight: 380 }}>
      <svg viewBox="0 0 720 360" style={{ width: '100%', height: 360, position: 'relative', zIndex: 1 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="#dc2626" />
          </marker>
        </defs>
        {flow.map((f, i) => {
          const a = positions3[f.from], b = positions3[f.to];
          // Shorten line so it stops at node radius (44)
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const ux = dx / dist, uy = dy / dist;
          const r = 50;
          const x1 = a.x + ux * r, y1 = a.y + uy * r;
          const x2 = b.x - ux * r, y2 = b.y - uy * r;
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrow)" />
              <rect x={mx - 60} y={my - 14} width="120" height="28" rx="14"
                fill="white" stroke="#ef4444" strokeWidth="1.5" />
              <text x={mx} y={my + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#dc2626">
                ฿{fmtTHB(f.amount, { decimals: 0 })}
              </text>
            </g>
          );
        })}
      </svg>
      {['Syaeful', 'Winda', 'Dina'].map(n => {
        const p = positions3[n];
        const v = net[n];
        const isL = v > 0, isB = v < 0;
        return (
          <div key={n} className={`flow-node ${isL ? 'lender' : ''} ${isB ? 'borrower' : ''}`}
               style={{ left: p.x - 44, top: p.y - 44 }}>
            <Avatar name={n} size="lg" />
            <div className="nm">{n}</div>
            <div className="net tnum" style={{ color: isL ? 'var(--success-600)' : isB ? 'var(--danger-600)' : 'var(--text-muted)' }}>
              {isL ? '+' : isB ? '−' : ''}฿{fmtTHB(Math.abs(v), { decimals: 0 })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompactBalanceTable({ positions }) {
  const active = positions.filter(p => p.total > 0);
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Lender</th>
            <th>Borrower</th>
            <th className="num">Original</th>
            <th className="num">Declared</th>
            <th className="num">Repaid</th>
            <th className="num">Remaining</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {active.map((p, i) => (
            <tr key={i}>
              <td><UserPill name={p.lender} /></td>
              <td><UserPill name={p.borrower} /></td>
              <td className="num">฿{fmtTHB(p.total)}</td>
              <td className="num">฿{fmtTHB(p.declared)}</td>
              <td className="num">฿{fmtTHB(p.repaid)}</td>
              <td className="num bold">฿{fmtTHB(p.remaining)}</td>
              <td>
                {p.remaining === 0 ? <Badge kind="FULLY_SETTLED">Settled</Badge> :
                 p.repaid > 0 ? <Badge kind="PARTIAL">Partial · {Math.round(100 * p.repaid / p.total)}%</Badge> :
                 <Badge kind="UNSETTLED">Open · {p.count} loans</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryBreakdown({ expenses }) {
  const byCat = groupBy(expenses.filter(e => e.status !== 'REJECTED' && e.status !== 'DRAFT'), e => e.category);
  const total = Object.values(byCat).flat().reduce((s, e) => s + e.amount, 0);
  const data = CATEGORIES.map(c => {
    const arr = byCat[c] || [];
    const sum = arr.reduce((s, e) => s + e.amount, 0);
    return { category: c, sum, count: arr.length, pct: total > 0 ? sum / total : 0 };
  }).sort((a, b) => b.sum - a.sum);
  return (
    <div className="col gap-3">
      {data.map(d => (
        <div key={d.category}>
          <div className="row between" style={{ marginBottom: 4 }}>
            <CategoryChip category={d.category} />
            <div className="row gap-3 text-sm">
              <span className="mute">{d.count} entries</span>
              <span className="bold tnum">฿{fmtTHB(d.sum)}</span>
            </div>
          </div>
          <div className="progress" style={{ width: '100%' }}>
            <div className="bar" style={{ width: `${d.pct * 100}%`, background: d.category === 'Transport' ? '#1d4ed8' : d.category === 'Food' ? '#d97706' : d.category === 'Accommodation' ? '#6d28d9' : 'var(--surface-500)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LIST OF DATA (Expenses)
// ════════════════════════════════════════════════════════════════
function ListOfDataScreen({ state, currentUser, dispatch, newInputOnInit, entryStyle, openExpense, viewMode }) {
  const { expenses } = state;

  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterRecorder, setFilterRecorder] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'expense_date', dir: 'desc' });

  const [openForm, setOpenForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);

  React.useEffect(() => {
    if (newInputOnInit) setOpenForm(true);
  }, [newInputOnInit]);

  const filtered = React.useMemo(() => {
    let xs = expenses;
    if (search.trim()) {
      const q = search.toLowerCase();
      xs = xs.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.toko.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q));
    }
    if (filterStatus !== 'all') xs = xs.filter(e => e.status === filterStatus);
    if (filterCategory !== 'all') xs = xs.filter(e => e.category === filterCategory);
    if (filterRecorder !== 'all') xs = xs.filter(e => e.recorder === filterRecorder);

    xs = [...xs].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return xs;
  }, [expenses, search, filterStatus, filterCategory, filterRecorder, sort]);

  const [page, setPage] = React.useState(1);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  React.useEffect(() => { setPage(1); }, [search, filterStatus, filterCategory, filterRecorder]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSort = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  const sortIc = (key) => sort.key !== key ? Icon.sort(10) : sort.dir === 'asc' ? Icon.sortAsc(10) : Icon.sortDesc(10);

  const toast = useToast();
  const handleSave = (form) => {
    if (editing) {
      dispatch({ type: 'UPDATE_EXPENSE', id: editing.id, data: form });
      toast({ title: 'Expense updated', body: form.description, kind: 'success' });
    } else {
      dispatch({ type: 'ADD_EXPENSE', data: { ...form, recorder: currentUser, status: 'DRAFT' } });
      toast({ title: 'Expense created', body: `Draft saved · ฿${fmtTHB(form.amount)}`, kind: 'success' });
    }
    setOpenForm(false); setEditing(null);
  };
  const handleSubmit = (e) => {
    dispatch({ type: 'SUBMIT_EXPENSE', id: e.id });
    toast({ title: 'Expense submitted', body: 'Status changed to PENDING', kind: 'success' });
  };
  const handleDelete = (e) => {
    dispatch({ type: 'DELETE_EXPENSE', id: e.id });
    toast({ title: 'Draft deleted' });
  };

  return (
    <div className="page" data-screen-label="List of Data">
      <div className="page-header">
        <div>
          <h1 className="page-title">List of Data</h1>
          <p className="page-subtitle">{filtered.length} expenses · ฿{fmtTHB(filtered.reduce((s,e)=>s+e.amount,0))} total</p>
        </div>
        <div className="row gap-3">
          <button className="btn btn-secondary"><span className="icon">{Icon.download(14)}</span> Export CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpenForm(true); }}>
            <span className="icon">{Icon.plus()}</span> New Input
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="search">
            <span className="ic">{Icon.search(16)}</span>
            <input placeholder="Search description, store, source…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <Select value={filterStatus} onChange={setFilterStatus} options={[
            { value: 'all', label: 'All status' }, 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'
          ]} />
          <Select value={filterCategory} onChange={setFilterCategory} options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES]} />
          <Select value={filterRecorder} onChange={setFilterRecorder} options={[
            { value: 'all', label: 'All recorders' },
            { value: 'Syaeful', label: 'Syaeful' }, { value: 'Winda', label: 'Winda' }, { value: 'Dina', label: 'Dina' }
          ]} />
          <div className="spacer" />
          <span className="text-sm mute">{filtered.length} of {expenses.length}</span>
        </div>

        {entryStyle === 'inline' && openForm && (
          <InlineExpenseRow onCancel={() => setOpenForm(false)} onSave={handleSave} currentUser={currentUser} />
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => onSort('expense_date')}>
                Date <span className="sort-ic">{sortIc('expense_date')}</span>
              </th>
              <th>Description</th>
              <th>Recorder</th>
              <th>Source</th>
              <th>Category</th>
              <th className="num sortable" onClick={() => onSort('amount')}>
                Amount (THB) <span className="sort-ic">{sortIc('amount')}</span>
              </th>
              <th>Status</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan="8">
                <div className="empty">
                  <div className="empty-icon">{Icon.receipt(20)}</div>
                  <div className="empty-title">No expenses match</div>
                  <div>Try changing filters or click <strong>New Input</strong>.</div>
                </div>
              </td></tr>
            )}
            {paged.map(e => (
              <tr key={e.id}>
                <td>{fmtDate(e.expense_date, { short: true })}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => openExpense(e)}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      {(CATEGORY_ICONS[e.category] || Icon.inbox)(13)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="semi" style={{ maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                      <div className="text-xs mute">{e.toko}</div>
                    </div>
                  </div>
                </td>
                <td><UserPill name={e.recorder} /></td>
                <td><span className="text-sm">{e.source}</span></td>
                <td><CategoryChip category={e.category} /></td>
                <td className="num tnum semi">{fmtTHB(e.amount)}</td>
                <td><Badge kind={e.status}>{e.status}</Badge></td>
                <td>
                  <div className="row-action row gap-2" style={{ justifyContent: 'flex-end' }}>
                    {e.status === 'DRAFT' && e.recorder === currentUser ? (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(e); setOpenForm(true); }}>{Icon.edit(12)}</button>
                        <button className="btn btn-sm btn-primary" onClick={() => handleSubmit(e)} title="Submit">{Icon.send(12)}</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(e)}>{Icon.trash(12)}</button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-ghost" onClick={() => openExpense(e)}>{Icon.more(14)}</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-pagination">
          <div>Showing <strong>{Math.min(filtered.length, (page-1)*pageSize + 1)}</strong>–<strong>{Math.min(filtered.length, page*pageSize)}</strong> of {filtered.length}</div>
          <div className="pager">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>{Icon.arrowL(12)}</button>
            {Array.from({length: Math.min(5, pageCount)}, (_, i) => {
              const offset = Math.max(0, Math.min(pageCount - 5, page - 3));
              const n = i + 1 + offset;
              return <button key={n} className={`page-btn ${n === page ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>;
            })}
            <button className="page-btn" disabled={page >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p+1))}>{Icon.arrowR(12)}</button>
          </div>
        </div>
      </div>

      {entryStyle === 'modal' && (
        <ExpenseFormModal open={openForm} onClose={() => { setOpenForm(false); setEditing(null); }}
                          onSave={handleSave} editing={editing} currentUser={currentUser} />
      )}
      {entryStyle === 'drawer' && (
        <ExpenseFormDrawer open={openForm} onClose={() => { setOpenForm(false); setEditing(null); }}
                           onSave={handleSave} editing={editing} currentUser={currentUser} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Expense form (used by modal/drawer/inline variants)
// ════════════════════════════════════════════════════════════════
function useExpenseForm(initial) {
  const [form, setForm] = React.useState(() => ({
    expense_date: initial?.expense_date || new Date().toISOString().slice(0, 10),
    description: initial?.description || '',
    amount: initial?.amount ?? '',
    source: initial?.source || 'Winda Cash',
    category: initial?.category || '',
    toko: initial?.toko || '',
    attachment_path: initial?.attachment_path || null,
  }));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return [form, set];
}

function ExpenseFormFields({ form, set, currentUser }) {
  return (
    <div className="col gap-4">
      <div className="grid grid-2" style={{ gap: 16 }}>
        <Field label="Expense date" required help="Date expense occurred — not today">
          <input className="input" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
        </Field>
        <Field label="Amount" required help="2 decimal places, THB">
          <div className="input-affix">
            <span className="affix">฿</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount}
                   onChange={e => set('amount', e.target.value)} />
            <span className="affix right">THB</span>
          </div>
        </Field>
      </div>
      <Field label="Description" required>
        <input className="input" placeholder="e.g. Grab from Airport to Condo"
               value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>
      <div className="grid grid-2" style={{ gap: 16 }}>
        <Field label="Source" required help="Who funded this expense">
          <Select value={form.source} onChange={(v) => set('source', v)} options={SOURCES} />
        </Field>
        <Field label="Category" help="Optional">
          <Select value={form.category} onChange={(v) => set('category', v)}
                  options={[...CATEGORIES]} placeholder="— None —" />
        </Field>
      </div>
      <Field label="Store / merchant">
        <input className="input" placeholder="e.g. Lotus, Makro, KFC"
               value={form.toko} onChange={e => set('toko', e.target.value)} />
      </Field>
      <Field label="Receipt attachment" help="Optional · max 5 MB · image or PDF">
        <div className="row gap-2" style={{
            border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-sm)',
            padding: 14, justifyContent: 'center', color: 'var(--text-muted)',
            background: 'var(--bg-app)',
          }}>
          {Icon.upload()}
          <span>Drop file or <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>browse</span></span>
        </div>
      </Field>
      {form.source && sourceOwnerOf(form.source) && sourceOwnerOf(form.source) !== currentUser && (
        <div className="note-callout">
          <span className="ic">{Icon.info()}</span>
          <div>
            <strong>Loan will be auto-created.</strong><br />
            Source <strong>{form.source}</strong> belongs to {sourceOwnerOf(form.source)}.
            On submit, a loan from <strong>{sourceOwnerOf(form.source)}</strong> → <strong>{currentUser}</strong> is created for ฿{fmtTHB(Number(form.amount) || 0)}.
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseFormModal({ open, onClose, onSave, editing, currentUser }) {
  const [form, set] = useExpenseForm(editing);
  React.useEffect(() => { if (open && editing) {
    // refill on edit
    set('expense_date', editing.expense_date);
    set('description', editing.description);
    set('amount', editing.amount);
    set('source', editing.source);
    set('category', editing.category || '');
    set('toko', editing.toko || '');
  }}, [open, editing]);

  const save = () => {
    if (!form.amount || !form.description || !form.expense_date || !form.source) return;
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <Modal open={open} onClose={onClose}
           title={editing ? 'Edit expense' : 'New expense'}
           subtitle="Log a real-time expense for the Thailand fieldtrip"
           size="lg"
           footer={
             <>
               <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
               <button className="btn btn-secondary" onClick={save}>Save as draft</button>
               <button className="btn btn-primary" onClick={save}>
                 <span className="icon">{Icon.send(12)}</span> Save & Submit
               </button>
             </>
           }>
      <ExpenseFormFields form={form} set={set} currentUser={currentUser} />
    </Modal>
  );
}

function ExpenseFormDrawer({ open, onClose, onSave, editing, currentUser }) {
  const [form, set] = useExpenseForm(editing);
  React.useEffect(() => { if (open && editing) {
    set('expense_date', editing.expense_date);
    set('description', editing.description);
    set('amount', editing.amount);
    set('source', editing.source);
    set('category', editing.category || '');
    set('toko', editing.toko || '');
  }}, [open, editing]);
  const save = () => {
    if (!form.amount || !form.description) return;
    onSave({ ...form, amount: Number(form.amount) });
  };
  return (
    <Drawer open={open} onClose={onClose}
            title={editing ? 'Edit expense' : 'New expense'}
            subtitle="Log a fieldtrip expense"
            footer={
              <>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>
                  <span className="icon">{Icon.check()}</span> Save
                </button>
              </>
            }>
      <ExpenseFormFields form={form} set={set} currentUser={currentUser} />
    </Drawer>
  );
}

function InlineExpenseRow({ onCancel, onSave, currentUser }) {
  const [form, set] = useExpenseForm();
  const save = () => {
    if (!form.amount || !form.description) return;
    onSave({ ...form, amount: Number(form.amount) });
  };
  return (
    <div className="inline-row-input">
      <input className="input" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
      <input className="input" placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} autoFocus />
      <input className="input tnum" type="number" placeholder="THB" value={form.amount} onChange={e => set('amount', e.target.value)} />
      <select className="select" value={form.source} onChange={e => set('source', e.target.value)}>
        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
        <option value="">— Cat —</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="row gap-2">
        <button className="btn btn-primary btn-sm" onClick={save}>{Icon.check(12)}</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>{Icon.close(14)}</button>
      </div>
    </div>
  );
}

// Expense detail drawer
function ExpenseDetailDrawer({ expense, onClose, state, currentUser, dispatch }) {
  if (!expense) return null;
  const linkedLoan = state.loans.find(l => l.expense_id === expense.id);
  const toast = useToast();
  return (
    <Drawer open={true} onClose={onClose} title={expense.description} subtitle={`${expense.toko} · ${fmtDate(expense.expense_date)}`}>
      <div className="col gap-4">
        <div className="grid grid-2" style={{ gap: 12 }}>
          <Stat label="Amount" value={`฿${fmtTHB(expense.amount)}`} big />
          <Stat label="Status" value={<Badge kind={expense.status}>{expense.status}</Badge>} />
          <Stat label="Source" value={expense.source} />
          <Stat label="Category" value={<CategoryChip category={expense.category} />} />
          <Stat label="Recorder" value={<UserPill name={expense.recorder} />} />
          <Stat label="Created" value={fmtDateTime(expense.created_at)} />
        </div>
        {linkedLoan && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Linked loan</h3>
              <Badge kind={linkedLoan.status}>{linkedLoan.status}</Badge>
            </div>
            <div className="card-body">
              <div className="col-tight">
                <div className="row between"><span className="mute">From source owner</span><UserPill name={linkedLoan.lender} /></div>
                <div className="row between"><span className="mute">To borrower</span><UserPill name={linkedLoan.borrower} /></div>
                <div className="row between"><span className="mute">Loan amount</span><span className="bold tnum">฿{fmtTHB(linkedLoan.amount)}</span></div>
                {linkedLoan.declared_repayment != null && <div className="row between"><span className="mute">Declared repayment</span><span className="tnum">฿{fmtTHB(linkedLoan.declared_repayment)}</span></div>}
                {linkedLoan.actual_repaid > 0 && <div className="row between"><span className="mute">Repaid</span><span className="tnum">฿{fmtTHB(linkedLoan.actual_repaid)}</span></div>}
                <div className="row between"><span className="mute">Remaining</span><span className="bold tnum" style={{ color: linkedLoan.remaining_balance > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>฿{fmtTHB(linkedLoan.remaining_balance)}</span></div>
              </div>
            </div>
          </div>
        )}
        {expense.status === 'PENDING' && currentUser === 'Syaeful' && (
          <div className="row gap-3">
            <button className="btn btn-secondary btn-block" onClick={() => { dispatch({ type: 'REJECT_EXPENSE', id: expense.id }); toast({ title: 'Expense rejected', kind: 'danger' }); onClose(); }}>{Icon.close(14)} Reject</button>
            <button className="btn btn-primary btn-block" onClick={() => { dispatch({ type: 'APPROVE_EXPENSE', id: expense.id }); toast({ title: 'Expense approved', kind: 'success' }); onClose(); }}>{Icon.check(14)} Approve</button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function Stat({ label, value, big }) {
  return (
    <div style={{ background: 'var(--bg-app)', borderRadius: 'var(--r-sm)', padding: 12 }}>
      <div className="mute text-xs" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div className={big ? 'bold tnum' : 'semi'} style={{ fontSize: big ? 'var(--fs-2xl)' : 'var(--fs-base)' }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LOAN DATA — with split-tabs OR unified variants
// ════════════════════════════════════════════════════════════════
function LoanDataScreen({ state, currentUser, dispatch, loanView }) {
  const { loans, expenses } = state;
  const lent = loans.filter(l => l.lender === currentUser);
  const borrowed = loans.filter(l => l.borrower === currentUser);

  const [tab, setTab] = React.useState('lent');
  const [declareOpen, setDeclareOpen] = React.useState(null);
  const [repayOpen, setRepayOpen] = React.useState(null);

  return (
    <div className="page" data-screen-label="Loan Data">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Data</h1>
          <p className="page-subtitle">Track who owes whom · declare and record repayments</p>
        </div>
      </div>

      {/* Loan summary cards */}
      <div className="grid grid-3 section">
        <SummaryCard title="Money you lent" amount={lent.reduce((s,l)=>s+l.amount,0)}
          remaining={lent.reduce((s,l)=>s+l.remaining_balance,0)}
          count={lent.length} color="success" />
        <SummaryCard title="Money you borrowed" amount={borrowed.reduce((s,l)=>s+l.amount,0)}
          remaining={borrowed.reduce((s,l)=>s+l.remaining_balance,0)}
          count={borrowed.length} color="danger" />
        <SummaryCard title="Net position" amount={lent.reduce((s,l)=>s+l.amount,0) - borrowed.reduce((s,l)=>s+l.amount,0)}
          remaining={lent.reduce((s,l)=>s+l.remaining_balance,0) - borrowed.reduce((s,l)=>s+l.remaining_balance,0)}
          color="neutral" />
      </div>

      {loanView === 'split' ? (
        <div className="card section">
          <div className="tabs">
            <button className={tab === 'lent' ? 'active' : ''} onClick={() => setTab('lent')}>
              {Icon.arrowR(14)} Money I Lent <span className="tab-count">{lent.length}</span>
            </button>
            <button className={tab === 'borrowed' ? 'active' : ''} onClick={() => setTab('borrowed')}>
              {Icon.arrowDownRight(14)} Money I Borrowed <span className="tab-count">{borrowed.length}</span>
            </button>
          </div>
          <div className="card-body flush">
            {tab === 'lent' ? (
              <LoanTable loans={lent} role="lender" expenses={expenses} currentUser={currentUser}
                onDeclare={(l) => setDeclareOpen(l)} onRepay={(l) => setRepayOpen(l)} />
            ) : (
              <LoanTable loans={borrowed} role="borrower" expenses={expenses} currentUser={currentUser}
                onDeclare={(l) => setDeclareOpen(l)} onRepay={(l) => setRepayOpen(l)} />
            )}
          </div>
        </div>
      ) : (
        <div className="section">
          <UnifiedLoanTable loans={[...lent, ...borrowed]} currentUser={currentUser} expenses={expenses}
            onDeclare={(l) => setDeclareOpen(l)} onRepay={(l) => setRepayOpen(l)} />
        </div>
      )}

      <DeclareModal loan={declareOpen} onClose={() => setDeclareOpen(null)} dispatch={dispatch} />
      <RepayModal loan={repayOpen} onClose={() => setRepayOpen(null)} dispatch={dispatch} />
    </div>
  );
}

function SummaryCard({ title, amount, remaining, count, color }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mute text-sm semi" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{title}</div>
        <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
          <span className="bold tnum" style={{ fontSize: 'var(--fs-3xl)', letterSpacing: '-0.02em',
            color: color === 'success' ? 'var(--success-600)' : color === 'danger' ? 'var(--danger-600)' : 'var(--text-primary)' }}>
            ฿{fmtTHB(remaining)}
          </span>
          <span className="mute text-sm">remaining</span>
        </div>
        <div className="text-sm mute" style={{ marginTop: 6 }}>
          {count != null && <>{count} loans · </>}฿{fmtTHB(Math.abs(amount))} total
        </div>
      </div>
    </div>
  );
}

function LoanTable({ loans, role, expenses, currentUser, onDeclare, onRepay }) {
  if (loans.length === 0) {
    return <div className="empty">
      <div className="empty-icon">{Icon.loan(20)}</div>
      <div className="empty-title">No loans here</div>
      <div>{role === 'lender' ? 'No one currently owes you.' : "You haven't borrowed from anyone."}</div>
    </div>;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>{role === 'lender' ? 'Borrower' : 'Lender'}</th>
          <th>For</th>
          <th className="num">Loan</th>
          <th className="num">Declared</th>
          <th className="num">Repaid</th>
          <th>Progress</th>
          <th className="num">Remaining</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {loans.map(l => {
          const e = expenses.find(x => x.id === l.expense_id);
          const other = role === 'lender' ? l.borrower : l.lender;
          const pct = l.declared_repayment ? l.actual_repaid / l.declared_repayment : 0;
          return (
            <tr key={l.id}>
              <td>{e ? fmtDate(e.expense_date, { short: true }) : '—'}</td>
              <td><UserPill name={other} /></td>
              <td style={{ maxWidth: 280 }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e?.description}</div>
                <div className="text-xs mute">{e?.toko}</div>
              </td>
              <td className="num tnum">฿{fmtTHB(l.amount)}</td>
              <td className="num tnum">{l.declared_repayment != null ? `฿${fmtTHB(l.declared_repayment)}` : <span className="mute">—</span>}</td>
              <td className="num tnum">฿{fmtTHB(l.actual_repaid)}</td>
              <td>
                <div className="progress" style={{ width: 80 }}>
                  <div className="bar" style={{ width: `${pct * 100}%`, background: pct === 1 ? 'var(--success-500)' : 'var(--primary)' }} />
                </div>
              </td>
              <td className="num tnum bold" style={{ color: l.remaining_balance > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                ฿{fmtTHB(l.remaining_balance)}
              </td>
              <td><Badge kind={l.status}>{l.status.replace('_', ' ')}</Badge></td>
              <td>
                {role === 'lender' && l.remaining_balance > 0 && (
                  <div className="row gap-2 row-action" style={{ justifyContent: 'flex-end' }}>
                    {l.declared_repayment == null ? (
                      <button className="btn btn-sm btn-secondary" onClick={() => onDeclare(l)}>Declare</button>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => onRepay(l)}>{Icon.cash(12)} Record</button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function UnifiedLoanTable({ loans, currentUser, expenses, onDeclare, onRepay }) {
  const [roleFilter, setRoleFilter] = React.useState('all');
  const xs = loans.filter(l => roleFilter === 'all' ||
    (roleFilter === 'lent' && l.lender === currentUser) ||
    (roleFilter === 'borrowed' && l.borrower === currentUser));
  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <div className="btn-group">
          <button className={roleFilter === 'all' ? 'active' : ''} onClick={() => setRoleFilter('all')}>All loans <span className="text-xs mute">{loans.length}</span></button>
          <button className={roleFilter === 'lent' ? 'active' : ''} onClick={() => setRoleFilter('lent')}>I lent {loans.filter(l => l.lender === currentUser).length}</button>
          <button className={roleFilter === 'borrowed' ? 'active' : ''} onClick={() => setRoleFilter('borrowed')}>I borrowed {loans.filter(l => l.borrower === currentUser).length}</button>
        </div>
        <div className="spacer" />
        <span className="mute text-sm">Total open: ฿{fmtTHB(xs.reduce((s,l)=>s+l.remaining_balance,0))}</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Lender</th>
            <th></th>
            <th>Borrower</th>
            <th>For</th>
            <th className="num">Loan</th>
            <th className="num">Remaining</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {xs.map(l => {
            const e = expenses.find(x => x.id === l.expense_id);
            const isLender = l.lender === currentUser;
            return (
              <tr key={l.id}>
                <td>{e ? fmtDate(e.expense_date, { short: true }) : '—'}</td>
                <td><UserPill name={l.lender} /></td>
                <td>{Icon.arrowR(14)}</td>
                <td><UserPill name={l.borrower} /></td>
                <td style={{ maxWidth: 300 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e?.description}</div>
                </td>
                <td className="num tnum">฿{fmtTHB(l.amount)}</td>
                <td className="num tnum bold" style={{ color: l.remaining_balance > 0 ? 'var(--danger-600)' : 'var(--success-600)' }}>
                  ฿{fmtTHB(l.remaining_balance)}
                </td>
                <td><Badge kind={l.status}>{l.status.replace('_', ' ')}</Badge></td>
                <td>
                  {isLender && l.remaining_balance > 0 && (
                    <div className="row gap-2">
                      {l.declared_repayment == null ? (
                        <button className="btn btn-sm btn-secondary" onClick={() => onDeclare(l)}>Declare</button>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => onRepay(l)}>Record</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeclareModal({ loan, onClose, dispatch }) {
  const [amount, setAmount] = React.useState('');
  React.useEffect(() => { setAmount(loan ? String(loan.amount) : ''); }, [loan]);
  const toast = useToast();
  if (!loan) return null;
  const save = () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    dispatch({ type: 'DECLARE_REPAYMENT', id: loan.id, amount: n });
    toast({ title: 'Repayment declared', body: `${loan.borrower} will repay ฿${fmtTHB(n)} to ${loan.lender}`, kind: 'success' });
    onClose();
  };
  return (
    <Modal open={!!loan} onClose={onClose} title="Declare expected repayment"
      subtitle={`From ${loan.borrower} to ${loan.lender}`}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Save declaration</button></>}>
      <div className="col gap-4">
        <div className="card" style={{ background: 'var(--bg-app)' }}>
          <div className="card-body">
            <div className="row between"><span className="mute">Original loan</span><span className="bold tnum">฿{fmtTHB(loan.amount)}</span></div>
            <div className="row between"><span className="mute">Borrower</span><UserPill name={loan.borrower} /></div>
            <div className="row between"><span className="mute">Lender</span><UserPill name={loan.lender} /></div>
          </div>
        </div>
        <Field label="Expected repayment amount" required help="Borrower commits to repaying this much">
          <div className="input-affix">
            <span className="affix">฿</span>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
            <span className="affix right">THB</span>
          </div>
        </Field>
        <div className="note-callout">
          <span className="ic">{Icon.info()}</span>
          <div>Remaining balance = declared − repaid. The borrower can then pay it down in partial amounts.</div>
        </div>
      </div>
    </Modal>
  );
}

function RepayModal({ loan, onClose, dispatch }) {
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  React.useEffect(() => { setAmount(loan ? String(loan.remaining_balance) : ''); setNote(''); }, [loan]);
  const toast = useToast();
  if (!loan) return null;
  const save = () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    dispatch({ type: 'RECORD_REPAYMENT', id: loan.id, amount: n, note });
    toast({ title: 'Repayment recorded', body: `฿${fmtTHB(n)} from ${loan.borrower} to ${loan.lender}`, kind: 'success' });
    onClose();
  };
  const proposed = Number(amount) || 0;
  const newRepaid = loan.actual_repaid + proposed;
  const newRemaining = (loan.declared_repayment || loan.amount) - newRepaid;
  return (
    <Modal open={!!loan} onClose={onClose} title="Record actual repayment"
      subtitle={`${loan.borrower} → ${loan.lender}`}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>Record payment</button></>}>
      <div className="col gap-4">
        <div className="grid grid-3" style={{ gap: 10 }}>
          <Stat label="Declared" value={`฿${fmtTHB(loan.declared_repayment || loan.amount)}`} />
          <Stat label="Already repaid" value={`฿${fmtTHB(loan.actual_repaid)}`} />
          <Stat label="Remaining" value={`฿${fmtTHB(loan.remaining_balance)}`} />
        </div>
        <div className="grid grid-2" style={{ gap: 16 }}>
          <Field label="Repayment amount" required>
            <div className="input-affix">
              <span className="affix">฿</span>
              <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
              <span className="affix right">THB</span>
            </div>
          </Field>
          <Field label="Quick fill">
            <div className="btn-group">
              <button onClick={() => setAmount(String(loan.remaining_balance))}>Full ฿{fmtTHB(loan.remaining_balance)}</button>
              <button onClick={() => setAmount(String(Math.round(loan.remaining_balance / 2 * 100) / 100))}>Half</button>
            </div>
          </Field>
        </div>
        <Field label="Note (optional)">
          <input className="input" placeholder="e.g. Paid via PromptPay" value={note} onChange={e => setNote(e.target.value)} />
        </Field>
        <div className="card" style={{ background: 'var(--primary-tint)', borderColor: 'var(--primary-soft)' }}>
          <div className="card-body">
            <div className="row between"><span>After this payment, remaining will be:</span>
              <span className="bold tnum" style={{ fontSize: 'var(--fs-xl)', color: newRemaining <= 0 ? 'var(--success-600)' : 'var(--primary)' }}>
                ฿{fmtTHB(Math.max(0, newRemaining))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════════════════════════
function HistoryScreen({ state, currentUser }) {
  const events = React.useMemo(() => buildAuditTrail(state), [state]);
  const [filterUser, setFilterUser] = React.useState('all');
  const [filterKind, setFilterKind] = React.useState('all');

  const filtered = events.filter(e =>
    (filterUser === 'all' || e.user === filterUser) &&
    (filterKind === 'all' || e.kind.includes(filterKind))
  );

  // group by date
  const byDate = groupBy(filtered, e => e.ts.slice(0, 10));
  const dayKeys = Object.keys(byDate).sort().reverse();

  return (
    <div className="page" data-screen-label="History">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">Full audit trail · {filtered.length} events</p>
        </div>
        <div className="row gap-3">
          <Select value={filterKind} onChange={setFilterKind} options={[
            { value: 'all', label: 'All events' },
            { value: 'expense', label: 'Expense events' },
            { value: 'repayment', label: 'Repayments' },
          ]} />
          <Select value={filterUser} onChange={setFilterUser} options={[
            { value: 'all', label: 'All users' }, 'Syaeful', 'Winda', 'Dina'
          ]} />
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {dayKeys.length === 0 && <div className="empty">No events match.</div>}
          {dayKeys.map(d => (
            <div key={d}>
              <div className="timeline-day-label">{fmtDate(d, { short: false })}</div>
              <div className="timeline">
                {byDate[d].map((ev, i) => <TimelineRow key={i} event={ev} state={state} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ event, state }) {
  const e = state.expenses.find(x => x.id === event.expense_id);
  const cls = event.kind === 'expense_approved' ? 'approved' :
              event.kind === 'expense_rejected' ? 'rejected' :
              event.kind === 'expense_created' ? 'draft' : '';
  const verbs = {
    expense_created: 'created an expense',
    expense_submitted: 'submitted for approval',
    expense_approved: 'approved',
    expense_rejected: 'rejected',
    repayment: 'recorded a repayment',
  };
  return (
    <div className={`timeline-item ${cls}`}>
      <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
        <Avatar name={event.user} />
        <div style={{ flex: 1 }}>
          <div className="text-sm">
            <span className="semi">{event.user}</span> <span className="mute">{verbs[event.kind] || event.kind}</span>
            {event.detail?.description && <> · <span className="semi">{event.detail.description}</span></>}
            {event.detail?.amount && <> · <span className="tnum semi">฿{fmtTHB(event.detail.amount)}</span></>}
          </div>
          <div className="row gap-3 text-xs mute" style={{ marginTop: 4 }}>
            <span>{fmtDateTime(event.ts)}</span>
            {event.detail?.source && <span>· source: {event.detail.source}</span>}
            {event.detail?.reason && <span>· reason: {event.detail.reason}</span>}
            {event.detail?.note && <span>· “{event.detail.note}”</span>}
          </div>
        </div>
        {event.kind === 'expense_approved' && <Badge kind="APPROVED">Approved</Badge>}
        {event.kind === 'expense_rejected' && <Badge kind="REJECTED">Rejected</Badge>}
        {event.kind === 'expense_submitted' && <Badge kind="PENDING">Pending</Badge>}
        {event.kind === 'expense_created' && <Badge kind="DRAFT">Draft</Badge>}
        {event.kind === 'repayment' && <Badge kind="PARTIAL">Repayment</Badge>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
function AdminScreen({ state, dispatch }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const toast = useToast();
  return (
    <div className="page" data-screen-label="Admin">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-subtitle">User management · {state.users.length} users</p>
        </div>
        <div className="row gap-3">
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>{Icon.plus()} New user</button>
        </div>
      </div>

      <div className="grid grid-3 section">
        <Kpi label="Active users" value={state.users.filter(u => u.is_active).length} sub="of total" icon={Icon.user(18)} />
        <Kpi label="Admins" value={state.users.filter(u => u.role === 'ADMIN').length} sub="full access" icon={Icon.admin(18)} />
        <Kpi label="Managers" value={state.users.filter(u => u.role === 'MANAGER').length} sub="expense + loan CRUD" icon={Icon.user(18)} />
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th><th>Email</th><th>Role</th><th>Status</th>
              <th>Last login</th><th>Joined</th><th></th>
            </tr>
          </thead>
          <tbody>
            {state.users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="row gap-3">
                    <Avatar name={u.name} size="lg" />
                    <div>
                      <div className="semi">{u.name}</div>
                      <div className="text-xs mute">ID #{u.id}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm">{u.email}</td>
                <td><Badge kind={u.role}>{u.role}</Badge></td>
                <td><Badge kind={u.is_active ? 'ACTIVE' : 'INACTIVE'} dot>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="text-sm">{fmtRelative(u.last_login)}</td>
                <td className="text-sm">{fmtDate(u.joined)}</td>
                <td>
                  <div className="row gap-2 row-action" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => { dispatch({ type: 'TOGGLE_USER_ROLE', id: u.id }); toast({ title: `Role changed for ${u.name}`, kind: 'success' }); }}>Toggle role</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => { dispatch({ type: 'TOGGLE_USER_ACTIVE', id: u.id }); toast({ title: `${u.is_active ? 'Deactivated' : 'Activated'} ${u.name}` }); }}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New user"
        subtitle="Add a teammate to the tracker"
        footer={<><button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { toast({ title: 'User created', kind: 'success' }); setCreateOpen(false); }}>Create user</button></>}>
        <div className="col gap-4">
          <Field label="Full name" required><input className="input" placeholder="e.g. Bambang Wijaya" /></Field>
          <Field label="Email" required><input className="input" placeholder="bambang@texcoms.com" /></Field>
          <Field label="Role"><Select value="MANAGER" onChange={()=>{}} options={['ADMIN', 'MANAGER']} /></Field>
          <Field label="Temporary password" help="User will be asked to reset on first login">
            <input className="input" value="Welcome2026!" readOnly />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

// Export
Object.assign(window, {
  DashboardScreen, ListOfDataScreen, ExpenseDetailDrawer,
  LoanDataScreen, HistoryScreen, AdminScreen,
});
