package com.smartloan;
import java.sql.*;
public class DescribeLeads {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("DESCRIBE leads");
            while(rs.next()) { System.out.println(rs.getString(1) + " " + rs.getString(2)); }
        } catch (Exception e) {}
    }
}
