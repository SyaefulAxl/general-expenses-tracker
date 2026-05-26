package com.texcoms.expenses.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

/**
 * Stabilizes SumoBase DBaaS trigger-managed columns on application startup.
 *
 * The DBaaS uses BEFORE INSERT table triggers that dynamically add NOT NULL columns
 * (username, password_hash, full_name) WITHOUT defaults on first INSERT per table.
 * Hibernate INSERTs fail because MySQL checks NOT NULL after the trigger adds the column.
 *
 * This runner:
 * 1. Reads actual DB schema via JDBC Metadata (bypasses Hibernate)
 * 2. For each SumoBase-managed column that exists, updates NULL values to ''
 * 3. Modifies the column to have a DEFAULT '' so future inserts don't fail
 *
 * Runs AFTER Hibernate EntityManagerFactory is created (ApplicationRunner).
 * Safe because by this point, Hibernate has already released its connection.
 */
@Slf4j
@RequiredArgsConstructor
public class SumoBaseInitRunner implements ApplicationRunner {

    private final DataSource dataSource;

    /** Columns that SumoBase DBaaS auto-adds to ALL tables */
    private static final List<String> SUMOBASE_COLUMNS = List.of(
        "username", "password_hash", "full_name"
    );

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("SumoBase: scanning and stabilizing trigger-managed columns...");

        int stabilized = 0;
        int skipped = 0;

        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();

            // Check each known SumoBase column in each app table
            for (String table : List.of("users", "expenses", "loans", "repayments")) {
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
        }

        log.info("SumoBase stabilization complete: {} columns stabilized, {} not yet present.",
                 stabilized, skipped);
    }

    private boolean columnExists(DatabaseMetaData meta, String table, String column) throws Exception {
        try (ResultSet rs = meta.getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private void stabilizeColumn(Connection conn, String table, String column) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            // Step 1: Set all NULL values to empty string (removes NOT NULL violation)
            String updateSql = String.format(
                "UPDATE %s SET %s = '' WHERE %s IS NULL", table, column, column);
            int updated = stmt.executeUpdate(updateSql);
            if (updated > 0) {
                log.debug("  Cleared {} NULL values in {}.{}", updated, table, column);
            }

            // Step 2: Modify the column to have a DEFAULT
            String alterSql = String.format(
                "ALTER TABLE %s MODIFY COLUMN %s VARCHAR(255) DEFAULT '' NOT NULL",
                table, column);
            stmt.executeUpdate(alterSql);
        }
    }
}
