package com.texcoms.expenses.entity;

import com.texcoms.expenses.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gen_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.MEMBER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Legacy DB column managed by SumoBase DBaaS (populated by DB trigger).
     * insertable=false so Hibernate does NOT include it in INSERT.
     */
    @Column(name = "username", insertable = false, updatable = false)
    private String sumoUsername;

    /**
     * App-level username for login — Hibernate-managed via separate DB column.
     */
    @Column(name = "app_username", nullable = false, unique = true)
    private String username;

    /**
     * Legacy DB column managed by SumoBase DBaaS (populated by DB trigger).
     * insertable=false so Hibernate does NOT include it in INSERT — DB trigger provides the value.
     */
    @Column(name = "password_hash", insertable = false, updatable = false)
    private String passwordHash;

    /**
     * Legacy DB column managed by SumoBase DBaaS (populated by DB trigger).
     * insertable=false so Hibernate does NOT include it in INSERT — DB trigger provides the value.
     */
    @Column(name = "full_name", insertable = false, updatable = false)
    private String fullName;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

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
