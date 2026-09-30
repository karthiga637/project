package com.smartloan;
import java.sql.*;
public class DeleteCustomer {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            PreparedStatement ps = con.prepareStatement("DELETE FROM customers WHERE email = 'sivaranjani1347@gmail.com'");
            int rows = ps.executeUpdate();
            System.out.println("Deleted rows: " + rows);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
