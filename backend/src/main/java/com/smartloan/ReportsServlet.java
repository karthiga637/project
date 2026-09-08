package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/reports")
public class ReportsServlet extends HttpServlet {

    private ReportDAO dao = new ReportDAO();

    private void setCORS(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCORS(res);
        Map<String, Object> stats = dao.getDashboardReports();
        res.getWriter().write(toJson(stats));
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException {
        setCORS(res);
        res.setStatus(200);
    }

    @SuppressWarnings("unchecked")
    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> {
            sb.append("\"").append(k).append("\": ");
            if (v instanceof String) {
                sb.append("\"").append(v).append("\"");
            } else if (v instanceof List) {
                sb.append("[");
                List<Map<String, Object>> list = (List<Map<String, Object>>) v;
                for (int i = 0; i < list.size(); i++) {
                    sb.append(toJson(list.get(i)));
                    if (i < list.size() - 1) sb.append(",");
                }
                sb.append("]");
            } else {
                sb.append(v);
            }
            sb.append(",");
        });
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        sb.append("}");
        return sb.toString();
    }
}
