package com.smartloan;

import java.io.*;
import java.sql.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebServlet("/bank-products")
public class BankProductServlet extends HttpServlet {

    private final ObjectMapper mapper = new ObjectMapper();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        cors(res);
        res.setStatus(200);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        cors(res);
        ensureProductsExist();
        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, loan_type, interest_rate FROM bank_products ORDER BY id ASC")) {

            List<Map<String, Object>> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", rs.getInt("id"));
                map.put("loanType", rs.getString("loan_type"));
                map.put("interestRate", rs.getDouble("interest_rate"));
                list.add(map);
            }

            res.getWriter().write(mapper.writeValueAsString(list));

        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        cors(res);
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = req.getReader()) {
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
            }

            Map<?, ?> body = mapper.readValue(sb.toString(), Map.class);
            Object idObj = body.get("id");
            Object loanTypeObj = body.get("loanType");
            Object rateObj = body.get("interestRate");

            if (rateObj == null) {
                res.setStatus(400);
                res.getWriter().write("{\"status\":\"error\",\"message\":\"interestRate is required\"}");
                return;
            }

            double newRate = Double.parseDouble(rateObj.toString());
            boolean updated = false;

            try (Connection con = DBConnection.getConnection()) {
                if (idObj != null && !idObj.toString().isEmpty()) {
                    int id = Integer.parseInt(idObj.toString());
                    PreparedStatement ps = con.prepareStatement("UPDATE bank_products SET interest_rate = ? WHERE id = ?");
                    ps.setDouble(1, newRate);
                    ps.setInt(2, id);
                    updated = ps.executeUpdate() > 0;
                } else if (loanTypeObj != null && !loanTypeObj.toString().trim().isEmpty()) {
                    String loanType = loanTypeObj.toString().trim();
                    PreparedStatement ps = con.prepareStatement("UPDATE bank_products SET interest_rate = ? WHERE loan_type = ?");
                    ps.setDouble(1, newRate);
                    ps.setString(2, loanType);
                    updated = ps.executeUpdate() > 0;

                    if (!updated) {
                        PreparedStatement ins = con.prepareStatement("INSERT INTO bank_products (loan_type, interest_rate) VALUES (?, ?)");
                        ins.setString(1, loanType);
                        ins.setDouble(2, newRate);
                        updated = ins.executeUpdate() > 0;
                    }
                }
            }

            if (updated) {
                res.getWriter().write("{\"status\":\"success\",\"message\":\"Loan product saved successfully\"}");
            } else {
                res.setStatus(400);
                res.getWriter().write("{\"status\":\"failed\",\"message\":\"Could not save loan product\"}");
            }

        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        doPut(req, res);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        cors(res);
        String idStr = req.getParameter("id");
        if (idStr == null || idStr.isEmpty()) {
            res.setStatus(400);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"id parameter required\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            int id = Integer.parseInt(idStr);
            PreparedStatement ps = con.prepareStatement("DELETE FROM bank_products WHERE id = ?");
            ps.setInt(1, id);
            boolean deleted = ps.executeUpdate() > 0;
            res.getWriter().write(deleted ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    private void ensureProductsExist() {
        Object[][] defaults = {
            {"Personal Loan", 12.50},
            {"Home Loan", 8.50},
            {"Car Loan", 9.50},
            {"Education Loan", 10.50},
            {"Business Loan", 12.00},
            {"Two-Wheeler Loan", 11.00}
        };

        try (Connection con = DBConnection.getConnection()) {
            // Deduplicate bank_products table: Keep smallest ID for each loan_type and remove duplicates
            try {
                con.createStatement().executeUpdate("DELETE t1 FROM bank_products t1 INNER JOIN bank_products t2 WHERE t1.id > t2.id AND t1.loan_type = t2.loan_type");
            } catch (Exception ex) {}

            for (Object[] d : defaults) {
                String loanType = (String) d[0];
                double rate = (Double) d[1];

                PreparedStatement check = con.prepareStatement("SELECT id FROM bank_products WHERE loan_type = ?");
                check.setString(1, loanType);
                ResultSet rs = check.executeQuery();
                if (!rs.next()) {
                    PreparedStatement ins = con.prepareStatement("INSERT INTO bank_products (loan_type, interest_rate) VALUES (?, ?)");
                    ins.setString(1, loanType);
                    ins.setDouble(2, rate);
                    ins.executeUpdate();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
