package com.texcoms.expenses.repository;

import com.texcoms.expenses.entity.Expense;
import com.texcoms.expenses.enums.ExpenseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserIdAndIsDeletedFalse(Long userId);

    List<Expense> findByUserIdAndStatusAndIsDeletedFalse(Long userId, ExpenseStatus status);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId AND e.expenseDate BETWEEN :start AND :end AND e.isDeleted = false")
    List<Expense> findByUserIdAndDateRange(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT e FROM Expense e WHERE e.status = :status AND e.isDeleted = false ORDER BY e.createdAt DESC")
    List<Expense> findByStatus(ExpenseStatus status);

    @Query("SELECT e FROM Expense e WHERE e.isDeleted = false ORDER BY e.createdAt DESC")
    List<Expense> findAllActive();
}
