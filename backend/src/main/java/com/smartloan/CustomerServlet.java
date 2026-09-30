package com.smartloan;

import java.io.*;
import java.util.*;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

@WebServlet("/customers")
public class CustomerServlet extends HttpServlet {

    private final CustomerDAO dao = new CustomerDAO();

    private void cors(HttpServletResponse res) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setContentType("application/json");
        res.setCharacterEncoding("UTF-8");
    }

    // GET /customers          → list all customers
    // GET /customers?action=stats → dashboard stats
    protected void doGet(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String action = req.getParameter("action");
        PrintWriter out = res.getWriter();
        if ("stats".equals(action)) {
            out.write(mapToJson(dao.getDashboardStats()));
        } else {
            out.write(listToJson(dao.getAllCustomers()));
        }
    }

    // POST /customers → add new customer
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String json = readBody(req);
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(json, java.util.Map.class);

            String fn = (String) data.get("firstName");
            String ln = (String) data.get("lastName");
            String em = (String) data.get("email");
            String mob = (String) data.get("mobile");
            String role = (String) data.get("role");

            boolean ok = false;
            boolean emailSent = true;
            String generatedPwd = null;
            if ("BankManager".equals(role)) {
                generatedPwd = (String) data.get("password");
                int bankId = Integer.parseInt(data.get("bank_id").toString());
                String city = data.containsKey("city") ? (String) data.get("city") : "";
                String branch = data.containsKey("branch") ? (String) data.get("branch") : "";
                String address = city.isEmpty() ? branch : city + " - " + branch;
                ok = dao.addBankManager(fn, ln, em, mob, generatedPwd, bankId, address);
                if (ok) {
                    emailSent = false; // Email sending removed per user request
                }
            } else {
                String adr = (String) data.get("address");
                String occ = (String) data.get("occupation");
                double inc = data.containsKey("income") && data.get("income") != null && !data.get("income").toString().isEmpty() ? Double.parseDouble(data.get("income").toString()) : 0;
                String lt  = (String) data.get("loanType");
                String dob = (String) data.get("dob");
                if (dob == null || dob.trim().isEmpty()) {
                    dob = "2000-01-01";
                }
                Integer customerBankId = null;
                String branchName = null;
                if (data.containsKey("branch_name") && data.get("branch_name") != null && !data.get("branch_name").toString().trim().isEmpty()) {
                    branchName = data.get("branch_name").toString().trim();
                }
                if (data.containsKey("manager_email") && data.get("manager_email") != null && !data.get("manager_email").toString().isEmpty()) {
                    String mgrEmail = data.get("manager_email").toString();
                    Map<String, Object> mgr = dao.getCustomerByEmail(mgrEmail);
                    if (mgr != null) {
                        if (mgr.containsKey("bank_id") && mgr.get("bank_id") != null) {
                            customerBankId = Integer.parseInt(mgr.get("bank_id").toString());
                        }
                        if (branchName == null || branchName.isEmpty()) {
                            if (mgr.containsKey("address") && mgr.get("address") != null && !mgr.get("address").toString().trim().isEmpty()) {
                                branchName = mgr.get("address").toString().trim();
                            } else if (mgr.containsKey("branch_name") && mgr.get("branch_name") != null && !mgr.get("branch_name").toString().trim().isEmpty()) {
                                branchName = mgr.get("branch_name").toString().trim();
                            }
                        }
                    }
                }
                if (customerBankId == null && data.containsKey("bank_id") && data.get("bank_id") != null && !data.get("bank_id").toString().isEmpty()) {
                    customerBankId = Integer.parseInt(data.get("bank_id").toString());
                }
                String mgrEmail = data.containsKey("manager_email") && data.get("manager_email") != null ? data.get("manager_email").toString() : null;
                ok = dao.addCustomer(fn, ln, em, mob, adr, occ, inc, lt, dob, customerBankId, branchName, mgrEmail);
            }
            
            if (ok && "BankManager".equals(role)) {
                res.getWriter().write("{\"status\":\"success\", \"emailSent\":" + emailSent + ", \"password\":\"" + generatedPwd + "\"}");
            } else {
                res.getWriter().write(ok ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
            }
        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    // PUT /customers → update customer profile
    protected void doPut(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        String json = readBody(req);
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(json, java.util.Map.class);

            int id = Integer.parseInt(data.get("id").toString());
            String fn = (String) data.get("firstName");
            String ln = (String) data.get("lastName");
            String mob = (String) data.get("mobile");
            String adr = (String) data.get("address");
            String occ = (String) data.get("occupation");
            double inc = data.containsKey("income") && data.get("income") != null && !data.get("income").toString().isEmpty() 
                        ? Double.parseDouble(data.get("income").toString()) : 0;

            boolean ok = dao.updateCustomer(id, fn, ln, mob, adr, occ, inc);
            res.getWriter().write(ok ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
        } catch (Exception e) {
            res.setStatus(500);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    // DELETE /customers?id=X
    protected void doDelete(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res);
        int id = Integer.parseInt(req.getParameter("id"));
        res.getWriter().write(dao.deleteCustomer(id) ? "{\"status\":\"success\"}" : "{\"status\":\"failed\"}");
    }

    protected void doOptions(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        cors(res); res.setStatus(200);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private String readBody(HttpServletRequest req) throws IOException {
        req.setCharacterEncoding("UTF-8");
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) { String l; while ((l=br.readLine())!=null) sb.append(l); }
        return sb.toString();
    }

    private String str(String json, String key) {
        try { return json.split("\"" + key + "\":\"")[1].split("\"")[0]; } catch (Exception e) { return ""; }
    }

    private double num(String json, String key) {
        try { return Double.parseDouble(json.split("\"" + key + "\":")[1].split("[,}]")[0].trim()); }
        catch (Exception e) { return 0; }
    }

    private String mapToJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> sb.append("\"").append(k).append("\":").append(v instanceof String ? "\"" + v + "\"" : v).append(","));
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        return sb.append("}").toString();
    }

    private String listToJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (Map<String, Object> m : list) sb.append(mapToJson(m)).append(",");
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        return sb.append("]").toString();
    }
}
