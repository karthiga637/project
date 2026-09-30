package com.smartloan;
import java.sql.*;
public class SeedBanksV2 {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            try {
                con.createStatement().execute("ALTER TABLE bank_products ADD COLUMN min_amount DECIMAL(15,2)");
                con.createStatement().execute("ALTER TABLE bank_products ADD COLUMN max_amount DECIMAL(15,2)");
            } catch (Exception e) {} // ignore if already exists
            
            con.createStatement().execute("DELETE FROM bank_products");
            con.createStatement().execute("DELETE FROM banks");
            
            String insertBank = "INSERT INTO banks (bank_name) VALUES (?)";
            PreparedStatement psB = con.prepareStatement(insertBank, Statement.RETURN_GENERATED_KEYS);
            
            String insertProd = "INSERT INTO bank_products (bank_id, loan_type, interest_rate, min_amount, max_amount) VALUES (?, ?, ?, ?, ?)";
            PreparedStatement psP = con.prepareStatement(insertProd);
            
            Object[][] banks = {
                {"HDFC", new Object[][]{ {"Home Loan", 8.50, 1000000.0, 7500000.0}, {"Personal Loan", 10.99, 50000.0, 4000000.0}, {"Education Loan", 9.50, 100000.0, 3000000.0} }},
                {"ICICI Bank", new Object[][]{ {"Home Loan", 8.75, 1000000.0, 7500000.0}, {"Personal Loan", 11.25, 50000.0, 4000000.0}, {"Education Loan", 9.75, 100000.0, 3000000.0} }},
                {"Indian Overseas Bank (IOB)", new Object[][]{ {"Home Loan", 8.25, 500000.0, 5000000.0}, {"Personal Loan", 10.75, 50000.0, 2000000.0}, {"Education Loan", 9.25, 50000.0, 2500000.0} }}
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
                        psP.setDouble(4, (Double)p[2]);
                        psP.setDouble(5, (Double)p[3]);
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
