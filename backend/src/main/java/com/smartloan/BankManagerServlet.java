package com.smartloan;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebServlet("/bankmanager/*")
public class BankManagerServlet extends HttpServlet {
    
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session == null || !"BankManager".equals(session.getAttribute("role"))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Unauthorized\"}");
            return;
        }
        
        Integer bankId = (Integer) session.getAttribute("bank_id");
        if (bankId == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"error\": \"No bank assigned\"}");
            return;
        }

        String path = request.getPathInfo();
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();
        
        if ("/analytics".equals(path)) {
            out.write(mapper.writeValueAsString(getAnalytics(bankId)));
        } else if ("/products".equals(path)) {
            out.write(mapper.writeValueAsString(getProducts(bankId)));
        } else if ("/leads".equals(path)) {
            out.write(mapper.writeValueAsString(getLeads(bankId)));
        } else {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session == null || !"BankManager".equals(session.getAttribute("role"))) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        
        Integer bankId = (Integer) session.getAttribute("bank_id");
        if (bankId == null) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String path = request.getPathInfo();
        if ("/products".equals(path)) {
            try {
                Map<String, Object> data = mapper.readValue(request.getReader(), Map.class);
                int productId = ((Double) data.get("id")).intValue();
                double newRate = (Double) data.get("interest_rate");
                
                boolean updated = updateProductRate(productId, bankId, newRate);
                response.setContentType("application/json");
                if (updated) {
                    response.getWriter().write("{\"status\":\"success\"}");
                } else {
                    response.getWriter().write("{\"status\":\"error\"}");
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    private Map<String, Object> getAnalytics(int bankId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps1 = con.prepareStatement("SELECT COUNT(*) as total FROM loans l JOIN bank_products bp ON l.loan_type = bp.loan_type WHERE bp.bank_id = ?");
            ps1.setInt(1, bankId);
            ResultSet r1 = ps1.executeQuery();
            if (r1.next()) stats.put("totalLoans", r1.getInt("total"));

            PreparedStatement ps2 = con.prepareStatement("SELECT COALESCE(SUM(l.outstanding_balance),0) as total FROM loans l JOIN bank_products bp ON l.loan_type = bp.loan_type WHERE bp.bank_id = ?");
            ps2.setInt(1, bankId);
            ResultSet r2 = ps2.executeQuery();
            if (r2.next()) stats.put("totalOutstanding", r2.getDouble("total"));
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        return stats;
    }

    private List<Map<String, Object>> getProducts(int bankId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("SELECT id, loan_type, interest_rate FROM bank_products WHERE bank_id = ?");
            ps.setInt(1, bankId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("loan_type", rs.getString("loan_type"));
                row.put("interest_rate", rs.getDouble("interest_rate"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
    
    private boolean updateProductRate(int productId, int bankId, double newRate) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("UPDATE bank_products SET interest_rate = ? WHERE id = ? AND bank_id = ?");
            ps.setDouble(1, newRate);
            ps.setInt(2, productId);
            ps.setInt(3, bankId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private List<Map<String, Object>> getLeads(int bankId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement(
                "SELECT l.id, c.first_name, c.last_name, c.email, c.mobile, l.loan_type, l.status, l.created_at " +
                "FROM leads l JOIN customers c ON l.customer_id = c.id WHERE l.bank_id = ? ORDER BY l.created_at DESC"
            );
            ps.setInt(1, bankId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("customer_name", rs.getString("first_name") + " " + rs.getString("last_name"));
                row.put("email", rs.getString("email"));
                row.put("mobile", rs.getString("mobile"));
                row.put("loan_type", rs.getString("loan_type"));
                row.put("status", rs.getString("status"));
                row.put("created_at", rs.getString("created_at"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}
