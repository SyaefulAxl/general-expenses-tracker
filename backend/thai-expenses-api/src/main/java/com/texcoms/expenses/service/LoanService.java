package com.texcoms.expenses.service;

import com.texcoms.expenses.dto.*;
import com.texcoms.expenses.entity.*;
import com.texcoms.expenses.enums.LoanStatus;
import com.texcoms.expenses.enums.UserRole;
import com.texcoms.expenses.exception.ResourceNotFoundException;
import com.texcoms.expenses.repository.LoanRepository;
import com.texcoms.expenses.repository.RepaymentRepository;
import com.texcoms.expenses.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final RepaymentRepository repaymentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LoanDto> getAllLoans() {
        return loanRepository.findAllActive().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanDto> getLoansByUser(Long userId) {
        return loanRepository.findByUserIdActive(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanDto> getLoansByUserAndType(Long userId, Loan.LoanType type) {
        return loanRepository.findByUserIdAndTypeAndIsDeletedFalse(userId, type).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanDto getLoanById(Long id, User requester) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        if (requester.getRole() != UserRole.ADMIN
                && !loan.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to view this loan.");
        }
        return toDto(loan);
    }

    @Transactional
    public LoanDto createLoan(CreateLoanRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Loan loan = Loan.builder()
                .personName(request.getPersonName())
                .type(request.getType())
                .totalAmount(request.getTotalAmount())
                .remainingAmount(request.getTotalAmount())
                .loanDate(request.getLoanDate())
                .notes(request.getNotes())
                .status(LoanStatus.UNSETTLED)
                .user(user)
                .build();
        loan = loanRepository.save(loan);
        return toDto(loan);
    }

    @Transactional
    public LoanDto updateLoan(Long id, UpdateLoanRequest request, User requester) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        if (requester.getRole() != UserRole.ADMIN
                && !loan.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to update this loan.");
        }
        if (request.getPersonName() != null) loan.setPersonName(request.getPersonName());
        if (request.getType() != null) loan.setType(request.getType());
        if (request.getLoanDate() != null) loan.setLoanDate(request.getLoanDate());
        if (request.getNotes() != null) loan.setNotes(request.getNotes());
        if (request.getStatus() != null) loan.setStatus(request.getStatus());
        if (request.getTotalAmount() != null) {
            BigDecimal paid = loan.getTotalAmount().subtract(loan.getRemainingAmount());
            loan.setTotalAmount(request.getTotalAmount());
            BigDecimal newRemaining = request.getTotalAmount().subtract(paid);
            loan.setRemainingAmount(newRemaining.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newRemaining);
        }
        loan = loanRepository.save(loan);
        return toDto(loan);
    }

    @Transactional
    public void deleteLoan(Long id, User requester) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        if (requester.getRole() != UserRole.ADMIN
                && !loan.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this loan.");
        }
        loan.setIsDeleted(true);
        loanRepository.save(loan);
    }

    @Transactional
    public LoanDto settleLoan(Long id, User requester) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + id));
        if (requester.getRole() != UserRole.ADMIN
                && !loan.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to settle this loan.");
        }
        loan.setStatus(LoanStatus.FULLY_SETTLED);
        loan.setRemainingAmount(BigDecimal.ZERO);
        loan.setSettledDate(java.time.LocalDate.now());
        loan = loanRepository.save(loan);
        return toDto(loan);
    }

    @Transactional
    public RepaymentDto addRepayment(Long loanId, CreateRepaymentRequest request, User requester) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found with id: " + loanId));
        if (requester.getRole() != UserRole.ADMIN
                && !loan.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to record a repayment on this loan.");
        }
        User user = userRepository.findById(requester.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + requester.getId()));
        Repayment repayment = Repayment.builder()
                .amount(request.getAmount())
                .repaymentDate(request.getRepaymentDate())
                .notes(request.getNotes())
                .loan(loan)
                .user(user)
                .build();
        repayment = repaymentRepository.save(repayment);
        // Update loan remaining amount
        BigDecimal newRemaining = loan.getRemainingAmount().subtract(request.getAmount());
        if (newRemaining.compareTo(BigDecimal.ZERO) <= 0) {
            loan.setRemainingAmount(BigDecimal.ZERO);
            loan.setStatus(LoanStatus.FULLY_SETTLED);
            loan.setSettledDate(java.time.LocalDate.now());
        } else {
            loan.setRemainingAmount(newRemaining);
            loan.setStatus(LoanStatus.PARTIAL);
        }
        loanRepository.save(loan);
        return toRepaymentDto(repayment);
    }

    public LoanDto toDto(Loan loan) {
        List<RepaymentDto> repayments = repaymentRepository.findByLoanIdOrderByRepaymentDateDesc(loan.getId())
                .stream().map(this::toRepaymentDto).collect(Collectors.toList());
        BigDecimal paidAmount = loan.getTotalAmount().subtract(loan.getRemainingAmount());
        return LoanDto.builder()
                .id(loan.getId())
                .personName(loan.getPersonName())
                .type(loan.getType())
                .totalAmount(loan.getTotalAmount())
                .remainingAmount(loan.getRemainingAmount())
                .paidAmount(paidAmount)
                .loanDate(loan.getLoanDate())
                .settledDate(loan.getSettledDate())
                .status(loan.getStatus())
                .notes(loan.getNotes())
                .userId(loan.getUser().getId())
                .userName(loan.getUser().getName())
                .createdAt(loan.getCreatedAt())
                .updatedAt(loan.getUpdatedAt())
                .repayments(repayments)
                .build();
    }

    public RepaymentDto toRepaymentDto(Repayment repayment) {
        return RepaymentDto.builder()
                .id(repayment.getId())
                .amount(repayment.getAmount())
                .repaymentDate(repayment.getRepaymentDate())
                .notes(repayment.getNotes())
                .loanId(repayment.getLoan().getId())
                .userId(repayment.getUser().getId())
                .createdAt(repayment.getCreatedAt())
                .build();
    }
}
