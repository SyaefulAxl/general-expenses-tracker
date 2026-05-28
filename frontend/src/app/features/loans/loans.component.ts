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

interface RepaymentForm {
  amount: number | null;
  notes: string;
}

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
          <span>💰</span> Record Repayment
        </button>
      </div>

      <!-- ── KPI Summary ──────────────────────────────────────── -->
      <div class="kpi-row">
        <div class="kpi-card kpi-green">
          <div class="kpi-icon">💚</div>
          <div class="kpi-body">
            <div class="kpi-lbl">Owed to Me</div>
            <div class="kpi-thb">{{ fmtThb(owedToMe()) }}</div>
            <div class="kpi-fx">{{ fmtUsd(owedToMe()) }}</div>
            <div class="kpi-fx">{{ fmtIdr(owedToMe()) }}</div>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">❤️</div>
          <div class="kpi-body">
            <div class="kpi-lbl">I Owe</div>
            <div class="kpi-thb" style="color:#dc2626">{{ fmtThb(iOwe()) }}</div>
            <div class="kpi-fx">{{ fmtUsd(iOwe()) }}</div>
            <div class="kpi-fx">{{ fmtIdr(iOwe()) }}</div>
          </div>
        </div>
        <div class="kpi-card"
          [style.border-left-color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
          <div class="kpi-icon">{{ netPosition() >= 0 ? '📈' : '📉' }}</div>
          <div class="kpi-body">
            <div class="kpi-lbl">Net Position</div>
            <div class="kpi-thb" [style.color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtThb(netPosition()) }}
            </div>
            <div class="kpi-fx" [style.color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtUsd(netPosition()) }}
            </div>
            <div class="kpi-fx" [style.color]="netPosition() >= 0 ? '#059669' : '#dc2626'">
              {{ netPosition() >= 0 ? '+' : '' }}{{ fmtIdr(netPosition()) }}
            </div>
          </div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon">📋</div>
          <div class="kpi-body">
            <div class="kpi-lbl">Open Loans</div>
            <div class="kpi-thb" style="color:#2563eb; font-size:2rem;">{{ openLoansCount() }}</div>
            <div class="kpi-fx">active loans</div>
          </div>
        </div>
      </div>

      <!-- ── Tab Strip ────────────────────────────────────────── -->
      <div class="tab-strip">
        <button
          class="tab-btn"
          [style.color]="activeTab() === 'iOwe' ? '#2563eb' : '#64748b'"
          [style.border-bottom-color]="activeTab() === 'iOwe' ? '#2563eb' : 'transparent'"
          (click)="activeTab.set('iOwe')">
          ↑ I Owe
          @if (iOweLoans().length > 0) {
            <span class="tab-badge">{{ iOweLoans().length }}</span>
          }
        </button>
        <button
          class="tab-btn"
          [style.color]="activeTab() === 'owedToMe' ? '#059669' : '#64748b'"
          [style.border-bottom-color]="activeTab() === 'owedToMe' ? '#059669' : 'transparent'"
          (click)="activeTab.set('owedToMe')">
          ↓ Owed to Me
          @if (owedToMeLoans().length > 0) {
            <span class="tab-badge" style="background:#f0fdf4;color:#059669">{{ owedToMeLoans().length }}</span>
          }
        </button>
      </div>

      <!-- ── Loan Cards ────────────────────────────────────────── -->
      <div class="loan-cards">
        @for (loan of activeLoanList(); track loan.id) {
          <div class="loan-card">
            <div class="loan-card-header">
              <div class="loan-person">
                <div class="person-avatar" [style.background]="personColor(loan)">
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
              <div class="loan-amount-thb">{{ fmtThb(remaining(loan)) }}</div>
              <div class="loan-amount-fx">
                <span class="fx-pill fx-usd">{{ fmtUsd(remaining(loan)) }}</span>
                <span class="fx-pill fx-idr">{{ fmtIdr(remaining(loan)) }}</span>
              </div>
              @if ((loan.amount ?? 0) > 0) {
                <div class="loan-progress-wrap">
                  <div class="loan-progress"
                    [style.width.%]="paidPct(loan)"
                    [style.background]="loan.status === 'FULLY_SETTLED' ? '#059669' : '#2563eb'">
                  </div>
                </div>
                <div class="loan-progress-label">
                  {{ paidPct(loan) | number:'1.0-0' }}% repaid
                  ({{ fmtThb(loan.actualRepaid ?? loan.paidAmount ?? 0) }} of {{ fmtThb(loan.amount ?? loan.totalAmount ?? 0) }})
                </div>
              }
            </div>

            @if (loan.notes) {
              <div class="loan-notes">📝 {{ loan.notes }}</div>
            }

            @if (loan.status !== 'FULLY_SETTLED') {
              <div class="loan-actions">
                <button class="repay-btn" (click)="openRepaymentDialog(loan)">
                  💰 Record Repayment
                </button>
              </div>
            } @else {
              <div class="settled-badge">✅ Fully Settled</div>
            }
          </div>
        }

        @if (activeLoanList().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🤝</div>
            <div class="empty-text">No loans in this category</div>
            <div class="empty-sub">{{ activeTab() === 'iOwe' ? "You don't owe anyone" : "Nobody owes you anything" }}</div>
          </div>
        }
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════ -->
    <!-- Repayment Dialog                                      -->
    <!-- ══════════════════════════════════════════════════════ -->
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      header="Record Repayment"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '440px' }"
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
              <span class="lib-val lib-val-bold">{{ fmtThb(remaining(selectedLoan()!)) }}</span>
            </div>
            <div class="lib-row">
              <span class="lib-lbl">In USD</span>
              <span class="lib-val">{{ fmtUsd(remaining(selectedLoan()!)) }}</span>
            </div>
            <div class="lib-row">
              <span class="lib-lbl">In IDR</span>
              <span class="lib-val">{{ fmtIdr(remaining(selectedLoan()!)) }}</span>
            </div>
          </div>
        }
        <div class="dlg-form-grp">
          <label class="dlg-lbl">Repayment Amount (THB) <span class="req">*</span></label>
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
              <span class="prev-pill prev-usd">≈ {{ fmtUsd(repayForm.amount) }}</span>
              <span class="prev-pill prev-idr">≈ {{ fmtIdr(repayForm.amount) }}</span>
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
          💰 Record Repayment
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-dialog {
      background: #ffffff !important; border: 1px solid #e2e8f0 !important;
      border-radius: 14px !important; box-shadow: 0 25px 60px rgba(0,0,0,0.2) !important;
      overflow: hidden !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-header {
      background: #ffffff !important; border-bottom: 1px solid #e2e8f0 !important;
      padding: 18px 22px !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-header .p-dialog-title {
      font-weight: 700 !important; font-size: 1rem !important; color: #0f172a !important;
    }
    :host ::ng-deep .p-dialog .p-dialog-content { background: #ffffff !important; padding: 0 !important; }
    :host ::ng-deep .p-dialog .p-dialog-footer {
      background: #f8fafc !important; border-top: 1px solid #e2e8f0 !important; padding: 0 !important;
    }
    :host ::ng-deep .p-dialog-mask {
      background: rgba(15,23,42,0.55) !important; backdrop-filter: blur(4px) !important;
    }

    .loans-wrap { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .loans-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .loans-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
    .loans-sub   { font-size: 0.8rem; color: #64748b; margin: 4px 0 0; }
    .btn-repay {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px;
      background: #059669; color: #fff; font-size: 0.875rem; font-weight: 700;
      border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(5,150,105,0.3);
      transition: background 0.15s; font-family: inherit;
    }
    .btn-repay:hover { background: #047857; }

    .kpi-row {
      display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px;
    }
    @media (max-width: 1000px) { .kpi-row { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 600px)  { .kpi-row { grid-template-columns: 1fr; } }

    .kpi-card {
      background: #ffffff; border-radius: 14px; border: 1.5px solid #e2e8f0;
      border-left-width: 3px; padding: 18px 16px;
      display: flex; gap: 12px; align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
    .kpi-green { border-left-color: #059669; }
    .kpi-red   { border-left-color: #dc2626; }
    .kpi-blue  { border-left-color: #2563eb; }
    .kpi-icon  { font-size: 1.4rem; }
    .kpi-body  { flex: 1; }
    .kpi-lbl   { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
    .kpi-thb   { font-size: 1.3rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .kpi-fx    { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }

    .tab-strip { display: flex; gap: 2px; border-bottom: 2px solid #e2e8f0; margin-bottom: 20px; }
    .tab-btn {
      padding: 10px 20px; border: none; border-bottom: 3px solid transparent;
      background: transparent; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 8px;
      margin-bottom: -2px; border-radius: 8px 8px 0 0; font-family: inherit;
    }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 6px;
      background: #fee2e2; color: #dc2626;
      border-radius: 999px; font-size: 0.65rem; font-weight: 700;
    }

    .loan-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; }
    .loan-card {
      background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: box-shadow 0.2s;
    }
    .loan-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
    .loan-card-header { display: flex; align-items: center; justify-content: space-between; }
    .loan-person { display: flex; align-items: center; gap: 10px; }
    .person-avatar {
      width: 38px; height: 38px; border-radius: 50%; color: #fff;
      font-size: 0.9rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .person-name { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    .person-date { font-size: 0.68rem; color: #94a3b8; margin-top: 1px; }
    .loan-amount-block { display: flex; flex-direction: column; gap: 5px; }
    .loan-amount-thb   { font-size: 1.8rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .loan-amount-fx    { display: flex; gap: 8px; }
    .fx-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .fx-usd  { background: #f0fdf4; color: #059669; }
    .fx-idr  { background: #eff6ff; color: #1d4ed8; }
    .loan-progress-wrap { height: 5px; background: #f1f5f9; border-radius: 999px; overflow: hidden; margin-top: 6px; }
    .loan-progress      { height: 100%; border-radius: 999px; transition: width 0.5s; }
    .loan-progress-label { font-size: 0.68rem; color: #94a3b8; margin-top: 3px; }
    .loan-notes { font-size: 0.78rem; color: #64748b; background: #f8fafc; border-radius: 8px; padding: 8px 12px; border: 1px solid #f1f5f9; }
    .repay-btn {
      width: 100%; padding: 10px; border-radius: 8px;
      background: #eff6ff; color: #2563eb; border: 1.5px solid #bfdbfe;
      font-size: 0.85rem; font-weight: 700; cursor: pointer;
      transition: all 0.15s; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .repay-btn:hover { background: #dbeafe; }
    .settled-badge { text-align: center; font-size: 0.82rem; font-weight: 700; color: #059669; background: #f0fdf4; border-radius: 8px; padding: 8px; border: 1px solid #a7f3d0; }
    .empty-state { text-align: center; padding: 60px 24px; }
    .empty-icon  { font-size: 2.5rem; margin-bottom: 12px; }
    .empty-text  { font-size: 1rem; font-weight: 700; color: #334155; }
    .empty-sub   { font-size: 0.82rem; color: #94a3b8; margin-top: 6px; }

    .dlg-body { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .loan-info-box {
      background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;
      padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;
    }
    .lib-row       { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .lib-lbl       { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .lib-val       { font-size: 0.84rem; color: #0f172a; font-weight: 500; }
    .lib-val-bold  { font-weight: 800; font-size: 1rem; }
    .dlg-form-grp  { display: flex; flex-direction: column; gap: 6px; }
    .dlg-lbl       { font-size: 0.78rem; font-weight: 600; color: #334155; }
    .req           { color: #dc2626; }
    .dlg-textarea {
      width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; font-family: inherit; color: #0f172a;
      background: #ffffff; outline: none; resize: vertical;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .dlg-textarea:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .preview-row { display: flex; gap: 8px; margin-top: 4px; }
    .prev-pill   { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .prev-usd    { background: #f0fdf4; color: #059669; }
    .prev-idr    { background: #eff6ff; color: #1d4ed8; }
    .dlg-cancel-btn {
      padding: 9px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 700;
      background: #f1f5f9; color: #334155; border: 1.5px solid #e2e8f0;
      cursor: pointer; font-family: inherit; transition: all 0.15s;
      margin: 12px 4px 12px 12px;
    }
    .dlg-cancel-btn:hover { background: #e2e8f0; }
    .dlg-save-btn {
      padding: 9px 20px; border-radius: 8px; font-size: 0.875rem; font-weight: 700;
      background: #059669; color: #fff; border: none; cursor: pointer;
      font-family: inherit; box-shadow: 0 4px 12px rgba(5,150,105,0.3);
      transition: all 0.15s; margin: 12px 12px 12px 4px;
    }
    .dlg-save-btn:hover:not(:disabled) { background: #047857; }
    .dlg-save-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
  `]
})
export class LoansComponent implements OnInit {
  private svc    = inject(MockDataService);
  private auth   = inject(AuthService);
  private msgSvc = inject(MessageService);

  fmtThb  = fmtThb;
  fmtUsd  = fmtUsd;
  fmtIdr  = fmtIdr;
  fmtDate = fmtDate;

  private currentUserId = signal<number | null>(null);

  // Live data — direct read from store
  allLoans      = this.svc.loans;
  activeTab     = signal<LoanTab>('iOwe');
  dialogVisible = signal(false);
  selectedLoan  = signal<Loan | null>(null);

  repayForm: RepaymentForm = { amount: null, notes: '' };

  iOweLoans      = computed(() => this.allLoans().filter(l => l.borrowerId === this.currentUserId()));
  owedToMeLoans  = computed(() => this.allLoans().filter(l => l.lenderId   === this.currentUserId()));
  activeLoanList = computed(() => this.activeTab() === 'iOwe' ? this.iOweLoans() : this.owedToMeLoans());

  owedToMe = computed(() =>
    this.owedToMeLoans().filter(l => l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0)
  );
  iOwe = computed(() =>
    this.iOweLoans().filter(l => l.status !== 'FULLY_SETTLED')
      .reduce((s, l) => s + (l.remainingBalance ?? l.amount ?? 0), 0)
  );
  netPosition    = computed(() => this.owedToMe() - this.iOwe());
  openLoansCount = computed(() => this.allLoans().filter(l => l.status !== 'FULLY_SETTLED').length);

  ngOnInit() {
    this.currentUserId.set(this.auth.getCurrentUser()?.id ?? null);
  }

  openRepaymentDialog(loan: Loan | null) {
    this.selectedLoan.set(loan);
    this.repayForm = { amount: null, notes: '' };
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
    this.selectedLoan.set(null);
  }

  isRepayFormValid(): boolean {
    return !!(this.repayForm.amount && this.repayForm.amount > 0);
  }

  saveRepayment() {
    if (!this.isRepayFormValid()) return;
    const amount = this.repayForm.amount ?? 0;
    const loan = this.selectedLoan();

    if (!loan || loan.id == null) {
      this.msgSvc.add({ severity: 'warn', summary: 'No Loan Selected', detail: 'Please choose a loan to repay.' });
      return;
    }

    this.svc.recordRepayment(loan.id, amount, this.repayForm.notes);

    // Re-read the loan after update to determine outcome
    const updated = this.svc.loans().find(l => l.id === loan.id);
    const fullySettled = updated?.status === 'FULLY_SETTLED';
    const remaining = updated?.remainingBalance ?? 0;

    this.msgSvc.add({
      severity: 'success',
      summary: fullySettled ? '✅ Fully Settled!' : '💰 Repayment Recorded',
      detail: `${fmtThb(amount)} recorded${fullySettled ? ' — loan fully settled!' : ` · ${fmtThb(remaining)} remaining`}`,
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

  personColor(loan: Loan): string {
    const map: Record<string, string> = { Syaeful: '#7c3aed', Winda: '#db2777', Dina: '#0891b2' };
    return map[this.personName(loan)] ?? '#64748b';
  }
}
