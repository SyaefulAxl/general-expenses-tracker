package com.texcoms.expenses.repository;

import com.texcoms.expenses.entity.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepaymentRepository extends JpaRepository<Repayment, Long> {
    List<Repayment> findByLoanIdOrderByRepaymentDateDesc(Long loanId);
    List<Repayment> findByUserIdOrderByRepaymentDateDesc(Long userId);
}
