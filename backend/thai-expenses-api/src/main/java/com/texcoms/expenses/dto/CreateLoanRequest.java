package com.texcoms.expenses.dto;

import com.texcoms.expenses.entity.Loan;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateLoanRequest {

    @NotBlank
    private String personName;

    @NotNull
    private Loan.LoanType type;

    @NotNull @DecimalMin("0.01")
    private BigDecimal totalAmount;

    @NotNull
    private LocalDate loanDate;

    private String notes;
}
