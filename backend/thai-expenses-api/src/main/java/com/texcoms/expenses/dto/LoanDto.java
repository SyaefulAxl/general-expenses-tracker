package com.texcoms.expenses.dto;

import com.texcoms.expenses.entity.Loan;
import com.texcoms.expenses.enums.LoanStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanDto {
    private Long id;
    private String personName;
    private Loan.LoanType type;
    private BigDecimal totalAmount;
    private BigDecimal remainingAmount;
    private BigDecimal paidAmount;
    private LocalDate loanDate;
    private LocalDate settledDate;
    private LoanStatus status;
    private String notes;
    private Long userId;
    private String userName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RepaymentDto> repayments;
}
