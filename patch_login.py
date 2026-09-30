import re

path = r'C:\loan managementproject\backend\src\main\java\com\smartloan\LoginServlet.java'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add session logic and fetch bank_id
old_code = """
            if (ok) {
                Map<String, Object> cust = dao.getCustomerByEmail(email);
                String role = cust != null ? (String) cust.get("role") : "Customer";
                String name = cust != null
                        ? cust.get("firstName") + " " + cust.get("lastName") : "";
                int id = cust != null ? (Integer) cust.get("id") : 0;
                response.getWriter().write(
                    "{\\"status\\":\\"success\\",\\"role\\":\\"" + role + "\\",\\"name\\":\\"" + name
                    + "\\",\\"email\\":\\"" + email + "\\",\\"id\\":" + id + "}");
            } else {
"""

new_code = """
            if (ok) {
                Map<String, Object> cust = dao.getCustomerByEmail(email);
                String role = cust != null ? (String) cust.get("role") : "Customer";
                String name = cust != null
                        ? cust.get("firstName") + " " + cust.get("lastName") : "";
                int id = cust != null ? (Integer) cust.get("id") : 0;
                
                // Set session
                HttpSession session = request.getSession(true);
                session.setAttribute("role", role);
                session.setAttribute("id", id);
                
                String bankIdJson = "";
                if ("BankManager".equals(role)) {
                    Integer bankId = dao.getBankIdForCustomer(id);
                    if (bankId != null) {
                        session.setAttribute("bank_id", bankId);
                        bankIdJson = ",\\"bank_id\\":" + bankId;
                    }
                }

                response.getWriter().write(
                    "{\\"status\\":\\"success\\",\\"role\\":\\"" + role + "\\",\\"name\\":\\"" + name
                    + "\\",\\"email\\":\\"" + email + "\\",\\"id\\":" + id + bankIdJson + "}");
            } else {
"""

code = code.replace(old_code, new_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("LoginServlet patched.")
