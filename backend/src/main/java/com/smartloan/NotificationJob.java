package com.smartloan;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class NotificationJob implements Runnable {

    @Override
    public void run() {
        System.out.println("[NOTIFICATION JOB] Starting EMI check...");

        try (Connection con = DBConnection.getConnection()) {
            // Find EMIs due in the next 3 days
            String sql = "SELECT e.id as emi_id, e.due_date, e.emi_amount, " +
                         "l.id as loan_id, l.loan_type, " +
                         "c.id as customer_id, c.email, c.first_name " +
                         "FROM emi_schedule e " +
                         "JOIN loans l ON e.loan_id = l.id " +
                         "JOIN customers c ON l.customer_id = c.id " +
                         "WHERE e.status = 'Pending' " +
                         "AND e.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)";
                         
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            
            while (rs.next()) {
                int emiId = rs.getInt("emi_id");
                String dueDate = rs.getString("due_date");
                double amount = rs.getDouble("emi_amount");
                String loanType = rs.getString("loan_type");
                int customerId = rs.getInt("customer_id");
                String email = rs.getString("email");
                String name = rs.getString("first_name");
                
                String title = "EMI Due Soon";
                String message = String.format("Dear %s, Your EMI of ₹%.2f for your %s is due on %s. Please ensure timely payment.", 
                                                name, amount, loanType, dueDate);
                
                // Check if we already sent a notification for this specific EMI on this due date
                String checkSql = "SELECT id FROM notifications WHERE customer_id = ? AND type = 'EMI_Reminder' AND message LIKE ?";
                PreparedStatement checkPs = con.prepareStatement(checkSql);
                checkPs.setInt(1, customerId);
                checkPs.setString(2, "%" + dueDate + "%");
                
                ResultSet checkRs = checkPs.executeQuery();
                if (!checkRs.next()) {
                    // Send Email / SMS Simulation
                    System.out.println("--------------------------------------------------");
                    System.out.println("[SIMULATED EMAIL/SMS NOTIFICATION]");
                    System.out.println("TO: " + email);
                    System.out.println("SUBJECT: " + title);
                    System.out.println("BODY: " + message);
                    System.out.println("--------------------------------------------------");
                    
                    // Save to Notifications table
                    String insertSql = "INSERT INTO notifications (customer_id, title, message, type) VALUES (?, ?, ?, 'EMI_Reminder')";
                    PreparedStatement insertPs = con.prepareStatement(insertSql);
                    insertPs.setInt(1, customerId);
                    insertPs.setString(2, title);
                    insertPs.setString(3, message);
                    insertPs.executeUpdate();
                }
            }
        } catch (Exception e) {
            System.err.println("[NOTIFICATION JOB] Error executing job: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
