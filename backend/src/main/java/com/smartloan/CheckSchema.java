package com.smartloan;
import java.sql.*;
public class CheckSchema {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            DatabaseMetaData meta = con.getMetaData();
            ResultSet rs = meta.getColumns(null, null, "customers", null);
            while(rs.next()) {
                System.out.println(rs.getString("COLUMN_NAME") + " - " + rs.getString("TYPE_NAME"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
