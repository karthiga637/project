package com.smartloan;
import java.sql.*;
public class CheckLoans {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SELECT loan_type FROM loans");
            while(rs.next()) { System.out.println(rs.getString(1)); }
        } catch (Exception e) {}
    }
}
