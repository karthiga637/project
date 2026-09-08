package com.smartloan;

import java.io.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/profile")
public class ProfileServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = request.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }

        String json = sb.toString();
        try {
            int id = Integer.parseInt(json.split("\"id\":")[1].split("[,}]")[0].trim());
            String mobile = json.split("\"mobile\":\"")[1].split("\"")[0];

            CustomerDAO dao = new CustomerDAO();
            boolean success = dao.updateMobile(id, mobile);

            if (success) {
                response.getWriter().write("{\"status\":\"success\"}");
            } else {
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"failed\"}");
            }
        } catch (Exception e) {
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\"}");
        }
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setStatus(200);
    }
}
