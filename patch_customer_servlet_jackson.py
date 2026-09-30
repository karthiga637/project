import re

path = r'C:\loan managementproject\backend\src\main\java\com\smartloan\CustomerServlet.java'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# I will replace the parsing block in doPost with Jackson
old_code = """
            String fn  = str(json, "firstName");
            String ln  = str(json, "lastName");
            String em  = str(json, "email");
            String mob = str(json, "mobile");
            String adr = str(json, "address");
            String occ = str(json, "occupation");
            double inc = num(json, "income");

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
"""

new_code = """
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(json, java.util.Map.class);
            
            String fn = (String) data.get("firstName");
            String ln = (String) data.get("lastName");
            String em = (String) data.get("email");
            String mob = (String) data.get("mobile");
            String role = (String) data.get("role");

            boolean ok = false;
            if ("BankManager".equals(role)) {
                String pwd = (String) data.get("password");
                int bankId = Integer.parseInt(data.get("bank_id").toString());
                ok = dao.addBankManager(fn, ln, em, mob, pwd, bankId);
            } else {
                String adr = (String) data.get("address");
                String occ = (String) data.get("occupation");
                double inc = data.containsKey("income") && data.get("income") != null ? Double.parseDouble(data.get("income").toString()) : 0;
                String lt  = (String) data.get("loanType");
                String dob = (String) data.get("dob");
                ok = dao.addCustomer(fn, ln, em, mob, adr, occ, inc, lt, dob);
            }
"""

code = code.replace(old_code, new_code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CustomerServlet patched with Jackson.")
