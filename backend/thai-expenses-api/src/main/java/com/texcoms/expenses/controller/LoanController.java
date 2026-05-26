package com.texcoms.expenses.controller;

import com.texcoms.expenses.dto.*;
import com.texcoms.expenses.entity.Loan;
import com.texcoms.expenses.entity.User;
import com.texcoms.expenses.repository.UserRepository;
import com.texcoms.expenses.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanDto>>> getAllLoans(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoansByUser(user.getId())));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<LoanDto>>> getAllLoansAdmin() {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getAllLoans()));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<LoanDto>>> getLoansByType(
            @PathVariable Loan.LoanType type,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoansByUserAndType(user.getId(), type)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanDto>> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoanById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LoanDto>> createLoan(
            @Valid @RequestBody CreateLoanRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        LoanDto loan = loanService.createLoan(request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Loan created", loan));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanDto>> updateLoan(
            @PathVariable Long id,
            @RequestBody UpdateLoanRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Loan updated", loanService.updateLoan(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return ResponseEntity.ok(ApiResponse.ok("Loan deleted", null));
    }

    @PutMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<LoanDto>> settleLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Loan settled", loanService.settleLoan(id)));
    }

    @PostMapping("/{id}/repayments")
    public ResponseEntity<ApiResponse<RepaymentDto>> addRepayment(
            @PathVariable Long id,
            @Valid @RequestBody CreateRepaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername()).orElseThrow();
        RepaymentDto repayment = loanService.addRepayment(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Repayment recorded", repayment));
    }
}
