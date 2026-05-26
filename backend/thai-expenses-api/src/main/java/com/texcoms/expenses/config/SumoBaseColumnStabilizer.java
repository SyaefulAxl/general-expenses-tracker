package com.texcoms.expenses.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;

/**
 * Stabilizes SumoBase DBaaS trigger-managed columns on every new connection.
 *
 * The DBaaS uses BEFORE INSERT table triggers that dynamically add NOT NULL columns
 * (username, password_hash, full_name) WITHOUT defaults on first connection to the DB.
 * Hibernate INSERTs then fail because MySQL checks the NOT NULL constraint AFTER the
 * BEFORE INSERT trigger runs.
 *
 * This class runs ALTER TABLE statements on every new physical connection to add
 * defaults to those columns. If the column doesn't exist yet (first ever connection
 * before DBaaS trigger fires), the statement errors and is silently suppressed — the
 * DBaaS trigger will handle it on the next connection's INSERT.
 */
@Slf4j
public class SumoBaseColumnStabilizer {

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
     * Called once per physical connection by HikariCP via connectionInitSql.
     * Each SQL error (column doesn't exist yet) is silently swallowed.
     */
    public static void stabilize(DataSource ds) {
        try (Connection conn = ds.getConnection();
             Statement stmt = conn.createStatement()) {
            for (String sql : STABILIZATION_SQLS) {
                try {
                    stmt.executeUpdate(sql);
                    log.debug("Stabilized column: {}", sql.split(" ")[2]); // table.column
                } catch (SQLException e) {
                    // Column doesn't exist yet or other error — suppress and continue
                    log.debug("Skipped (not yet present): {}", sql);
                }
            }
        } catch (SQLException e) {
            log.warn("SumoBase column stabilization encountered an error: {}", e.getMessage());
        }
    }
}
