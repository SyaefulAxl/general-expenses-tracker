package com.texcoms.expenses.controller;

import com.texcoms.expenses.dto.*;
import com.texcoms.expenses.entity.User;
import com.texcoms.expenses.repository.RepaymentRepository;
import com.texcoms.expenses.repository.UserRepository;
import com.texcoms.expenses.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/repayments")
@RequiredArgsConstructor
public class RepaymentController {

    private final RepaymentRepository repaymentRepository;
    private final UserRepository userRepository;
    private final LoanService loanService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RepaymentDto>>> getMyRepayments(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<RepaymentDto> repayments = repaymentRepository
                .findByUserIdOrderByRepaymentDateDesc(user.getId())
                .stream()
                .map(loanService::toRepaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(repayments));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RepaymentDto>>> getAllRepayments() {
        List<RepaymentDto> repayments = repaymentRepository.findAll()
                .stream()
                .map(loanService::toRepaymentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(repayments));
    }
}
