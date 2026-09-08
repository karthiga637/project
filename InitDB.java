import java.sql.*;
import java.nio.file.*;

public class InitDB {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");
        try (Connection c = DriverManager.getConnection("jdbc:mysql://localhost:3306/smartloan?useSSL=false&serverTimezone=UTC&allowMultiQueries=true", "root", "karthi2006")) {
            String dropSql = new String(Files.readAllBytes(Paths.get("drop_tables.sql")));
            c.createStatement().execute(dropSql);
            System.out.println("Dropped tables");
            
            String schemaSql = new String(Files.readAllBytes(Paths.get("backend/src/main/resources/schema.sql")));
            c.createStatement().execute(schemaSql);
            System.out.println("Created tables from schema.sql");
        }
    }
}
