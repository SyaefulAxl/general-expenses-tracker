import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppLayout } from './layout/component/app.layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
      },
      {
        path: 'loans',
        loadComponent: () =>
          import('./features/loans/loans.component').then(m => m.LoansComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.component').then(m => m.HistoryComponent),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
