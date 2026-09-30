package com.smartloan;

import java.sql.*;
import java.util.*;

public class LoanDAO {

    // ── Get All Loans ──────────────────────────────────────────────────────────
    public List<Map<String, Object>> getAllLoans() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT l.*, CONCAT(c.first_name,' ',c.last_name) as customer_name " +
                         "FROM loans l JOIN customers c ON l.customer_id=c.id ORDER BY l.id DESC";
            ResultSet rs = con.prepareStatement(sql).executeQuery();
            while (rs.next()) {
                list.add(mapLoan(rs));
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    // ── Get Loan By ID ─────────────────────────────────────────────────────────
    public Map<String, Object> getLoanById(int id) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT l.*, CONCAT(c.first_name,' ',c.last_name) as customer_name " +
                         "FROM loans l JOIN customers c ON l.customer_id=c.id WHERE l.id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapLoan(rs);
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    // ── Get Loans By Customer ID ───────────────────────────────────────────────
    public List<Map<String, Object>> getLoansByCustomerId(int customerId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT l.*, CONCAT(c.first_name,' ',c.last_name) as customer_name " +
                         "FROM loans l JOIN customers c ON l.customer_id=c.id WHERE l.customer_id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) list.add(mapLoan(rs));
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    // ── Add Loan ───────────────────────────────────────────────────────────────
    public boolean addLoan(int customerId, String loanType, double loanAmount,
                           double interestRate, int tenureMonths, String startDate) {
        try (Connection con = DBConnection.getConnection()) {
            // Calculate EMI: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
            double r = interestRate / (12 * 100);
            double emi = loanAmount * r * Math.pow(1 + r, tenureMonths)
                         / (Math.pow(1 + r, tenureMonths) - 1);

            String sql = "INSERT INTO loans (customer_id, loan_type, loan_amount, interest_rate, tenure_months, emi_amount, outstanding_balance, start_date, status) VALUES (?,?,?,?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, customerId);
            ps.setString(2, loanType);
            ps.setDouble(3, loanAmount);
            ps.setDouble(4, interestRate);
            ps.setInt(5, tenureMonths);
            ps.setDouble(6, Math.round(emi * 100.0) / 100.0);
            ps.setDouble(7, loanAmount);
            ps.setString(8, startDate);
            ps.setString(9, "Pending"); // Changed from Active to Pending
            int rows = ps.executeUpdate();

            return rows > 0;
        } catch (Exception e) { e.printStackTrace(); }
        return false;
    }

    // Approve Loan
    public boolean approveLoan(int loanId) {
        try (Connection con = DBConnection.getConnection()) {
            // 1. Get loan details to generate EMIs
            String getSql = "SELECT l.*, c.email, c.first_name, c.last_name FROM loans l JOIN customers c ON l.customer_id = c.id WHERE l.id = ? AND l.status = 'Pending'";
            PreparedStatement getPs = con.prepareStatement(getSql);
            getPs.setInt(1, loanId);
            ResultSet rs = getPs.executeQuery();
            
            if (rs.next()) {
                double loanAmount = rs.getDouble("loan_amount");
                double emi = rs.getDouble("emi_amount");
                double interestRate = rs.getDouble("interest_rate");
                int tenureMonths = rs.getInt("tenure_months");
                String startDate = rs.getString("start_date");
                String loanType = rs.getString("loan_type");
                
                String customerEmail = rs.getString("email");
                String customerName = rs.getString("first_name") + " " + rs.getString("last_name");
                
                // 2. Update status to Active
                String updateSql = "UPDATE loans SET status = 'Active' WHERE id = ?";
                PreparedStatement updatePs = con.prepareStatement(updateSql);
                updatePs.setInt(1, loanId);
                int updated = updatePs.executeUpdate();
                
                if (updated > 0) {
                    // 3. Generate EMIs
                    generateEMISchedule(con, loanId, loanAmount, emi, interestRate, tenureMonths, startDate);
                    
                    // 4. Send Async Approval Email
                    EmailService.sendLoanApprovalEmailAsync(customerEmail, customerName, loanAmount, loanType);
                    
                    return true;
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return false;
    }

    // ── Update Loan Status ─────────────────────────────────────────────────────
    public boolean updateLoanStatus(int loanId, String status) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "UPDATE loans SET status=? WHERE id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, status);
            ps.setInt(2, loanId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) { e.printStackTrace(); }
        return false;
    }

    // ── Generate EMI Schedule ──────────────────────────────────────────────────
    private void generateEMISchedule(Connection con, int loanId, double principal,
                                     double emi, double annualRate, int months,
                                     String startDate) throws Exception {
        double monthlyRate = annualRate / (12 * 100);
        double balance = principal;
        String sql = "INSERT INTO emi_schedule (loan_id, installment_no, due_date, emi_amount, principal_component, interest_component, outstanding_balance, status) VALUES (?,?,?,?,?,?,?,?)";
        PreparedStatement ps = con.prepareStatement(sql);

        java.time.LocalDate date = java.time.LocalDate.parse(startDate);
        for (int i = 1; i <= months; i++) {
            date = date.plusMonths(1);
            double interest = balance * monthlyRate;
            double principalPart = emi - interest;
            balance -= principalPart;
            if (balance < 0) balance = 0;

            ps.setInt(1, loanId);
            ps.setInt(2, i);
            ps.setString(3, date.toString());
            ps.setDouble(4, Math.round(emi * 100.0) / 100.0);
            ps.setDouble(5, Math.round(principalPart * 100.0) / 100.0);
            ps.setDouble(6, Math.round(interest * 100.0) / 100.0);
            ps.setDouble(7, Math.round(balance * 100.0) / 100.0);
            ps.setString(8, "Pending");
            ps.addBatch();
        }
        ps.executeBatch();
    }

    // ── Get EMI Schedule for Loan ──────────────────────────────────────────────
    public List<Map<String, Object>> getEMISchedule(int loanId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement(
                "SELECT * FROM emi_schedule WHERE loan_id=? ORDER BY installment_no");
            ps.setInt(1, loanId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("loanId", rs.getInt("loan_id"));
                row.put("installmentNo", rs.getInt("installment_no"));
                row.put("dueDate", rs.getString("due_date"));
                row.put("emiAmount", rs.getDouble("emi_amount"));
                row.put("principalComponent", rs.getDouble("principal_component"));
                row.put("interestComponent", rs.getDouble("interest_component"));
                row.put("outstandingBalance", rs.getDouble("outstanding_balance"));
                row.put("status", rs.getString("status"));
                row.put("paidDate", rs.getString("paid_date"));
                list.add(row);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    // ── Get All EMI Records ────────────────────────────────────────────────────
    public List<Map<String, Object>> getAllEMIs() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT e.*, l.loan_type, CONCAT(c.first_name,' ',c.last_name) as customer_name " +
                         "FROM emi_schedule e JOIN loans l ON e.loan_id=l.id " +
                         "JOIN customers c ON l.customer_id=c.id ORDER BY e.due_date";
            ResultSet rs = con.prepareStatement(sql).executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("loanId", rs.getInt("loan_id"));
                row.put("loanType", rs.getString("loan_type"));
                row.put("customerName", rs.getString("customer_name"));
                row.put("installmentNo", rs.getInt("installment_no"));
                row.put("dueDate", rs.getString("due_date"));
                row.put("emiAmount", rs.getDouble("emi_amount"));
                row.put("principalComponent", rs.getDouble("principal_component"));
                row.put("interestComponent", rs.getDouble("interest_component"));
                row.put("outstandingBalance", rs.getDouble("outstanding_balance"));
                row.put("status", rs.getString("status"));
                row.put("paidDate", rs.getString("paid_date"));
                list.add(row);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    // ── Pay EMI ────────────────────────────────────────────────────────────────
    public boolean payEMI(int emiId) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "UPDATE emi_schedule SET status='Paid', paid_date=CURDATE() WHERE id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, emiId);
            int rows = ps.executeUpdate();

            if (rows > 0) {
                // Update outstanding balance in loans table
                PreparedStatement getEmi = con.prepareStatement(
                    "SELECT loan_id, emi_amount FROM emi_schedule WHERE id=?");
                getEmi.setInt(1, emiId);
                ResultSet rs = getEmi.executeQuery();
                if (rs.next()) {
                    int loanId = rs.getInt("loan_id");
                    double emiAmt = rs.getDouble("emi_amount");
                    PreparedStatement upd = con.prepareStatement(
                        "UPDATE loans SET outstanding_balance = GREATEST(outstanding_balance - ?, 0) WHERE id=?");
                    upd.setDouble(1, emiAmt);
                    upd.setInt(2, loanId);
                    upd.executeUpdate();

                    // Check if all paid → mark loan completed
                    PreparedStatement check = con.prepareStatement(
                        "SELECT COUNT(*) as pending FROM emi_schedule WHERE loan_id=? AND status!='Paid'");
                    check.setInt(1, loanId);
                    ResultSet cr = check.executeQuery();
                    if (cr.next() && cr.getInt("pending") == 0) {
                        con.prepareStatement(
                            "UPDATE loans SET status='Completed' WHERE id=" + loanId).executeUpdate();
                    }
                }
                return true;
            }
        } catch (Exception e) { e.printStackTrace(); }
        return false;
    }

    // ── Mark Overdue EMIs ──────────────────────────────────────────────────────
    public void markOverdueEMIs() {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "UPDATE emi_schedule SET status='Overdue' WHERE status='Pending' AND due_date < CURDATE()";
            con.prepareStatement(sql).executeUpdate();
        } catch (Exception e) { e.printStackTrace(); }
    }

    // ── AI Risk Assessment ─────────────────────────────────────────────────────
    public List<Map<String, Object>> getRiskAssessment() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT l.id as loan_id, CONCAT(c.first_name,' ',c.last_name) as customer_name, " +
                         "l.loan_type, l.loan_amount, l.outstanding_balance, l.emi_amount, l.status, " +
                         "(SELECT COUNT(*) FROM emi_schedule WHERE loan_id=l.id AND status='Overdue') as overdue_count, " +
                         "(SELECT COUNT(*) FROM emi_schedule WHERE loan_id=l.id AND status='Paid') as paid_count, " +
                         "(SELECT COUNT(*) FROM emi_schedule WHERE loan_id=l.id) as total_emis " +
                         "FROM loans l JOIN customers c ON l.customer_id=c.id WHERE l.status='Active'";
            ResultSet rs = con.prepareStatement(sql).executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                int overdueCount = rs.getInt("overdue_count");
                int paidCount = rs.getInt("paid_count");
                int totalEmis = rs.getInt("total_emis");
                double loanAmt = rs.getDouble("loan_amount");
                double outstanding = rs.getDouble("outstanding_balance");

                // AI Risk Score calculation
                double riskScore = 0;
                if (overdueCount > 0) riskScore += overdueCount * 20;
                if (totalEmis > 0) {
                    double paymentRatio = (double) paidCount / totalEmis;
                    riskScore += (1 - paymentRatio) * 40;
                }
                if (loanAmt > 0) {
                    double balanceRatio = outstanding / loanAmt;
                    riskScore += balanceRatio * 30;
                }
                riskScore = Math.min(riskScore, 99);

                String riskLevel = riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";
                String recommendation;
                if (riskScore >= 70) {
                    recommendation = "Immediate follow-up required. Send payment reminder.";
                } else if (riskScore >= 40) {
                    recommendation = "Monitor closely. Offer flexible EMI options.";
                } else {
                    recommendation = "Normal monitoring. Customer is performing well.";
                }

                row.put("loanId", rs.getInt("loan_id"));
                row.put("customerName", rs.getString("customer_name"));
                row.put("loanType", rs.getString("loan_type"));
                row.put("loanAmount", loanAmt);
                row.put("outstanding", outstanding);
                row.put("emiAmount", rs.getDouble("emi_amount"));
                row.put("overdueCount", overdueCount);
                row.put("paidCount", paidCount);
                row.put("totalEmis", totalEmis);
                row.put("riskScore", Math.round(riskScore));
                row.put("riskLevel", riskLevel);
                row.put("recommendation", recommendation);
                row.put("defaultProbability", Math.round(riskScore * 0.9));
                list.add(row);
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    // ── Helper: map ResultSet row to Map ───────────────────────────────────────
    private Map<String, Object> mapLoan(ResultSet rs) throws Exception {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", rs.getInt("id"));
        row.put("customerId", rs.getInt("customer_id"));
        row.put("customerName", rs.getString("customer_name"));
        row.put("loanType", rs.getString("loan_type"));
        row.put("loanAmount", rs.getDouble("loan_amount"));
        row.put("interestRate", rs.getDouble("interest_rate"));
        row.put("tenureMonths", rs.getInt("tenure_months"));
        row.put("emiAmount", rs.getDouble("emi_amount"));
        row.put("outstandingBalance", rs.getDouble("outstanding_balance"));
        row.put("startDate", rs.getString("start_date"));
        row.put("status", rs.getString("status"));
        row.put("createdAt", rs.getString("created_at"));
        return row;
    }
}
