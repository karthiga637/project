import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DeleteUsers {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/smartloan", "root", "karthi2006");
            Statement stmt = conn.createStatement();
            int rows = stmt.executeUpdate("DELETE FROM customers WHERE email = '24ucs24@tcarts.in'");
            System.out.println("Deleted " + rows + " row(s).");
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
