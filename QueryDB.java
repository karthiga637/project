import java.sql.*;
public class QueryDB {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection c = DriverManager.getConnection("jdbc:mysql://localhost:3306/smartloan?useSSL=false&serverTimezone=UTC", "root", "karthi2006")) {
            ResultSet rs = c.createStatement().executeQuery("DESCRIBE loans");
            while (rs.next()) {
                System.out.println(rs.getString(1) + " " + rs.getString(2));
            }
        }
    }
}
