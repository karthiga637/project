package com.smartloan;

import java.sql.*;
import java.util.*;

public class CustomerDAO {
    // Get Bank ID for Customer
    public Integer getBankIdForCustomer(int customerId) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("SELECT bank_id FROM customers WHERE id = ?");
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                int bankId = rs.getInt("bank_id");
                if (!rs.wasNull()) return bankId;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // Check if email exists
    public boolean emailExists(String email) throws Exception {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("SELECT id FROM customers WHERE email=?");
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        }
    }

    // Add Bank Manager
    public boolean addBankManager(String firstName, String lastName, String email, String mobile, String password, int bankId) throws Exception {
        if (emailExists(email)) {
            throw new Exception("Email already exists");
        }
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, password, role, bank_id) VALUES (?,?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, password);
            ps.setString(6, "BankManager");
            ps.setInt(7, bankId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception(e.getMessage());
        }
    }
    
    // Get all banks
    public List<Map<String, Object>> getAllBanks() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT id, bank_name FROM banks ORDER BY bank_name";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("bank_name", rs.getString("bank_name"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }


    // ── Login ──────────────────────────────────────────────────────────────────
    public boolean login(String email, String password) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT * FROM customers WHERE email=? AND password=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, email);
            ps.setString(2, password);
            ResultSet rs = ps.executeQuery();
            return rs.next();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── Register ───────────────────────────────────────────────────────────────
    public boolean register(String firstName, String lastName, String email,
                            String mobile, String password, String role) {
        try (Connection con = DBConnection.getConnection()) {
            // Check if email already exists
            PreparedStatement check = con.prepareStatement(
                "SELECT id FROM customers WHERE email=?");
            check.setString(1, email);
            if (check.executeQuery().next()) return false;

            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, password, role) VALUES (?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, password);
            ps.setString(6, role);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── Add Customer (by admin) ────────────────────────────────────────────────
    public boolean addCustomer(String firstName, String lastName, String email,
                               String mobile, String address, String occupation,
                               double income, String loanType, String dob) throws Exception {
        if (emailExists(email)) {
            throw new Exception("Email already exists");
        }
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, address, occupation, monthly_income, preferred_loan_type, dob, password, role) VALUES (?,?,?,?,?,?,?,?,?,?,'Customer')";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, address);
            ps.setString(6, occupation);
            ps.setDouble(7, income);
            ps.setString(8, loanType);
            ps.setString(9, dob);
            ps.setString(10, "Welcome123"); // Default password
            return ps.executeUpdate() > 0;
        }
    }

    // ── Get All Customers ──────────────────────────────────────────────────────
    public List<Map<String, Object>> getAllCustomers() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT id, first_name, last_name, email, mobile, occupation, monthly_income, preferred_loan_type, created_at FROM customers ORDER BY id DESC";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("firstName", rs.getString("first_name"));
                row.put("lastName", rs.getString("last_name"));
                row.put("email", rs.getString("email"));
                row.put("mobile", rs.getString("mobile"));
                row.put("occupation", rs.getString("occupation"));
                row.put("income", rs.getDouble("monthly_income"));
                row.put("loanType", rs.getString("preferred_loan_type"));
                row.put("createdAt", rs.getString("created_at"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // ── Get Customer By Email ──────────────────────────────────────────────────
    public Map<String, Object> getCustomerByEmail(String email) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement(
                "SELECT * FROM customers WHERE email=?");
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("firstName", rs.getString("first_name"));
                row.put("lastName", rs.getString("last_name"));
                row.put("email", rs.getString("email"));
                row.put("mobile", rs.getString("mobile"));
                row.put("role", rs.getString("role"));
                return row;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // ── Update Customer ────────────────────────────────────────────────────────
    public boolean updateCustomer(int id, String firstName, String lastName,
                                  String mobile, String address, String occupation,
                                  double income) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "UPDATE customers SET first_name=?, last_name=?, mobile=?, address=?, occupation=?, monthly_income=? WHERE id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, mobile);
            ps.setString(4, address);
            ps.setString(5, occupation);
            ps.setDouble(6, income);
            ps.setInt(7, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── Delete Customer ────────────────────────────────────────────────────────
    public boolean deleteCustomer(int id) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("DELETE FROM customers WHERE id=?");
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── Dashboard Stats ────────────────────────────────────────────────────────
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        try (Connection con = DBConnection.getConnection()) {
            // Total customers
            ResultSet r1 = con.prepareStatement("SELECT COUNT(*) as total FROM customers").executeQuery();
            if (r1.next()) stats.put("totalCustomers", r1.getInt("total"));

            // Total loans
            ResultSet r2 = con.prepareStatement("SELECT COUNT(*) as total FROM loans").executeQuery();
            if (r2.next()) stats.put("totalLoans", r2.getInt("total"));

            // Total loan amount
            ResultSet r3 = con.prepareStatement("SELECT COALESCE(SUM(loan_amount),0) as total FROM loans").executeQuery();
            if (r3.next()) stats.put("totalLoanAmount", r3.getDouble("total"));

            // Overdue EMIs
            ResultSet r4 = con.prepareStatement("SELECT COUNT(*) as total FROM emi_schedule WHERE status='Overdue'").executeQuery();
            if (r4.next()) stats.put("overdueEMIs", r4.getInt("total"));

            // Active loans
            ResultSet r5 = con.prepareStatement("SELECT COUNT(*) as total FROM loans WHERE status='Active'").executeQuery();
            if (r5.next()) stats.put("activeLoans", r5.getInt("total"));

            // Approved loans
            ResultSet r6 = con.prepareStatement("SELECT COUNT(*) as total FROM loans WHERE status='Approved'").executeQuery();
            if (r6.next()) stats.put("approvedLoans", r6.getInt("total"));

            // Paid EMIs
            ResultSet r7 = con.prepareStatement("SELECT COUNT(*) as total FROM emi_schedule WHERE status='Paid'").executeQuery();
            if (r7.next()) stats.put("paidEMIs", r7.getInt("total"));

        } catch (Exception e) {
            e.printStackTrace();
        }
        return stats;
    }

    public boolean updateMobile(int customerId, String mobile) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("UPDATE customers SET mobile = ? WHERE id = ?");
            ps.setString(1, mobile);
            ps.setInt(2, customerId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
