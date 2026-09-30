package com.smartloan;
import java.sql.*;
public class CheckBankProducts {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SHOW CREATE TABLE bank_products");
            if (rs.next()) {
                System.out.println(rs.getString(2));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
