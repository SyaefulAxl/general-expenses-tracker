package com.texcoms.expenses.controller;

import com.texcoms.expenses.dto.*;
import com.texcoms.expenses.entity.User;
import com.texcoms.expenses.enums.ExpenseStatus;
import com.texcoms.expenses.repository.UserRepository;
import com.texcoms.expenses.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getAllExpenses(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        List<ExpenseDto> expenses = expenseService.getExpensesByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(expenses));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getAllExpensesAdmin() {
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getAllExpenses()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDto>> getExpenseById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User requester = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getExpenseById(id, requester)));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getByStatus(
            @PathVariable ExpenseStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getExpensesByUserAndStatus(user.getId(), status)));
    }

    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getExpensesByUserAndDateRange(user.getId(), start, end)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(
            @Valid @RequestBody CreateExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        ExpenseDto expense = expenseService.createExpense(request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Expense created", expense));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDto>> updateExpense(
            @PathVariable Long id,
            @RequestBody UpdateExpenseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User requester = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok("Expense updated", expenseService.updateExpense(id, request, requester)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExpenseDto>> approveExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User approver = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok("Expense approved", expenseService.approveExpense(id, approver.getId())));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExpenseDto>> rejectExpense(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Expense rejected", expenseService.rejectExpense(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        expenseService.deleteExpense(id, user);
        return ResponseEntity.ok(ApiResponse.ok("Expense deleted", null));
    }
}
