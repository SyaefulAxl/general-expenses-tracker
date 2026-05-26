package com.texcoms.expenses.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RepaymentDto {
    private Long id;
    private BigDecimal amount;
    private LocalDate repaymentDate;
    private String notes;
    private Long loanId;
    private Long userId;
    private LocalDateTime createdAt;
}
