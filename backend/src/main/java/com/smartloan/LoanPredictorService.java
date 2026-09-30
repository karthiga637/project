package com.smartloan;

import java.util.HashMap;
import java.util.Map;

public class LoanPredictorService {

    public static Map<String, Object> predict(double income, double loanAmount, int tenure, int creditScore, int age) {
        Map<String, Object> result = new HashMap<>();

        // 1. Hard Rules
        if (creditScore < 500) {
            result.put("approved", false);
            result.put("probability", 5.0);
            result.put("insight", "Critical: Credit score is too low. Minimum required is 500.");
            return result;
        }

        if (income <= 0) {
            result.put("approved", false);
            result.put("probability", 0.0);
            result.put("insight", "Critical: Valid monthly income is required."); return result;
        }

        // 2. Financial Metrics
        // Calculate approx EMI (Assuming 12% annual interest for simplification)
        double monthlyInterestRate = 0.12 / 12;
        double emi = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenure)) 
                   / (Math.pow(1 + monthlyInterestRate, tenure) - 1);
                   
        double dti = (emi / income) * 100; // Debt-to-income percentage

        if (dti > 50.0) {
            result.put("approved", false);
            result.put("probability", 15.5);
            result.put("insight", String.format("High Risk: Estimated EMI Rs.%.0f exceeds 50% of your monthly income.", emi));
            return result;
        }

        // 3. Logistic Regression Simulation (ML Algorithm)
        double w_score = 0.015; 
        double w_dti = -0.15;   
        double w_age = 0.02;   
        double bias = -7.5;

        double z = bias + (creditScore * w_score) + (dti * w_dti) + (age * w_age);

        // Sigmoid function
        double probability = 1.0 / (1.0 + Math.exp(-z));
        double probPercentage = Math.round((probability * 100) * 100.0) / 100.0;

        boolean approved = probPercentage >= 65.0; // ML Approval Threshold

        result.put("approved", approved);
        result.put("probability", probPercentage);
        
        if (approved) {
            if (probPercentage > 85.0) {
                result.put("insight", "Excellent Profile! Very high probability of automated approval.");
            } else {
                result.put("insight", "Good Profile. Meets the standard criteria for loan approval.");
            }
        } else {
            result.put("insight", "Moderate Risk. Consider requesting a lower amount or extending the tenure to reduce EMI.");
        }

        return result;
    }
}
