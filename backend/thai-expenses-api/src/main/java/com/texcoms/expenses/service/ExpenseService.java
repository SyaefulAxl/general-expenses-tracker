package com.texcoms.expenses.service;

import com.texcoms.expenses.dto.*;
import com.texcoms.expenses.entity.Expense;
import com.texcoms.expenses.entity.User;
import com.texcoms.expenses.enums.ExpenseStatus;
import com.texcoms.expenses.enums.UserRole;
import com.texcoms.expenses.exception.ResourceNotFoundException;
import com.texcoms.expenses.repository.ExpenseRepository;
import com.texcoms.expenses.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ExpenseDto> getAllExpenses() {
        return expenseRepository.findAllActive().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpensesByUser(Long userId) {
        return expenseRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpensesByUserAndStatus(Long userId, ExpenseStatus status) {
        return expenseRepository.findByUserIdAndStatusAndIsDeletedFalse(userId, status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getExpensesByUserAndDateRange(Long userId, LocalDate start, LocalDate end) {
        return expenseRepository.findByUserIdAndDateRange(userId, start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseDto getExpenseById(Long id, User requester) {
        Expense expense = findActiveExpense(id);
        if (requester.getRole() != UserRole.ADMIN
                && !expense.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to view this expense.");
        }
        return toDto(expense);
    }

    private Expense findActiveExpense(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with id: " + id));
        if (Boolean.TRUE.equals(expense.getIsDeleted())) {
            throw new ResourceNotFoundException("Expense not found with id: " + id);
        }
        return expense;
    }

    @Transactional
    public ExpenseDto createExpense(CreateExpenseRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Expense expense = Expense.builder()
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .expenseDate(request.getExpenseDate())
                .status(request.getStatus() != null ? request.getStatus() : ExpenseStatus.DRAFT)
                .toko(request.getToko())
                .source(request.getSource())
                .shared(request.getShared() != null ? request.getShared() : false)
                .notes(request.getNotes())
                .user(user)
                .build();
        expense = expenseRepository.save(expense);
        return toDto(expense);
    }

    @Transactional
    public ExpenseDto updateExpense(Long id, UpdateExpenseRequest request, User requester) {
        Expense expense = findActiveExpense(id);
        if (requester.getRole() != UserRole.ADMIN
                && !expense.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to update this expense.");
        }
        if (expense.getStatus() == ExpenseStatus.APPROVED) {
            throw new AccessDeniedException("Approved expenses cannot be edited.");
        }
        if (request.getDescription() != null) expense.setDescription(request.getDescription());
        if (request.getAmount() != null) expense.setAmount(request.getAmount());
        if (request.getCategory() != null) expense.setCategory(request.getCategory());
        if (request.getExpenseDate() != null) expense.setExpenseDate(request.getExpenseDate());
        if (request.getStatus() != null) expense.setStatus(request.getStatus());
        if (request.getToko() != null) expense.setToko(request.getToko());
        if (request.getSource() != null) expense.setSource(request.getSource());
        if (request.getShared() != null) expense.setShared(request.getShared());
        if (request.getNotes() != null) expense.setNotes(request.getNotes());
        expense = expenseRepository.save(expense);
        return toDto(expense);
    }

    @Transactional
    public ExpenseDto approveExpense(Long id, Long approverId) {
        Expense expense = findActiveExpense(id);
        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new AccessDeniedException("Only PENDING expenses can be approved. Current status: " + expense.getStatus());
        }
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + approverId));
        expense.setStatus(ExpenseStatus.APPROVED);
        expense.setApprovedBy(approver);
        expense.setApprovedAt(java.time.LocalDateTime.now());
        expense = expenseRepository.save(expense);
        return toDto(expense);
    }

    @Transactional
    public ExpenseDto rejectExpense(Long id) {
        Expense expense = findActiveExpense(id);
        if (expense.getStatus() != ExpenseStatus.PENDING) {
            throw new AccessDeniedException("Only PENDING expenses can be rejected. Current status: " + expense.getStatus());
        }
        expense.setStatus(ExpenseStatus.REJECTED);
        expense = expenseRepository.save(expense);
        return toDto(expense);
    }

    @Transactional
    public void deleteExpense(Long id, User requester) {
        Expense expense = findActiveExpense(id);
        if (requester.getRole() != UserRole.ADMIN
                && !expense.getUser().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You do not have permission to delete this expense.");
        }
        expense.setIsDeleted(true);
        expenseRepository.save(expense);
    }

    public ExpenseDto toDto(Expense expense) {
        return ExpenseDto.builder()
                .id(expense.getId())
                .description(expense.getDescription())
                .amount(expense.getAmount())
                .category(expense.getCategory())
                .expenseDate(expense.getExpenseDate())
                .status(expense.getStatus())
                .toko(expense.getToko())
                .source(expense.getSource())
                .shared(expense.getShared())
                .notes(expense.getNotes())
                .userId(expense.getUser().getId())
                .userName(expense.getUser().getName())
                .userEmail(expense.getUser().getEmail())
                .approvedById(expense.getApprovedBy() != null ? expense.getApprovedBy().getId() : null)
                .approvedByName(expense.getApprovedBy() != null ? expense.getApprovedBy().getName() : null)
                .approvedAt(expense.getApprovedAt())
                .createdAt(expense.getCreatedAt())
                .updatedAt(expense.getUpdatedAt())
                .build();
    }
}
