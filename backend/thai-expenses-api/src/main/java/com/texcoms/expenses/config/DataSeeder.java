package com.texcoms.expenses.config;

import com.texcoms.expenses.entity.User;
import com.texcoms.expenses.enums.UserRole;
import com.texcoms.expenses.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures canonical seed users exist with correct credentials.
 *
 * - If a user with the given email already exists, updates their password
 *   and app_username to the canonical values (so login always works after deploy).
 * - If the user doesn't exist at all, creates them.
 *
 * Runs AFTER SumoBaseInitRunner (Order 2).
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private record SeedUser(String name, String username, String email, String password, UserRole role) {}

    private static final SeedUser[] SEED_USERS = {
        new SeedUser("Syaeful", "syaeful", "syaeful@texcoms.my.id", "Texcoms@2025!", UserRole.ADMIN),
        new SeedUser("Winda",   "winda",   "winda@texcoms.my.id",   "Texcoms@2025!", UserRole.MEMBER),
        new SeedUser("Dina",    "dina",    "dina@texcoms.my.id",    "Texcoms@2025!", UserRole.MEMBER),
    };

    @Override
    public void run(ApplicationArguments args) {
        log.info("DataSeeder: ensuring seed users exist with correct credentials...");

        for (SeedUser seed : SEED_USERS) {
            try {
                userRepository.findByEmail(seed.email()).ifPresentOrElse(
                    existing -> {
                        boolean updated = false;
                        // Sync app_username
                        if (existing.getUsername() == null || !seed.username().equals(existing.getUsername())) {
                            existing.setUsername(seed.username());
                            updated = true;
                        }
                        // Always re-encode password to canonical value
                        existing.setPassword(passwordEncoder.encode(seed.password()));
                        existing.setIsActive(true);
                        updated = true;
                        userRepository.save(existing);
                        log.info("  Synced user: {} (id={})", seed.username(), existing.getId());
                    },
                    () -> {
                        // User doesn't exist — check if username is taken
                        if (userRepository.existsByUsername(seed.username())) {
                            log.warn("  Skipping seed user '{}': username already taken by different email.", seed.username());
                            return;
                        }
                        User user = User.builder()
                            .name(seed.name())
                            .username(seed.username())
                            .email(seed.email())
                            .password(passwordEncoder.encode(seed.password()))
                            .role(seed.role())
                            .isActive(true)
                            .build();
                        userRepository.save(user);
                        log.info("  Created seed user: {} ({})", seed.username(), seed.email());
                    }
                );
            } catch (Exception e) {
                log.warn("  DataSeeder: could not process user '{}': {}", seed.username(), e.getMessage());
            }
        }

        log.info("DataSeeder: complete.");
    }
}
