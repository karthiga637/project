import java.sql.*;

public class CheckDBSchema {
    public static void main(String[] args) {
        try {
            Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/smart_loan", "root", "root");
            DatabaseMetaData meta = con.getMetaData();
            ResultSet rs = meta.getIndexInfo(null, null, "customers", true, false);
            System.out.println("UNIQUE INDEXES ON customers:");
            while (rs.next()) {
                System.out.println(rs.getString("INDEX_NAME") + " - " + rs.getString("COLUMN_NAME"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
