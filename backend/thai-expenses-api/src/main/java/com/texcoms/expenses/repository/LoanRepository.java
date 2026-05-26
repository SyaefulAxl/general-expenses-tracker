package com.texcoms.expenses.repository;

import com.texcoms.expenses.entity.Loan;
import com.texcoms.expenses.entity.Loan.LoanType;
import com.texcoms.expenses.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Query("SELECT l FROM Loan l LEFT JOIN FETCH l.user WHERE l.isDeleted = false ORDER BY l.createdAt DESC")
    List<Loan> findAllActive();

    @Query("SELECT l FROM Loan l LEFT JOIN FETCH l.user WHERE l.user.id = :userId AND l.isDeleted = false ORDER BY l.createdAt DESC")
    List<Loan> findByUserIdActive(Long userId);

    @Query("SELECT l FROM Loan l LEFT JOIN FETCH l.user WHERE l.user.id = :userId AND l.type = :type AND l.isDeleted = false ORDER BY l.createdAt DESC")
    List<Loan> findByUserIdAndTypeAndIsDeletedFalse(Long userId, LoanType type);

    @Query("SELECT l FROM Loan l LEFT JOIN FETCH l.user WHERE l.user.id = :userId AND l.status = :status AND l.isDeleted = false ORDER BY l.createdAt DESC")
    List<Loan> findByUserIdAndStatusAndIsDeletedFalse(Long userId, LoanStatus status);
}
