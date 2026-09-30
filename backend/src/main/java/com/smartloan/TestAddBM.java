package com.smartloan;
import java.sql.*;
public class TestAddBM {
    public static void main(String[] args) {
        CustomerDAO dao = new CustomerDAO();
        try {
            boolean success = dao.addBankManager("Test", "BM", "bm@test.com", "9999999999", "password", 1, "");
            System.out.println("BM added: " + success);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
