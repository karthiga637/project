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
    public boolean addBankManager(String firstName, String lastName, String email, String mobile, String password, int bankId, String address) throws Exception {
        if (emailExists(email)) {
            throw new Exception("Email already exists");
        }
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, password, role, bank_id, address) VALUES (?,?,?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, password);
            ps.setString(6, "BankManager");
            ps.setInt(7, bankId);
            ps.setString(8, address);
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
            // Check if email was pre-approved by Bank Manager
            PreparedStatement check = con.prepareStatement(
                "SELECT id FROM customers WHERE email=?");
            check.setString(1, email);
            ResultSet rs = check.executeQuery();
            if (rs.next()) {
                // Email exists (Pre-approved by Bank Manager) -> Update details and password
                String sql = "UPDATE customers SET first_name=?, last_name=?, mobile=?, password=?, role=? WHERE email=?";
                PreparedStatement ps = con.prepareStatement(sql);
                ps.setString(1, firstName);
                ps.setString(2, lastName);
                ps.setString(3, mobile);
                ps.setString(4, password);
                ps.setString(5, role != null && !role.isEmpty() ? role : "Customer");
                ps.setString(6, email);
                return ps.executeUpdate() > 0;
            } else {
                // Email NOT pre-approved by Bank Manager -> Block self registration
                return false;
            }
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ── Add Customer (by Bank Manager / Admin) ──────────────────────────────────
    public boolean addCustomer(String firstName, String lastName, String email,
                               String mobile, String address, String occupation,
                               double income, String loanType, String dob, Integer bankId, String branchName, String managerEmail) throws Exception {
        if (emailExists(email)) {
            throw new Exception("Email already exists");
        }
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, address, occupation, monthly_income, preferred_loan_type, dob, password, role, bank_id, branch_name, manager_email) VALUES (?,?,?,?,?,?,?,?,?,?,'Customer',?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, address);
            ps.setString(6, occupation);
            ps.setDouble(7, income);
            ps.setString(8, loanType);
            if (dob == null || dob.trim().isEmpty()) {
                ps.setString(9, "2000-01-01");
            } else {
                ps.setString(9, dob.trim());
            }
            ps.setString(10, "UNREGISTERED"); // Customer sets their own password during registration
            if (bankId != null && bankId > 0) {
                ps.setInt(11, bankId);
            } else {
                ps.setNull(11, java.sql.Types.INTEGER);
            }
            ps.setString(12, branchName);
            ps.setString(13, managerEmail);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean addCustomer(String firstName, String lastName, String email,
                               String mobile, String address, String occupation,
                               double income, String loanType, String dob, Integer bankId, String branchName) throws Exception {
        return addCustomer(firstName, lastName, email, mobile, address, occupation, income, loanType, dob, bankId, branchName, null);
    }

    public boolean addCustomer(String firstName, String lastName, String email,
                               String mobile, String address, String occupation,
                               double income, String loanType, String dob, Integer bankId) throws Exception {
        return addCustomer(firstName, lastName, email, mobile, address, occupation, income, loanType, dob, bankId, null, null);
    }

    public boolean addCustomer(String firstName, String lastName, String email,
                               String mobile, String address, String occupation,
                               double income, String loanType, String dob) throws Exception {
        return addCustomer(firstName, lastName, email, mobile, address, occupation, income, loanType, dob, null, null, null);
    }

    // ── Get All Customers ──────────────────────────────────────────────────────
     public List<Map<String, Object>> getAllCustomers() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT id, first_name, last_name, email, mobile, role, bank_id, address, occupation, monthly_income, preferred_loan_type, created_at, branch_name, manager_email FROM customers ORDER BY id DESC";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("firstName", rs.getString("first_name"));
                row.put("lastName", rs.getString("last_name"));
                row.put("email", rs.getString("email"));
                row.put("mobile", rs.getString("mobile"));
                row.put("role", rs.getString("role"));
                row.put("bank_id", rs.getInt("bank_id"));
                row.put("address", rs.getString("address"));
                row.put("occupation", rs.getString("occupation"));
                row.put("income", rs.getDouble("monthly_income"));
                row.put("loanType", rs.getString("preferred_loan_type"));
                row.put("createdAt", rs.getString("created_at"));
                row.put("branch_name", rs.getString("branch_name"));
                row.put("manager_email", rs.getString("manager_email"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // ── Get Customer By Email ──────────────────────────────────────────────────
    
    public Map<String, Object> getCustomerById(int id) {
        try (java.sql.Connection con = DBConnection.getConnection()) {
            java.sql.PreparedStatement ps = con.prepareStatement("SELECT * FROM customers WHERE id=?");
            ps.setInt(1, id);
            java.sql.ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", rs.getInt("id"));
                map.put("firstName", rs.getString("first_name"));
                map.put("lastName", rs.getString("last_name"));
                map.put("email", rs.getString("email"));
                map.put("mobile", rs.getString("mobile"));
                map.put("role", rs.getString("role"));
                map.put("dob", rs.getString("dob"));
                map.put("monthly_income", rs.getDouble("monthly_income"));
                return map;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

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
                row.put("bank_id", rs.getInt("bank_id"));
                row.put("address", rs.getString("address"));
                row.put("branch_name", rs.getString("branch_name"));
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

    public boolean updatePassword(String email, String newPassword) {
        String sql = "UPDATE customers SET password = ? WHERE email = ?";
        try (java.sql.Connection conn = DBConnection.getConnection();
             java.sql.PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPassword);
            ps.setString(2, email);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
