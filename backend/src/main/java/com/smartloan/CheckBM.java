package com.smartloan;
import java.sql.*;
public class CheckBM {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SELECT email, password FROM customers WHERE email LIKE '%sivaranjani%'");
            while(rs.next()) { 
                String pwd = rs.getString("password");
                System.out.println("Email: " + rs.getString("email") + " | Password: '" + pwd + "' | Length: " + (pwd != null ? pwd.length() : 0)); 
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
