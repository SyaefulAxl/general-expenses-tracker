package com.texcoms.expenses.config;

import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

/**
 * HikariCP ConnectionCustomizer — called on every new physical connection.
 *
 * Stabilizes SumoBase DBaaS trigger-managed columns by adding defaults.
 * The DBaaS uses BEFORE INSERT triggers that add NOT NULL columns
 * (username, password_hash, full_name) WITHOUT defaults on first INSERT.
 * This runs ALTER TABLE on each connection to add defaults.
 *
 * If the column doesn't exist yet (before DBaaS trigger fires), the error
 * is silently swallowed — the next connection will pick it up.
 *
 * Configured via: spring.datasource.hikari.connection-customizer-class-name
 */
@Slf4j
public class SumoBaseConnectionCustomizer {

    private static final List<String> STABILIZATION_SQLS = List.of(
        // Users table
        "ALTER TABLE users MODIFY COLUMN username VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE users MODIFY COLUMN full_name VARCHAR(255) DEFAULT '' NOT NULL",
        // Expenses table
        "ALTER TABLE expenses MODIFY COLUMN username VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE expenses MODIFY COLUMN password_hash VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE expenses MODIFY COLUMN full_name VARCHAR(255) DEFAULT '' NOT NULL",
        // Loans table
        "ALTER TABLE loans MODIFY COLUMN username VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE loans MODIFY COLUMN password_hash VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE loans MODIFY COLUMN full_name VARCHAR(255) DEFAULT '' NOT NULL",
        // Repayments table
        "ALTER TABLE repayments MODIFY COLUMN username VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE repayments MODIFY COLUMN password_hash VARCHAR(255) DEFAULT '' NOT NULL",
        "ALTER TABLE repayments MODIFY COLUMN full_name VARCHAR(255) DEFAULT '' NOT NULL"
    );

    /**
     * Called by HikariCP on every new physical connection (before it's pooled).
     */
    public void init(DataSource ds) throws SQLException {
        log.debug("SumoBase: stabilizing trigger-managed columns on new connection...");
        stabilize(ds);
    }

    /** Called when the connection is closed / pool is shutdown */
    public void close() {
        // nothing to clean up
    }

    private void stabilize(DataSource ds) {
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String sql : STABILIZATION_SQLS) {
                try {
                    stmt.executeUpdate(sql);
                    String[] parts = sql.split(" ");
                    log.debug("Stabilized: {}.{}",
                        parts[2],           // table name
                        parts[4].split("\\(")[0]); // column name
                } catch (SQLException e) {
                    // Column not yet present or other error — suppress silently
                    log.trace("Skipped (not yet present): {}", sql);
                }
            }
        } catch (SQLException e) {
            log.warn("SumoBase column stabilization error: {}", e.getMessage());
        }
    }
}
