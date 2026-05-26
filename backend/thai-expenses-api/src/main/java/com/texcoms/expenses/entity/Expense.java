package com.texcoms.expenses.entity;

import com.texcoms.expenses.enums.ExpenseStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gen_expenses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ExpenseStatus status = ExpenseStatus.DRAFT;

    /** Store / merchant name (e.g. "Grab", "Seven 11", "Makro") */
    private String toko;

    /** Who physically paid cash (e.g. "Winda Cash") */
    private String source;

    /** Whether this expense was split / shared across the team */
    @Builder.Default
    @Column(nullable = false)
    private Boolean shared = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private LocalDateTime approvedAt;

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
}
