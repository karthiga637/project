package com.smartloan;

import java.sql.Connection;
import java.sql.PreparedStatement;

public class DeleteFiveCustomers {
    public static void main(String[] args) {
        int[] ids = {61, 60, 58, 52, 42};
        try (Connection con = DBConnection.getConnection()) {
            for (int id : ids) {
                try {
                    PreparedStatement psEmi = con.prepareStatement("DELETE FROM emi_schedule WHERE loan_id IN (SELECT id FROM loans WHERE customer_id = ?)");
                    psEmi.setInt(1, id);
                    psEmi.executeUpdate();

                    PreparedStatement psLoans = con.prepareStatement("DELETE FROM loans WHERE customer_id = ?");
                    psLoans.setInt(1, id);
                    psLoans.executeUpdate();
                } catch (Exception e) {
                    System.out.println("No loans for customer ID: " + id);
                }

                PreparedStatement psCust = con.prepareStatement("DELETE FROM customers WHERE id = ?");
                psCust.setInt(1, id);
                int count = psCust.executeUpdate();
                System.out.println("Deleted Customer ID " + id + " -> Rows affected: " + count);
            }
            System.out.println("Targeted 5 customers deletion complete!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
