import re

path = r'C:\loan managementproject\backend\src\main\java\com\smartloan\CustomerServlet.java'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_code = """
            String lt  = str(json, "loanType");
            String dob = str(json, "dob");

            boolean ok = dao.addCustomer(fn, ln, em, mob, adr, occ, inc, lt, dob);
            res.getWriter().write(ok ? "{\\"status\\":\\"success\\"}" : "{\\"status\\":\\"failed\\"}");
"""

new_code = """
            String role = "";
            try { role = str(json, "role"); } catch (Exception ex) {}

            boolean ok = false;
            if ("BankManager".equals(role)) {
                String pwd = str(json, "password");
                String bankIdStr = str(json, "bank_id");
                int bankId = 0;
                try { bankId = Integer.parseInt(bankIdStr); } catch (Exception e) {}
                ok = dao.addBankManager(fn, ln, em, mob, pwd, bankId);
            } else {
                String lt  = str(json, "loanType");
                String dob = str(json, "dob");
                ok = dao.addCustomer(fn, ln, em, mob, adr, occ, inc, lt, dob);
            }
            res.getWriter().write(ok ? "{\\"status\\":\\"success\\"}" : "{\\"status\\":\\"failed\\"}");
"""

code = code.replace(old_code, new_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CustomerServlet patched.")
