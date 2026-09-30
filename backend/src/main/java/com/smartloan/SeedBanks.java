package com.smartloan;
import java.sql.*;
public class SeedBanks {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            con.createStatement().execute("DELETE FROM bank_products");
            con.createStatement().execute("DELETE FROM banks");
            
            // Insert Banks
            String insertBank = "INSERT INTO banks (bank_name) VALUES (?)";
            PreparedStatement psB = con.prepareStatement(insertBank, Statement.RETURN_GENERATED_KEYS);
            
            String insertProd = "INSERT INTO bank_products (bank_id, loan_type, interest_rate) VALUES (?, ?, ?)";
            PreparedStatement psP = con.prepareStatement(insertProd);
            
            Object[][] banks = {
                {"HDFC", new Object[][]{ {"Home Loan", 8.50}, {"Personal Loan", 10.99}, {"Education Loan", 9.50} }},
                {"ICICI Bank", new Object[][]{ {"Home Loan", 8.75}, {"Personal Loan", 11.25}, {"Education Loan", 9.75} }},
                {"Indian Overseas Bank (IOB)", new Object[][]{ {"Home Loan", 8.25}, {"Personal Loan", 10.75}, {"Education Loan", 9.25} }}
            };
            
            for (Object[] b : banks) {
                psB.setString(1, (String)b[0]);
                psB.executeUpdate();
                ResultSet rs = psB.getGeneratedKeys();
                if (rs.next()) {
                    int bankId = rs.getInt(1);
                    Object[][] prods = (Object[][])b[1];
                    for (Object[] p : prods) {
                        psP.setInt(1, bankId);
                        psP.setString(2, (String)p[0]);
                        psP.setDouble(3, (Double)p[1]);
                        psP.executeUpdate();
                    }
                }
            }
            System.out.println("Data seeded successfully!");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
