package com.smartloan;

import java.util.HashMap;
import java.util.Map;

public class AIInsightsService {

    // 1. Dynamic Tenure-Aware Logistic Regression Algorithm: Eligibility (DTI & FOIR Driven)
    public Map<String, Object> predictEligibility(double income, double loanAmount, int tenureMonths, double annualInterestRate) {
        if (tenureMonths <= 0) tenureMonths = 24;
        if (annualInterestRate <= 0) annualInterestRate = 10.5;
        if (income <= 0) income = 1.0;

        double r = (annualInterestRate / 100.0) / 12.0;
        double emi = 0;
        if (loanAmount > 0 && r > 0) {
            double factor = Math.pow(1 + r, tenureMonths);
            emi = (loanAmount * r * factor) / (factor - 1);
        } else if (loanAmount > 0) {
            emi = loanAmount / tenureMonths;
        }

        // Debt-to-Income ratio (FOIR) & Leverage
        double dti = emi / income;
        double loanToAnnualIncome = loanAmount / (income * 12.0);

        // Logistic Regression log-odds Z:
        // Base intercept +3.5. Heavy penalty if EMI consumes high fraction of income (-8.0 * dti),
        // and leverage penalty (-0.5 * loanToAnnualIncome).
        double z = 3.5 - (8.0 * dti) - (0.5 * loanToAnnualIncome);
        if (z > 6.0) z = 6.0;
        if (z < -6.0) z = -6.0;

        double probability = 1.0 / (1.0 + Math.exp(-z));
        if (probability > 0.98) probability = 0.98;
        if (probability < 0.02) probability = 0.02;

        Map<String, Object> result = new HashMap<>();
        result.put("probability", probability);
        result.put("eligible", probability >= 0.5);
        result.put("emi", Math.round(emi));
        result.put("dtiPercent", Math.round(dti * 1000.0) / 10.0);
        return result;
    }

    public Map<String, Object> predictEligibility(double income, double loanAmount) {
        return predictEligibility(income, loanAmount, 24, 10.5);
    }

    // 2. Decision Tree Algorithm: EMI Urgency
    public Map<String, Object> getEMIUrgency(int daysOverdue) {
        Map<String, Object> result = new HashMap<>();
        if (daysOverdue > 30) {
            result.put("urgency", "Urgent");
        } else if (daysOverdue > 0) {
            result.put("urgency", "Medium");
        } else {
            result.put("urgency", "Low");
        }
        return result;
    }

    // 3. Linear Regression / Accelerated Amortization Model: Early Closure Predictor
    public Map<String, Object> predictEarlyClosure(double currentEmi, double extraEmi, double outstandingBalance, double annualInterestRate) {
        Map<String, Object> result = new HashMap<>();
        if (annualInterestRate <= 0) annualInterestRate = 12.0;
        double r = (annualInterestRate / 100.0) / 12.0; // Monthly interest rate
        double newEmi = currentEmi + extraEmi;
        
        double term1 = 1.0 - (outstandingBalance * r / newEmi);
        if (term1 <= 0 || newEmi <= outstandingBalance * r) {
            result.put("error", "Payment too low to cover interest");
            return result;
        }
        
        double newTenure = -Math.log(term1) / Math.log(1 + r);
        int newTenureMonths = (int) Math.ceil(newTenure);
        
        double oldTerm1 = 1.0 - (outstandingBalance * r / currentEmi);
        int oldTenureMonths = oldTerm1 > 0 ? (int) Math.ceil(-Math.log(oldTerm1) / Math.log(1 + r)) : 12;
        
        int monthsSaved = Math.max(0, oldTenureMonths - newTenureMonths);
        
        double originalTotalPaid = currentEmi * oldTenureMonths;
        double newTotalPaid = newEmi * newTenureMonths;
        double interestSaved = Math.max(0, originalTotalPaid - newTotalPaid);
        
        result.put("newTenure", newTenureMonths);
        result.put("monthsSaved", monthsSaved);
        result.put("interestSaved", Math.round(interestSaved));
        return result;
    }

    // 4. Recommendation System Algorithm
    public Map<String, Object> recommendLoan(double income, String occupation) {
        return recommendLoan(income, occupation, "");
    }

    public Map<String, Object> recommendLoan(double income, String occupation, String goal) {
        Map<String, Object> result = new HashMap<>();
        String product;
        double rate;
        double maxAmount;
        String matchBadge;
        String rationale;
        String alternative;
        int compatibility;

        String occ = occupation != null ? occupation.trim() : "";
        String g = goal != null ? goal.trim() : "";

        if ("Home".equalsIgnoreCase(g) || income > 100000) {
            product = "Home Loan";
            rate = 8.5;
            maxAmount = Math.max(income * 60, 2500000);
            compatibility = 98;
            matchBadge = "Top Match (98% Compatibility)";
            rationale = "High-income stability qualifies for prime residential property loans with long tenure and maximum tax benefits.";
            alternative = "Car Loan @ 9.0% or Personal Loan @ 12.5%";
        } else if ("Student".equalsIgnoreCase(occ) || "Education".equalsIgnoreCase(g)) {
            product = "Education Loan";
            rate = 9.5;
            maxAmount = Math.max(500000, income * 30);
            compatibility = 96;
            matchBadge = "Student Priority (96% Compatibility)";
            rationale = "Subsidized interest rate with flexible repayment moratorium until course completion.";
            alternative = "Personal Loan @ 12.5%";
        } else if ("Business Owner".equalsIgnoreCase(occ) || "Business".equalsIgnoreCase(g) || income > 75000) {
            product = "Business Loan";
            rate = 12.0;
            maxAmount = Math.max(income * 24, 1000000);
            compatibility = 95;
            matchBadge = "Working Capital Match (95% Compatibility)";
            rationale = "Designed for working capital, business expansion, and equipment financing with minimal collateral requirements.";
            alternative = "Gold Loan @ 7.5% or Personal Loan @ 12.5%";
        } else if ("Vehicle".equalsIgnoreCase(g) || (income >= 30000 && income <= 75000)) {
            product = "Car / Vehicle Loan";
            rate = 9.0;
            maxAmount = Math.max(income * 18, 500000);
            compatibility = 94;
            matchBadge = "Auto Finance Match (94% Compatibility)";
            rationale = "Competitive fixed rates for new or certified pre-owned vehicles with flexible 3 to 7 year repayment terms.";
            alternative = "Two-Wheeler Loan @ 11.0% or Personal Loan @ 12.5%";
        } else {
            product = "Personal Loan";
            rate = 12.5;
            maxAmount = Math.max(income * 12, 100000);
            compatibility = 92;
            matchBadge = "Instant Disbursal (92% Compatibility)";
            rationale = "Zero-collateral multipurpose financing with rapid digital verification and 24-hour fund disbursal.";
            alternative = "Gold Loan @ 7.5%";
        }

        result.put("status", "success");
        result.put("product", product);
        result.put("recommendation", product + " (" + rate + "%)");
        result.put("interestRate", rate);
        result.put("maxEligibleAmount", maxAmount);
        result.put("compatibility", compatibility);
        result.put("matchBadge", matchBadge);
        result.put("rationale", rationale);
        result.put("alternative", alternative);
        return result;
    }
}
