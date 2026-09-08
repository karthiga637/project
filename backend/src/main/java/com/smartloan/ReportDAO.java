package com.smartloan;

import java.sql.*;
import java.util.*;

public class ReportDAO {
    
    public Map<String, Object> getDashboardReports() {
        Map<String, Object> data = new HashMap<>();
        
        try (Connection conn = DBConnection.getConnection()) {
            
            // 1. Total Loans Disbursed (Count)
            try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM loans WHERE status != 'Approved'")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) data.put("totalLoansDisbursed", rs.getInt(1));
            }
            
            // 2. Total Amount Disbursed
            try (PreparedStatement ps = conn.prepareStatement("SELECT SUM(loan_amount) FROM loans WHERE status != 'Approved'")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) data.put("totalAmountDisbursed", rs.getDouble(1));
            }
            
            // 3. Total Interest Earned
            try (PreparedStatement ps = conn.prepareStatement("SELECT SUM(interest_component) FROM emi_schedule WHERE status = 'Paid'")) {
                ResultSet rs = ps.executeQuery();
                if (rs.next()) data.put("totalInterestEarned", rs.getDouble(1));
            }
            
            // 4. Loan Status Counts
            try (PreparedStatement ps = conn.prepareStatement("SELECT status, COUNT(*) FROM loans GROUP BY status")) {
                ResultSet rs = ps.executeQuery();
                int active = 0, completed = 0, defaulted = 0;
                while (rs.next()) {
                    String status = rs.getString(1);
                    int count = rs.getInt(2);
                    if ("Active".equals(status)) active = count;
                    else if ("Completed".equals(status)) completed = count;
                    else if ("Defaulted".equals(status)) defaulted = count;
                }
                data.put("activeLoans", active);
                data.put("closedLoans", completed);
                data.put("defaultedLoans", defaulted);
            }
            
            // 5. Recent Transactions (EMIs Paid/Overdue + Loan Start)
            List<Map<String, Object>> recentTransactions = new ArrayList<>();
            String sql = 
                "SELECT CONCAT('TRX-', e.id) as id, e.due_date as date, " +
                "CONCAT(c.first_name, ' ', c.last_name) as customer, " +
                "'EMI Payment' as type, e.emi_amount as amount, " +
                "CASE WHEN e.status = 'Paid' THEN 'Success' WHEN e.status = 'Overdue' THEN 'Failed' ELSE 'Pending' END as status " +
                "FROM emi_schedule e " +
                "JOIN loans l ON e.loan_id = l.id " +
                "JOIN customers c ON l.customer_id = c.id " +
                "WHERE e.status IN ('Paid', 'Overdue') " +
                "ORDER BY e.paid_date DESC, e.due_date DESC LIMIT 5";
                
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                while (rs.next()) {
                    Map<String, Object> trx = new HashMap<>();
                    trx.put("id", rs.getString("id"));
                    trx.put("date", rs.getString("date"));
                    trx.put("customer", rs.getString("customer"));
                    trx.put("type", rs.getString("type"));
                    trx.put("amount", rs.getDouble("amount"));
                    trx.put("status", rs.getString("status"));
                    recentTransactions.add(trx);
                }
            }
            data.put("recentTransactions", recentTransactions);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return data;
    }
}
