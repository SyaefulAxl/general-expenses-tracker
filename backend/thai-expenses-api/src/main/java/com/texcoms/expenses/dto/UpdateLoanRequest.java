package com.texcoms.expenses.dto;

import com.texcoms.expenses.entity.Loan;
import com.texcoms.expenses.enums.LoanStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateLoanRequest {
    private String personName;
    private Loan.LoanType type;
    private BigDecimal totalAmount;
    private LocalDate loanDate;
    private LoanStatus status;
    private String notes;
}
