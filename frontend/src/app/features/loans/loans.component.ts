import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Loan } from '@core/models';
import { fmtThb, fmtUsd, fmtIdr, fmtDate } from '@core/utils/currency.utils';

type LoanTab = 'iOwe' | 'owedToMe';
type Tone = 'accent' | 'success' | 'danger' | 'info' | 'warning' | 'neutral';

interface RepaymentForm {
  amount: number | null;
  notes: string;
}

const PERSON_TONE: Record<string, Tone> = {
  Syaeful: 'accent',
  Winda:   'danger',
  Dina:    'info',
};

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DialogModule, ButtonModule, InputNumberModule, TextareaModule, ToastModule,
    StatusBadgeComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" [life]="3500"></p-toast>

    <div class="loans-wrap">

      <!-- ── Header ──────────────────────────────────────────── -->
      <div class="loans-header">
        <div>
          <h1 class="loans-title">Loans</h1>
          <p class="loans-sub">Track money borrowed and lent within the team</p>
        </div>
        <button class="btn-repay" (click)="openRepaymentDialog(null)">
          <i class="pi pi-money-bill"></i>
          <span>Record repayment</span>
        </button>
      </div>

      <!-- ── KPI Summary ──────────────────────────────────────── -->
      <div class="kpi-row">
        <div class="kpi-card kpi-success">
          <div class="kpi-icon-wrap tone-success"><i class="pi pi-arrow-down"></i></div>
          <div class="kpi-body">
            <div class="kpi-lbl">Owed to me</div>
            <div class="kpi-thb num">{{ fmtThb(owedToMe()) }}</div>
            <div class="kpi-fx num">{{ fmtUsd(owedToMe()) }}</div>
            <div class="kpi-fx num">{{ fmtIdr(owedToMe()) }}</div>
          </div>
        </div>
        <div class="kpi-card kpi-danger">
          <div class="kpi-icon-wrap tone-danger"><i class="pi pi-arrow-up"></i></div>
          <div class="kpi-body">
            <div class="kpi-lbl">I owe</div>
            <div class="kpi-thb num text-danger">{{ fmtThb(iOwe()) }}</div>
            <div class="kpi-fx num">{{ fmtUsd(iOwe()) }}</div>
            <div class="kpi-fx num">{{ fmtIdr(iOwe()) }}</div>
          </div>
        </div>
        <div class="kpi-card" [class.kpi-success]="netPosition() >= 0" [class.kpi-danger]="netPosition() < 0">
          <div class="kpi-icon-wrap" [class.tone-success]="netPosition() >= 0" [class.tone-danger]="netPosition() < 0">
            <i class="pi" [class.pi-chart-line]="netPosition() >= 0" [class.pi-chart-bar]="netPosition() < 0"></i>
          </div>
          <div class="kpi-body">
            <div class="kpi-lbl">Net position</div>
            <div class="kpi-thb num" [class.text-success]="netPosition() >= 0" [class.text-danger]="netPosition() < 0">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtThb(netPosition()) }}
            </div>
            <div class="kpi-fx num">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtUsd(netPosition()) }}
            </div>
            <div class="kpi-fx num">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtIdr(netPosition()) }}
            </div>
          </div>
        </div>
        <div class="kpi-card kpi-accent">
          <div class="kpi-icon-wrap tone-accent"><i class="pi pi-list"></i></div>
          <div class="kpi-body">
            <div class="kpi-lbl">Open loans</div>
            <div class="kpi-thb num text-accent" style="font-size:1.6rem">{{ openLoansCount() }}</div>
            <div class="kpi-fx">active loans</div>
          </div>
        </div>
      </div>

      <!-- ── Tab Strip ────────────────────────────────────────── -->
      <div class="tab-strip">
        <button
          class="tab-btn"
          [class.tab-active-accent]="activeTab() === 'iOwe'"
          (click)="activeTab.set('iOwe')">
          <i class="pi pi-arrow-up"></i>
          <span>I owe</span>
          @if (iOweLoans().length > 0) {
            <span class="tab-badge tone-accent">{{ iOweLoans().length }}</span>
          }
        </button>
        <button
          class="tab-btn"
          [class.tab-active-success]="activeTab() === 'owedToMe'"
          (click)="activeTab.set('owedToMe')">
          <i class="pi pi-arrow-down"></i>
          <span>Owed to me</span>
          @if (owedToMeLoans().length > 0) {
            <span class="tab-badge tone-success">{{ owedToMeLoans().length }}</span>
          }
        </button>
      </div>

      <!-- ── Loan Cards ────────────────────────────────────────── -->
      <div class="loan-cards">
        @for (loan of activeLoanList(); track loan.id) {
          <div class="loan-card">
            <div class="loan-card-header">
              <div class="loan-person">
                <div class="person-avatar" [class]="'tone-' + personTone(loan)">
                  {{ personInitial(loan) }}
                </div>
                <div class="person-info">
                  <div class="person-name">{{ personName(loan) }}</div>
                  <div class="person-date">{{ fmtDate(loan.createdAt) }}</div>
                </div>
              </div>
              <app-status-badge [status]="loan.status"></app-status-badge>
            </div>

            <div class="loan-amount-block">
              <div class="loan-amount-thb num">{{ fmtThb(remaining(loan)) }}</div>
              <div class="loan-amount-fx">
                <span class="fx-pill tone-success num">{{ fmtUsd(remaining(loan)) }}</span>
                <span class="fx-pill tone-accent num">{{ fmtIdr(remaining(loan)) }}</span>
              </div>
              @if ((loan.amount ?? 0) > 0) {
                <div class="loan-progress-wrap">
                  <div class="loan-progress"
                    [style.width.%]="paidPct(loan)"
                    [class.bg-success]="loan.status === 'FULLY_SETTLED'"
                    [class.bg-accent]="loan.status !== 'FULLY_SETTLED'">
                  </div>
                </div>
                <div class="loan-progress-label">
                  <span class="num">{{ paidPct(loan) | number:'1.0-0' }}%</span> repaid
                  (<span class="num">{{ fmtThb(loan.actualRepaid ?? loan.paidAmount ?? 0) }}</span> of <span class="num">{{ fmtThb(loan.amount ?? loan.totalAmount ?? 0) }}</span>)
                </div>
              }
            </div>

            @if (loan.notes) {
              <div class="loan-notes">
                <i class="pi pi-comment"></i>
                <span>{{ loan.notes }}</span>
              </div>
            }

            @if (loan.status !== 'FULLY_SETTLED') {
              <div class="loan-actions">
                <button class="repay-btn" (click)="openRepaymentDialog(loan)">
                  <i class="pi pi-money-bill"></i>
                  <span>Record repayment</span>
                </button>
              </div>
            } @else {
              <div class="settled-badge">
                <i class="pi pi-check-circle"></i>
                <span>Fully settled</span>
              </div>
            }
          </div>
        }

        @if (activeLoanList().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="pi pi-inbox"></i></div>
            <div class="empty-text">No loans in this category</div>
            <div class="empty-sub">{{ activeTab() === 'iOwe' ? "You don't owe anyone" : 'Nobody owes you anything' }}</div>
          </div>
        }
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- Repayment Dialog                                       -->
    <!-- ══════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      header="Record repayment"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '440px', maxWidth: '94vw' }"
      appendTo="body">

      <div class="dlg-body">
        @if (selectedLoan()) {
          <div class="loan-info-box">
            <div class="lib-row">
              <span class="lib-lbl">Person</span>
              <span class="lib-val">{{ personName(selectedLoan()!) }}</span>
            </div>
            <div class="lib-row">
              <span class="lib-lbl">Remaining</span>
              <span class="lib-val lib-val-bold num">{{ fmtThb(remaining(selectedLoan()!)) }}</span>
            </div>
            <div class="lib-row">
              <span class="lib-lbl">In USD</span>
              <span class="lib-val num">{{ fmtUsd(remaining(selectedLoan()!)) }}</span>
            </div>
            <div class="lib-row">
              <span class="lib-lbl">In IDR</span>
              <span class="lib-val num">{{ fmtIdr(remaining(selectedLoan()!)) }}</span>
            </div>
          </div>
        }
        <div class="dlg-form-grp">
          <label class="dlg-lbl">Repayment amount (THB) <span class="req">*</span></label>
          <p-inputnumber
            [(ngModel)]="repayForm.amount"
            mode="decimal"
            [minFractionDigits]="2"
            [maxFractionDigits]="2"
            placeholder="0.00"
            styleClass="w-full">
          </p-inputnumber>
          @if (repayForm.amount && repayForm.amount > 0) {
            <div class="preview-row">
              <span class="prev-pill tone-success num">≈ {{ fmtUsd(repayForm.amount) }}</span>
              <span class="prev-pill tone-accent  num">≈ {{ fmtIdr(repayForm.amount) }}</span>
            </div>
          }
        </div>
        <div class="dlg-form-grp">
          <label class="dlg-lbl">Notes (optional)</label>
          <textarea
            class="dlg-textarea"
            [(ngModel)]="repayForm.notes"
            placeholder="e.g. Paid via cash, GrabPay…"
            rows="3">
          </textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button class="dlg-cancel-btn" (click)="closeDialog()">Cancel</button>
        <button class="dlg-save-btn" (click)="saveRepayment()" [disabled]="!isRepayFormValid()">
          <i class="pi pi-check"></i>
          <span>Record repayment</span>
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    /* Page gutter (6rem top / 2rem sides) comes from the Sakai layout container;
       the page only centers its content. */
    .loans-wrap { max-width: 1400px; margin: 0 auto; }
    .loans-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .loans-title { font-size: 1.5rem; font-weight: 800; color: var(--text); margin: 0; letter-spacing: -0.02em; }
    .loans-sub   { font-size: 0.8rem; color: var(--text-subtle); margin: 4px 0 0; }
    .btn-repay {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: var(--radius);
      background: var(--accent); color: #fff; font-size: 0.875rem; font-weight: 600;
      border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      transition: background 0.15s; font-family: inherit;
    }
    .btn-repay:hover { background: var(--accent-hover); }

    .kpi-row {
      display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px;
    }
    @media (max-width: 1000px) { .kpi-row { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px)  { .kpi-row { grid-template-columns: 1fr; } }

    .kpi-card {
      background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border);
      border-left: 3px solid var(--border);
      padding: 18px 16px;
      display: flex; gap: 12px; align-items: flex-start;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.18s;
    }
    .kpi-card:hover { box-shadow: var(--shadow); }
    .kpi-success { border-left-color: var(--success); }
    .kpi-danger  { border-left-color: var(--danger); }
    .kpi-accent  { border-left-color: var(--accent); }
    .kpi-icon-wrap {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .kpi-body  { flex: 1; min-width: 0; }
    .kpi-lbl   { font-size: 0.65rem; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
    .kpi-thb   { font-size: 1.3rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
    .kpi-fx    { font-size: 0.7rem; color: var(--text-faint); margin-top: 2px; }

    .tab-strip { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
    .tab-btn {
      padding: 10px 16px; border: none; border-bottom: 2px solid transparent;
      background: transparent; font-size: 0.875rem; font-weight: 600;
      color: var(--text-subtle);
      cursor: pointer; transition: color 0.15s, border-color 0.15s; display: inline-flex; align-items: center; gap: 8px;
      margin-bottom: -1px; font-family: inherit;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-active-accent  { color: var(--accent);  border-bottom-color: var(--accent); }
    .tab-active-success { color: var(--success); border-bottom-color: var(--success); }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 6px;
      border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    }

    .loan-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; }
    .loan-card {
      background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border);
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
      box-shadow: var(--shadow-sm); transition: box-shadow 0.18s, transform 0.18s;
    }
    .loan-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
    .loan-card-header { display: flex; align-items: center; justify-content: space-between; }
    .loan-person { display: flex; align-items: center; gap: 10px; }
    .person-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .person-name { font-size: 0.9rem; font-weight: 700; color: var(--text); }
    .person-date { font-size: 0.68rem; color: var(--text-faint); margin-top: 1px; }

    .loan-amount-block { display: flex; flex-direction: column; gap: 5px; }
    .loan-amount-thb   { font-size: 1.8rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
    .loan-amount-fx    { display: flex; gap: 8px; flex-wrap: wrap; }
    .fx-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }

    .loan-progress-wrap { height: 5px; background: var(--surface-sunken); border-radius: 999px; overflow: hidden; margin-top: 6px; }
    .loan-progress      { height: 100%; border-radius: 999px; transition: width 0.45s ease; }
    .bg-accent  { background: var(--accent); }
    .bg-success { background: var(--success); }
    .loan-progress-label { font-size: 0.68rem; color: var(--text-faint); margin-top: 3px; }

    .loan-notes {
      display: flex; gap: 8px; align-items: flex-start;
      font-size: 0.78rem; color: var(--text-subtle);
      background: var(--surface-muted); border-radius: var(--radius-sm);
      padding: 8px 12px; border: 1px solid var(--surface-sunken);
    }
    .loan-notes i { color: var(--text-faint); padding-top: 2px; }

    .repay-btn {
      width: 100%; padding: 9px; border-radius: var(--radius-sm);
      background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-soft);
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .repay-btn:hover { background: var(--accent); color: #fff; }

    .settled-badge {
      text-align: center; font-size: 0.82rem; font-weight: 600; color: var(--success);
      background: var(--success-soft); border-radius: var(--radius-sm); padding: 8px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }

    .empty-state { text-align: center; padding: 60px 24px; grid-column: 1 / -1; }
    .empty-icon  { font-size: 2.5rem; margin-bottom: 12px; color: var(--text-faint); }
    .empty-text  { font-size: 1rem; font-weight: 700; color: var(--text-muted); }
    .empty-sub   { font-size: 0.82rem; color: var(--text-faint); margin-top: 6px; }

    .dlg-body { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .loan-info-box {
      background: var(--surface-muted); border-radius: var(--radius-sm); border: 1px solid var(--border);
      padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
    }
    .lib-row       { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .lib-lbl       { font-size: 0.75rem; color: var(--text-faint); font-weight: 600; }
    .lib-val       { font-size: 0.84rem; color: var(--text); font-weight: 500; }
    .lib-val-bold  { font-weight: 800; font-size: 1rem; }
    .dlg-form-grp  { display: flex; flex-direction: column; gap: 6px; }
    .dlg-lbl       { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
    .req           { color: var(--danger); }
    .dlg-textarea {
      width: 100%; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.875rem; font-family: inherit; color: var(--text);
      background: var(--surface); outline: none; resize: vertical;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .dlg-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .preview-row { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .prev-pill   { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }

    .dlg-cancel-btn {
      padding: 9px 18px; border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 600;
      background: var(--surface); color: var(--text-muted); border: 1px solid var(--border);
      cursor: pointer; font-family: inherit; transition: background 0.15s;
    }
    .dlg-cancel-btn:hover { background: var(--surface-muted); }

    .dlg-save-btn {
      padding: 9px 18px; border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 600;
      background: var(--accent); color: #fff; border: none; cursor: pointer;
      font-family: inherit; box-shadow: 0 4px 12px rgba(37,99,235,0.25);
      transition: background 0.15s;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .dlg-save-btn:hover:not(:disabled) { background: var(--accent-hover); }
    .dlg-save-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

    /* ── Mobile polish ───────────────────────────────────────── */
    @media (max-width: 640px) {
      .loans-header { flex-direction: column; align-items: stretch; }
      .btn-repay { justify-content: center; }
      /* Cards must not demand 300px on a ~360px phone (would overflow after gutters). */
      .loan-cards { grid-template-columns: 1fr; }
      .loan-card { padding: 16px; }
      .loan-amount-thb { font-size: 1.5rem; }
      /* Tabs scroll instead of overflowing. */
      .tab-strip { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .tab-btn { white-space: nowrap; }
    }
  `]
})
export class LoansComponent implements OnInit {
  private svc    = inject(MockDataService);
  private auth   = inject(AuthService);
  private msgSvc = inject(MessageService);

  protected fmtThb  = fmtThb;
  protected fmtUsd  = fmtUsd;
  protected fmtIdr  = fmtIdr;
  protected fmtDate = fmtDate;

  private currentUserId = signal<number | null>(null);

  // Live data — direct read from store
  protected allLoans      = this.svc.loans;
  protected activeTab     = signal<LoanTab>('iOwe');
  protected dialogVisible = signal(false);
  protected selectedLoan  = signal<Loan | null>(null);

  protected repayForm: RepaymentForm = { amount: null, notes: '' };

  protected iOweLoans      = computed(() => this.allLoans().filter(l => l.borrowerId === this.currentUserId()));
  protected owedToMeLoans  = computed(() => this.allLoans().filter(l => l.lenderId   === this.currentUserId()));
  protected activeLoanList = computed(() => this.activeTab() === 'iOwe' ? this.iOweLoans() : this.owedToMeLoans());

  protected owedToMe = computed(() =>
    this.owedToMeLoans().filter(l => l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0)
  );
  protected iOwe = computed(() =>
    this.iOweLoans().filter(l => l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0)
  );
  protected netPosition    = computed(() => this.owedToMe() - this.iOwe());
  protected openLoansCount = computed(() => this.allLoans().filter(l => l.status !== 'FULLY_SETTLED').length);

  ngOnInit(): void {
    this.currentUserId.set(this.auth.getCurrentUser()?.id ?? null);
  }

  openRepaymentDialog(loan: Loan | null): void {
    this.selectedLoan.set(loan);
    this.repayForm = { amount: null, notes: '' };
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedLoan.set(null);
  }

  isRepayFormValid(): boolean {
    return !!(this.repayForm.amount && this.repayForm.amount > 0);
  }

  saveRepayment(): void {
    if (!this.isRepayFormValid()) return;
    const amount = this.repayForm.amount ?? 0;
    const loan = this.selectedLoan();

    if (!loan || loan.id == null) {
      this.msgSvc.add({ severity: 'warn', summary: 'No loan selected', detail: 'Please choose a loan to repay.' });
      return;
    }

    this.svc.recordRepayment(loan.id, amount, this.repayForm.notes);

    const updated = this.svc.loans().find(l => l.id === loan.id);
    const fullySettled = updated?.status === 'FULLY_SETTLED';
    const remaining = updated?.remainingBalance ?? 0;

    this.msgSvc.add({
      severity: 'success',
      summary: fullySettled ? 'Fully settled' : 'Repayment recorded',
      detail: `${fmtThb(amount)} recorded${fullySettled ? ' — loan fully settled.' : ` · ${fmtThb(remaining)} remaining`}`,
    });
    this.closeDialog();
  }

  remaining(loan: Loan): number { return loan.remainingBalance ?? loan.amount ?? 0; }

  paidPct(loan: Loan): number {
    const total = loan.amount ?? loan.totalAmount ?? 0;
    if (total <= 0) return 0;
    return Math.min(100, ((loan.actualRepaid ?? loan.paidAmount ?? 0) / total) * 100);
  }

  personName(loan: Loan): string {
    const id = this.activeTab() === 'iOwe' ? loan.lenderId : loan.borrowerId;
    return this.svc.getUserById(id ?? -1)?.name ?? loan.personName ?? '—';
  }

  personInitial(loan: Loan): string { return this.personName(loan).charAt(0).toUpperCase(); }

  personTone(loan: Loan): Tone {
    return PERSON_TONE[this.personName(loan)] ?? 'neutral';
  }
}
