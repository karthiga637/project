import re

path = r'C:\loan managementproject\backend\src\main\java\com\smartloan\CustomerDAO.java'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add a method addBankManager
new_method = """
    // Add Bank Manager
    public boolean addBankManager(String firstName, String lastName, String email, String mobile, String password, int bankId) {
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO customers (first_name, last_name, email, mobile, password, role, bank_id) VALUES (?,?,?,?,?,?,?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, password);
            ps.setString(6, "BankManager");
            ps.setInt(7, bankId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    // Get all banks
    public List<Map<String, Object>> getAllBanks() {
        List<Map<String, Object>> list = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT id, bank_name FROM banks ORDER BY bank_name";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", rs.getInt("id"));
                row.put("bank_name", rs.getString("bank_name"));
                list.add(row);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
"""

code = code.replace('public class CustomerDAO {', 'public class CustomerDAO {' + new_method)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("CustomerDAO patched.")
