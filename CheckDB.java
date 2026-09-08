import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDB {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/smartloan", "root", "karthi2006");
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM customers WHERE role = 'Bank Manager'");
            while (rs.next()) {
                System.out.println("Found Bank Manager: " + rs.getString("email"));
            }
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
