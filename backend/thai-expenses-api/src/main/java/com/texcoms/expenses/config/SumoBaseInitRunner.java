package com.texcoms.expenses.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

/**
 * On startup:
 * 1. Stabilizes SumoBase DBaaS trigger-managed columns (username, password_hash, full_name)
 *    so Hibernate INSERTs don't fail due to NOT NULL without DEFAULT.
 * 2. Seeds app_username for existing users that were created before that column existed.
 *    Derives app_username from the portion of email before '@' (e.g. "syaeful@…" → "syaeful").
 *    Runs AFTER Hibernate EntityManagerFactory is initialized.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class SumoBaseInitRunner implements ApplicationRunner {

    private final DataSource dataSource;

    /** Columns that SumoBase DBaaS auto-adds to ALL tables */
    private static final List<String> SUMOBASE_COLUMNS = List.of(
        "username", "password_hash", "full_name"
    );

    /** Tables using the gen_ prefix */
    private static final List<String> APP_TABLES = List.of(
        "gen_users", "gen_expenses", "gen_loans", "gen_repayments"
    );

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("SumoBase: scanning and stabilizing trigger-managed columns...");

        int stabilized = 0;
        int skipped = 0;

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();

            for (String table : APP_TABLES) {
                for (String column : SUMOBASE_COLUMNS) {
                    try {
                        if (columnExists(meta, table, column)) {
                            stabilizeColumn(conn, table, column);
                            stabilized++;
                            log.info("  Stabilized: {}.{}", table, column);
                        } else {
                            skipped++;
                            log.debug("  Not present (yet): {}.{}", table, column);
                        }
                    } catch (Exception e) {
                        log.warn("  Could not stabilize {}.{}: {}", table, column, e.getMessage());
                        skipped++;
                    }
                }
            }

            // Seed app_username for existing users where it is null or blank
            seedAppUsernames(conn, meta);
        }

        log.info("SumoBase stabilization complete: {} stabilized, {} skipped.", stabilized, skipped);
    }

    /**
     * For each gen_users row with a blank/null app_username, derive the value
     * from the prefix of the email column (e.g. "syaeful@texcoms.my.id" → "syaeful").
     * Skips rows where the derived value is already taken.
     */
    private void seedAppUsernames(Connection conn, DatabaseMetaData meta) throws Exception {
        // Only run if app_username column exists
        if (!columnExists(meta, "gen_users", "app_username")) {
            log.debug("app_username column not yet present — skipping seeding.");
            return;
        }

        String selectSql = "SELECT id, email, app_username FROM gen_users WHERE app_username IS NULL OR app_username = ''";
        String updateSql = "UPDATE gen_users SET app_username = ? WHERE id = ?";

        try (Statement selectStmt = conn.createStatement();
             ResultSet rs = selectStmt.executeQuery(selectSql)) {

            int seeded = 0;
            try (var updateStmt = conn.prepareStatement(updateSql)) {
                while (rs.next()) {
                    long id = rs.getLong("id");
                    String email = rs.getString("email");
                    if (email == null || email.isBlank()) continue;

                    // Derive username from email prefix
                    String derived = email.contains("@")
                        ? email.substring(0, email.indexOf('@')).toLowerCase()
                        : email.toLowerCase();

                    // Check if derived username is already taken (parameterized to avoid SQL injection)
                    try (PreparedStatement checkStmt = conn.prepareStatement(
                             "SELECT id FROM gen_users WHERE app_username = ? AND id != ?")) {
                        checkStmt.setString(1, derived);
                        checkStmt.setLong(2, id);
                        try (ResultSet checkRs = checkStmt.executeQuery()) {
                            if (checkRs.next()) {
                                log.warn("  Skipped seeding id={}: derived username '{}' already taken.", id, derived);
                                continue;
                            }
                        }
                    }

                    updateStmt.setString(1, derived);
                    updateStmt.setLong(2, id);
                    updateStmt.executeUpdate();
                    log.info("  Seeded app_username='{}' for user id={} (email={})", derived, id, email);
                    seeded++;
                }
            }
            if (seeded > 0) {
                log.info("app_username seeding complete: {} users updated.", seeded);
            } else {
                log.debug("app_username seeding: all users already have app_username set.");
            }
        }
    }

    private boolean columnExists(DatabaseMetaData meta, String table, String column) throws Exception {
        try (ResultSet rs = meta.getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private void stabilizeColumn(Connection conn, String table, String column) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            // Step 1: Null → empty string
            String updateSql = String.format(
                "UPDATE %s SET %s = '' WHERE %s IS NULL", table, column, column);
            int updated = stmt.executeUpdate(updateSql);
            if (updated > 0) {
                log.debug("  Cleared {} NULL values in {}.{}", updated, table, column);
            }

            // Step 2: Add DEFAULT '' so future INSERTs never fail
            String alterSql = String.format(
                "ALTER TABLE %s MODIFY COLUMN %s VARCHAR(255) DEFAULT '' NOT NULL",
                table, column);
            stmt.executeUpdate(alterSql);
        }
    }
}
