package com.texcoms.expenses.dto;

import com.texcoms.expenses.enums.ExpenseStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateExpenseRequest {
    private String description;
    private BigDecimal amount;
    private String category;
    private LocalDate expenseDate;
    private ExpenseStatus status;
    private String notes;
}
