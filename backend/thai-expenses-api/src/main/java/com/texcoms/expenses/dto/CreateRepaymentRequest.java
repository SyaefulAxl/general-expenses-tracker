package com.texcoms.expenses.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateRepaymentRequest {

    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;

    @NotNull
    private LocalDate repaymentDate;

    private String notes;
}
