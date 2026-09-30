package com.smartloan;
import java.sql.*;
public class TestInsertUser {
    public static void main(String[] args) {
        CustomerDAO dao = new CustomerDAO();
        try {
            boolean ok = dao.addBankManager("gopi", "maharajan", "gopimaharajan637@gmail.com", "8878672347", "gopi@123", 4, "");
            System.out.println("Insert Success: " + ok);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
