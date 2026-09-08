import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class DeleteUser {
    public static void main(String[] args) {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/smartloan?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true", "root", "karthi2006");
            PreparedStatement ps = con.prepareStatement("DELETE FROM customers WHERE email = ?");
            ps.setString(1, "rajanmaha492@gmail.com");
            int rows = ps.executeUpdate();
            System.out.println("Deleted " + rows + " rows.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
