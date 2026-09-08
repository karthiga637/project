package com.smartloan;

import java.io.*;
import java.sql.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/bank-products")
public class BankProductServlet extends HttpServlet {

    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");

        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM bank_products ORDER BY bank_name, loan_type")) {

            StringBuilder sb = new StringBuilder("[");
            while (rs.next()) {
                sb.append("{")
                  .append("\"id\":").append(rs.getInt("id")).append(",")
                  .append("\"bankName\":\"").append(rs.getString("bank_name")).append("\",")
                  .append("\"loanType\":\"").append(rs.getString("loan_type")).append("\",")
                  .append("\"interestRate\":").append(rs.getDouble("interest_rate"))
                  .append("},");
            }
            if (sb.length() > 1) sb.setLength(sb.length() - 1);
            sb.append("]");

            res.getWriter().write(sb.toString());

        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}
