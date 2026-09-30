package com.smartloan;
import java.sql.*;
public class CheckBanks {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SELECT * FROM banks");
            while(rs.next()) {
                System.out.println("ID: " + rs.getInt("id") + " | Name: " + rs.getString("bank_name"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
