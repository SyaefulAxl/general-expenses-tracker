// New Expense modal — the "killer moment".
// When the user picks a SOURCE owned by someone else, the modal instantly shows
// a live preview of the loan that will be auto-created on the lender's dashboard.

function ExpenseModal({ state, dispatch, onClose, fxCur }) {
  const me = lookup.user(state.currentUserId);
  const { SOURCES, PROJECTS, CATEGORIES, COST_CENTERS, FX } = window.AppData;
  const today = '2025-05-07';

  const [form, setForm] = useState({
    expense_date: today,
    amountTHB: '',
    categoryId: 3,
    projectId: 1,
    costCenterId: 1,
    sourceId: 'syaeful-cash',
    description: '',
    attachment: null,
  });
  const [step, setStep] = useState('form'); // form | submitting | done

  const source = lookup.source(form.sourceId);
  const owner = source ? lookup.user(source.ownerId) : null;
  const isOthersMoney = owner && owner.id !== me.id && !owner.system;
  const amt = parseFloat(form.amountTHB) || 0;

  const submit = (asDraft = false) => {
    if (!amt) return;
    setStep('submitting');
    setTimeout(() => {
      dispatch({
        type: 'ADD_EXPENSE',
        expense: {
          ...form,
          amountTHB: amt,
          status: asDraft ? 'DRAFT' : 'PENDING',
          recorderId: me.id,
        }
      });
      setStep('done');
      setTimeout(() => { onClose(); }, 1100);
    }, 450);
  };

  if (step === 'done') {
    return (
      <Modal title="Expense recorded" onClose={onClose} width={520}>
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--positive-bg)', color: 'var(--positive)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Ico.Check s={26}/>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            ฿{fmt.thb(amt)} {isOthersMoney ? `borrowed from ${owner.short}` : 'logged'}
          </div>
          {isOthersMoney && (
            <div style={{ marginTop: 6, color: 'var(--ink-3)', fontSize: 12.5 }}>
              A loan record was created on {owner.short}'s dashboard.
            </div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="New expense"
      sub={`Logged in as ${me.name} · Thailand fieldtrip`}
      onClose={onClose}
      width={760}
      footer={
        <Fragment>
          <div className="muted tx-xs">
            All amounts in THB. IDR-equivalent locked at {FX.THB_TO_IDR} per ฿1.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={!amt} onClick={() => submit(true)}>Save as draft</button>
            <button className="btn primary" disabled={!amt} onClick={() => submit(false)}>
              {step === 'submitting' ? 'Saving…' : 'Submit for approval'}
            </button>
          </div>
        </Fragment>
      }
    >
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Expense date" required hint="When the spend actually happened — not today's date">
          <input type="date" className="input" value={form.expense_date}
                 onChange={e => setForm({ ...form, expense_date: e.target.value })}/>
        </Field>
        <Field label="Amount" required hint={amt ? `≈ Rp ${fmt.idr(amt)} · $${fmt.usd(amt)}` : 'Enter THB'}>
          <MoneyInput value={form.amountTHB} onChange={(v) => setForm({ ...form, amountTHB: v })}/>
        </Field>

        <Field label="Project" required>
          <Select value={form.projectId} onChange={(v) => setForm({ ...form, projectId: parseInt(v) })}>
            {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
          </Select>
        </Field>
        <Field label="Cost center" required>
          <Select value={form.costCenterId} onChange={(v) => setForm({ ...form, costCenterId: parseInt(v) })}>
            {COST_CENTERS.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </Select>
        </Field>

        <Field label="Category" required>
          <Select value={form.categoryId} onChange={(v) => setForm({ ...form, categoryId: parseInt(v) })}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>

        <Field label="Source of funds" required hint="Who's wallet/card was used to pay">
          <Select value={form.sourceId} onChange={(v) => setForm({ ...form, sourceId: v })}>
            <optgroup label="My funds">
              {SOURCES.filter(s => s.ownerId === me.id).map(s => (
                <option key={s.id} value={s.id}>{s.label} ({s.kind})</option>
              ))}
            </optgroup>
            <optgroup label="Teammates' funds (creates a loan)">
              {SOURCES.filter(s => s.ownerId !== me.id && !lookup.user(s.ownerId).system).map(s => (
                <option key={s.id} value={s.id}>{s.label} ({s.kind})</option>
              ))}
            </optgroup>
            <optgroup label="Corporate">
              {SOURCES.filter(s => lookup.user(s.ownerId).system).map(s => (
                <option key={s.id} value={s.id}>{s.label} ({s.kind})</option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </div>

      <div style={{ marginTop: 14 }}>
        <Field label="Description" hint="Be specific — useful at audit time">
          <textarea className="textarea" rows={2} placeholder="e.g. Grab from Asok BTS to client office, single rider"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}/>
        </Field>
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, border: '1px dashed var(--line-2)', borderRadius: 5, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-tint)' }}>
          <Ico.Receipt s={16}/>
          <div>
            <div className="tx-sm" style={{ fontWeight: 600 }}>Attach receipt</div>
            <div className="muted tx-xs">Drop image or PDF · max 5MB</div>
          </div>
          <div className="spacer"/>
          <button className="btn sm ghost">Browse…</button>
        </div>
      </div>

      {/* THE KILLER MOMENT — auto-loan preview */}
      {isOthersMoney && (
        <div className="loan-alert">
          <div className="la-ico"><Ico.Handoff s={16}/></div>
          <div className="la-body">
            <h4>This will create a loan automatically</h4>
            <p>
              <b>{owner.short}</b> is funding this expense. A loan of <b>฿{fmt.thb(amt || 0)}</b>
              {' '}({fxCur === 'IDR' ? 'Rp ' + fmt.idr(amt || 0) : '$' + fmt.usd(amt || 0)})
              {' '}will be opened with <b>{owner.short}</b> as lender and <b>you</b> as borrower —
              and it will appear on {owner.short}'s "Money I Lent" dashboard the moment you submit.
            </p>
            <div className="la-arrow">
              <span><Avatar user={me}/></span>
              <Ico.Arrow s={12}/>
              <span><Avatar user={owner}/></span>
              <span className="muted">{owner.short} ledger updates live.</span>
            </div>
          </div>
        </div>
      )}

      {/* Lender-side mirror preview — shows what Winda/Dina will see */}
      {isOthersMoney && amt > 0 && (
        <div className="lender-preview" style={{ marginTop: 12 }}>
          <span className="lp-tag">As {owner.short} will see it</span>
          <div className="lp-screen">
            <Avatar user={me} size="lg"/>
            <div style={{ flex: 1 }}>
              <div className="tx-sm" style={{ fontWeight: 600 }}>
                You lent <b>{me.short}</b> <span style={{ color: 'var(--ink)' }}>฿{fmt.thb(amt)}</span>
              </div>
              <div className="muted tx-xs">
                {form.description ? `for "${form.description.slice(0, 60)}"` : 'just now'} · ≈ {fxCur === 'IDR' ? 'Rp ' + fmt.idr(amt) : '$' + fmt.usd(amt)}
              </div>
            </div>
            <StatusBadge status="UNSETTLED"/>
            <button className="btn sm primary" disabled>Record repayment</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { ExpenseModal });
