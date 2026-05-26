import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Loan, LoanType, Repayment } from '../models';

export interface CreateLoanDto {
  personName: string;
  type: LoanType;
  totalAmount: number;
  loanDate: string;
  notes?: string;
}

export interface CreateRepaymentDto {
  amount: number;
  repaymentDate: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/loans`;

  getAll(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.base);
  }

  getById(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.base}/${id}`);
  }

  getByType(type: LoanType): Observable<Loan[]> {
    return this.http.get<Loan[]>(`${this.base}/type/${type}`);
  }

  create(dto: CreateLoanDto): Observable<Loan> {
    return this.http.post<Loan>(this.base, dto);
  }

  addRepayment(loanId: number, dto: CreateRepaymentDto): Observable<Repayment> {
    return this.http.post<Repayment>(`${this.base}/${loanId}/repayments`, dto);
  }
}
