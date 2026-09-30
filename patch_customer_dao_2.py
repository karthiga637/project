import re

path = r'C:\loan managementproject\backend\src\main\java\com\smartloan\CustomerDAO.java'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add a method getBankIdForCustomer
new_method = """
    // Get Bank ID for Customer
    public Integer getBankIdForCustomer(int customerId) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("SELECT bank_id FROM customers WHERE id = ?");
            ps.setInt(1, customerId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                int bankId = rs.getInt("bank_id");
                if (!rs.wasNull()) return bankId;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
"""

code = code.replace('public class CustomerDAO {', 'public class CustomerDAO {' + new_method)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CustomerDAO patched for getBankIdForCustomer.")
