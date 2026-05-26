import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MockDataService } from '@core/services/mock-data.service';
import { Loan } from '@core/models';

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtThb(v: number): string {
  return '\u0024' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CURRENT_USER_ID = 1; // Syaeful

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    TagModule,
    ProgressBarModule,
    AvatarComponent,
    StatusBadgeComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="loans-wrap">

      <!-- ── Page header ──────────────────────────────────────────────── -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Loan Data</h1>
          <p class="page-sub">Thailand Expenses Tracker</p>
        </div>
        <button pButton type="button" label="Record Repayment" class="p-button-primary" icon="pi pi-plus" (click)="openRepaymentDialog()"></button>
      </header>

      <!-- ── Summary cards ───────────────────────────────────────────── -->
      <div class="summary-cards">
        <div class="summary-card card-owed">
          <span class="card-label">Owed to me</span>
          <span class="card-value positive">{{ fmtThb(owedToMe()) }}</span>
        </div>
        <div class="summary-card card-owe">
          <span class="card-label">I owe</span>
          <span class="card-value negative">{{ fmtThb(iOwe()) }}</span>
        </div>
        <div class="summary-card" [class.card-positive]="netPosition() >= 0" [class.card-negative]="netPosition() < 0">
          <span class="card-label">Net position</span>
          <span class="card-value">{{ fmtThb(netPosition()) }}</span>
        </div>
        <div class="summary-card card-count">
          <span class="card-label">Open loans</span>
          <span class="card-value">{{ openLoansCount() }}</span>
        </div>
      </div>

      <!-- ── "I owe ↑" section ────────────────────────────────────────── -->
      <section class="loan-section" *ngIf="iOweLoans().length > 0">
        <h2 class="section-title">I owe ↑</h2>
        <div class="table-card">
          <p-table [value]="iOweLoans()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th>Lender</th>
                <th style="text-align: right;">Original Amount</th>
                <th style="text-align: right;">Declared Repayment</th>
                <th style="text-align: center;">Actual Repaid</th>
                <th style="text-align: right;">Remaining</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 100px; text-align: center;">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-loan>
              <tr>
                <td>
                  <div class="user-cell">
                    <app-avatar [name]="getUserName(loan.lenderId)"></app-avatar>
                    <span>{{ getUserName(loan.lenderId) }}</span>
                  </div>
                </td>
                <td style="text-align: right;">{{ fmtThb(loan.amount) }}</td>
                <td style="text-align: right;">{{ fmtThb(loan.declaredRepayment ?? loan.amount ?? 0) }}</td>
                <td>
                  <div class="progress-cell">
                    <p-progressBar [value]="getRepaidPercent(loan)" [showValue]="false" styleClass="repaid-progress"></p-progressBar>
                    <span class="progress-label">{{ fmtThb(loan.actualRepaid) }}</span>
                  </div>
                </td>
                <td style="text-align: right; font-weight: 600;">{{ fmtThb(loan.remainingBalance ?? (loan.declaredRepayment ?? loan.amount ?? 0) - loan.actualRepaid) }}</td>
                <td><app-status-badge [status]="loan.status"></app-status-badge></td>
                <td style="text-align: center;">
                  <button pButton type="button" label="Repay" class="p-button-outlined p-button-sm p-button-rounded" (click)="openRepaymentDialog(loan)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="7" class="empty-cell">No outstanding loans</td></tr>
            </ng-template>
          </p-table>
        </div>
      </section>

      <!-- ── "Owed to me ↓" section ──────────────────────────────────── -->
      <section class="loan-section" *ngIf="owedToMeLoans().length > 0">
        <h2 class="section-title">Owed to me ↓</h2>
        <div class="table-card">
          <p-table [value]="owedToMeLoans()" [paginator]="true" [rows]="5" styleClass="p-datatable-sm p-datatable-striped">
            <ng-template pTemplate="header">
              <tr>
                <th>Borrower</th>
                <th style="text-align: right;">Original Amount</th>
                <th style="text-align: right;">Declared Repayment</th>
                <th style="text-align: center;">Actual Repaid</th>
                <th style="text-align: right;">Remaining</th>
                <th style="width: 110px;">Status</th>
                <th style="width: 100px; text-align: center;">Action</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-loan>
              <tr>
                <td>
                  <div class="user-cell">
                    <app-avatar [name]="getUserName(loan.borrowerId)"></app-avatar>
                    <span>{{ getUserName(loan.borrowerId) }}</span>
                  </div>
                </td>
                <td style="text-align: right;">{{ fmtThb(loan.amount) }}</td>
                <td style="text-align: right;">{{ fmtThb(loan.declaredRepayment ?? loan.amount ?? 0) }}</td>
                <td>
                  <div class="progress-cell">
                    <p-progressBar [value]="getRepaidPercent(loan)" [showValue]="false" styleClass="repaid-progress"></p-progressBar>
                    <span class="progress-label">{{ fmtThb(loan.actualRepaid) }}</span>
                  </div>
                </td>
                <td style="text-align: right; font-weight: 600;">{{ fmtThb(loan.remainingBalance ?? (loan.declaredRepayment ?? loan.amount ?? 0) - loan.actualRepaid) }}</td>
                <td><app-status-badge [status]="loan.status"></app-status-badge></td>
                <td style="text-align: center;">
                  <button pButton type="button" label="Record" class="p-button-outlined p-button-sm p-button-rounded" (click)="openRepaymentDialog(loan)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr><td colspan="7" class="empty-cell">No outstanding loans</td></tr>
            </ng-template>
          </p-table>
        </div>
      </section>

      <!-- ── Empty state ──────────────────────────────────────────────── -->
      <div class="empty-state" *ngIf="iOweLoans().length === 0 && owedToMeLoans().length === 0">
        <span class="empty-icon">🤝</span>
        <span class="empty-text">No outstanding loans</span>
      </div>

      <!-- ── Record Repayment Dialog ──────────────────────────────────── -->
      <p-dialog
        [(visible)]="repaymentDialogVisible"
        header="Record Repayment"
        [modal]="true"
        [style]="{ width: '420px' }"
        [closable]="true"
        [draggable]="false"
        [resizable]="false">

        <div class="dialog-form" *ngIf="selectedLoan()">
          <div class="dialog-loan-info">
            <span class="dialog-info-label">{{ isIOwe ? 'Repaying to' : 'Collecting from' }}:</span>
            <div class="dialog-user">
              <app-avatar [name]="getUserName(isIOwe ? selectedLoan()!.lenderId ?? 0 : selectedLoan()!.borrowerId ?? 0)"></app-avatar>
              <span class="dialog-user-name">{{ getUserName(isIOwe ? selectedLoan()!.lenderId ?? 0 : selectedLoan()!.borrowerId ?? 0) }}</span>
            </div>
            <div class="dialog-loan-details">
              <span>Remaining: <strong>{{ fmtThb(getRemainingBalance(selectedLoan()!)) }}</strong></span>
            </div>
          </div>

          <div class="form-field">
            <label for="repayAmount" class="form-label">Amount (THB)</label>
            <p-inputNumber
              id="repayAmount"
              [(ngModel)]="repaymentAmount"
              mode="currency"
              currency="THB"
              locale="en-US"
              [min]="0"
              [max]="getRemainingBalance(selectedLoan()!)"
              placeholder="0.00"
              styleClass="w-full">
            </p-inputNumber>
          </div>

          <div class="form-field">
            <label for="repayNote" class="form-label">Note (optional)</label>
            <textarea
              pInputTextarea
              id="repayNote"
              [(ngModel)]="repaymentNote"
              placeholder="Add a note..."
              rows="3"
              class="w-full">
            </textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton type="button" label="Cancel" class="p-button-text" (click)="closeRepaymentDialog()"></button>
          <button pButton type="button" label="Confirm" class="p-button-primary" (click)="confirmRepayment()" [disabled]="!repaymentAmount || repaymentAmount <= 0"></button>
        </ng-template>
      </p-dialog>

    </div>
  `,
  styles: [`
    .loans-wrap {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 4px;
    }
    .page-sub {
      font-size: 0.8rem;
      color: #64748B;
      margin: 0;
    }

    /* ── Summary cards ── */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .card-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #0F172A;
    }
    .card-value.positive { color: #059669; }
    .card-value.negative { color: #DC2626; }
    .card-positive .card-value { color: #059669; }
    .card-negative .card-value { color: #DC2626; }
    .card-count .card-value { color: #7C3AED; }

    /* ── Loan section ── */
    .loan-section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #334155;
      margin: 0 0 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 18px;
      background: #7C3AED;
      border-radius: 2px;
    }

    /* ── Table card ── */
    .table-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
      background: #F8FAFC;
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-color: #E2E8F0;
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr > td {
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #334155;
      border-color: #F1F5F9;
      vertical-align: middle;
    }
    :host ::ng-deep .p-datatable .p-datatable-tbody > tr:hover {
      background: #F8FAFC;
    }

    /* ── User cell ── */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Progress cell ── */
    .progress-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    :host ::ng-deep .repaid-progress {
      height: 8px !important;
      border-radius: 4px;
    }
    :host ::ng-deep .repaid-progress .p-progressbar-value {
      background: linear-gradient(90deg, #7C3AED, #A855F7);
    }
    .progress-label {
      font-size: 0.75rem;
      color: #64748B;
      text-align: right;
    }

    /* ── Empty state ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background: white;
      border-radius: 12px;
      border: 1px solid #E2E8F0;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
    }
    .empty-text {
      font-size: 1rem;
      color: #64748B;
    }
    .empty-cell {
      text-align: center;
      color: #64748B;
      padding: 32px !important;
    }

    /* ── Dialog form ── */
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dialog-loan-info {
      background: #F8FAFC;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dialog-info-label {
      font-size: 0.75rem;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .dialog-user {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .dialog-user-name {
      font-size: 1rem;
      font-weight: 600;
      color: #0F172A;
    }
    .dialog-loan-details {
      font-size: 0.85rem;
      color: #64748B;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
    }
    :host ::ng-deep .w-full {
      width: 100%;
    }
  `]
})
export class LoansComponent {
  private readonly dataService = inject(MockDataService);
  private readonly messageService = inject(MessageService);

  // ── Form state ──────────────────────────────────────────────────────────────
  readonly repaymentDialogVisible = signal(false);
  readonly selectedLoan = signal<Loan | null>(null);
  repaymentAmount: number | null = null;
  repaymentNote = '';

  // ── Computed: current user is lender (owed to me) or borrower (i owe) ──
  readonly owedToMeLoans = computed(() =>
    this.dataService.loans().filter(l =>
      l.lenderId === CURRENT_USER_ID &&
      (l.status === 'UNSETTLED' || l.status === 'PARTIAL')
    )
  );

  readonly iOweLoans = computed(() =>
    this.dataService.loans().filter(l =>
      l.borrowerId === CURRENT_USER_ID &&
      (l.status === 'UNSETTLED' || l.status === 'PARTIAL')
    )
  );

  readonly owedToMe = computed(() =>
    this.owedToMeLoans().reduce((sum, l) => sum + this.getRemainingBalance(l), 0)
  );

  readonly iOwe = computed(() =>
    this.iOweLoans().reduce((sum, l) => sum + this.getRemainingBalance(l), 0)
  );

  readonly netPosition = computed(() => this.owedToMe() - this.iOwe());

  readonly openLoansCount = computed(() =>
    this.dataService.loans().filter(l =>
      (l.lenderId === CURRENT_USER_ID || l.borrowerId === CURRENT_USER_ID) &&
      (l.status === 'UNSETTLED' || l.status === 'PARTIAL')
    ).length
  );

  // ── Helpers ─────────────────────────────────────────────────────────────
  fmtThb = fmtThb;

  getUserName(userId: number): string {
    return this.dataService.getUserById(userId)?.name ?? 'Unknown';
  }

  getRepaidPercent(loan: Loan): number {
    const declared = loan.declaredRepayment ?? loan.amount ?? 0;
    if (declared <= 0) return 0;
    return Math.min(100, (loan.actualRepaid! / declared!) * 100);
  }

  getRemainingBalance(loan: Loan): number {
    return loan.remainingBalance ?? (loan.declaredRepayment ?? loan.amount ?? 0)  - (loan.actualRepaid ?? 0);
  }

  get isIOwe(): boolean {
    const loan = this.selectedLoan();
    return loan ? loan.borrowerId === CURRENT_USER_ID : false;
  }

  // ── Repayment dialog ────────────────────────────────────────────────────
  openRepaymentDialog(loan?: Loan): void {
    if (loan) {
      this.selectedLoan.set(loan);
    } else {
      // Default to first open loan
      const firstOpen = this.iOweLoans().length > 0 ? this.iOweLoans()[0] : this.owedToMeLoans()[0];
      this.selectedLoan.set(firstOpen ?? null);
    }
    this.repaymentDialogVisible.set(true);
  }

  closeRepaymentDialog(): void {
    this.repaymentDialogVisible.set(false);
    this.selectedLoan.set(null);
    this.repaymentAmount = null;
    this.repaymentNote = '';
  }

  confirmRepayment(): void {
    const loan = this.selectedLoan();
    if (!loan || !this.repaymentAmount || this.repaymentAmount <= 0) return;

    this.dataService.recordRepayment(loan.id!, this.repaymentAmount, this.repaymentNote);
    this.messageService.add({
      severity: 'success',
      summary: 'Repayment Recorded',
      detail: `${fmtThb(this.repaymentAmount)} repayment recorded successfully`
    });

    this.closeRepaymentDialog();
  }
}
