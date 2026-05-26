package com.texcoms.expenses.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "repayments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Repayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate repaymentDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
