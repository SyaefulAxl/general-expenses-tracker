package com.texcoms.expenses.entity;

import com.texcoms.expenses.enums.LoanStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String personName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanType type;  // I_OWE or OWED_TO_ME

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Column(nullable = false)
    private BigDecimal remainingAmount;

    @Column(nullable = false)
    private LocalDate loanDate;

    private LocalDate settledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private LoanStatus status = LoanStatus.UNSETTLED;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** SumoBase DBaaS managed column — not managed by Hibernate */
    @Column(name = "username", insertable = false, updatable = false)
    private String username;

    /** SumoBase DBaaS managed column — not managed by Hibernate */
    @Column(name = "password_hash", insertable = false, updatable = false)
    private String passwordHash;

    /** SumoBase DBaaS managed column — not managed by Hibernate */
    @Column(name = "full_name", insertable = false, updatable = false)
    private String fullName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum LoanType {
        I_OWE,
        OWED_TO_ME
    }
}
