package com.texcoms.expenses.dto;

import com.texcoms.expenses.enums.ExpenseStatus;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateExpenseRequest {

    @NotBlank
    private String description;

    @NotNull @DecimalMin("0.01")
    private BigDecimal amount;

    @NotBlank
    private String category;

    @NotNull
    private LocalDate expenseDate;

    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.DRAFT;

    private String toko;
    private String source;

    @Builder.Default
    private Boolean shared = false;

    private String notes;
}
