import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ExpenseStatus } from '../models';

export interface CreateExpenseDto {
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status?: ExpenseStatus;
  notes?: string;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/expenses`;

  getAll(): Observable<Expense[]> {
    return this.http.get<Expense[]>(this.base);
  }

  getById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.base}/${id}`);
  }

  getByStatus(status: ExpenseStatus): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.base}/status/${status}`);
  }

  create(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.base, dto);
  }

  update(id: number, dto: UpdateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.base}/${id}`, dto);
  }

  approve(id: number): Observable<Expense> {
    return this.http.post<Expense>(`${this.base}/${id}/approve`, {});
  }

  reject(id: number): Observable<Expense> {
    return this.http.post<Expense>(`${this.base}/${id}/reject`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
