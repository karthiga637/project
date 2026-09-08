package com.smartloan;

import java.util.HashMap;
import java.util.Map;

public class AIInsightsService {

    // 1. Logistic Regression Algorithm: Eligibility
    // Z = -5.0 + (income/10000)*1.5 - (loanAmount/100000)*1.2
    public Map<String, Object> predictEligibility(double income, double loanAmount) {
        double z = -5.0 + (income / 10000.0) * 1.5 - (loanAmount / 100000.0) * 1.2;
        double probability = 1.0 / (1.0 + Math.exp(-z));
        
        Map<String, Object> result = new HashMap<>();
        result.put("probability", probability);
        result.put("eligible", probability > 0.5);
        return result;
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

    // 3. Linear Regression Algorithm: Early Closure Predictor
    // Simulates reduction in tenure based on extra payments
    public Map<String, Object> predictEarlyClosure(double currentEmi, double extraEmi, double outstandingBalance, double annualInterestRate) {
        double r = (annualInterestRate / 100.0) / 12.0; // Monthly interest rate
        double newEmi = currentEmi + extraEmi;
        
        // Exact amortization formula to find 'n' (months)
        // n = -log(1 - (P * r / EMI)) / log(1 + r)
        double term1 = 1.0 - (outstandingBalance * r / newEmi);
        Map<String, Object> result = new HashMap<>();
        
        if (term1 <= 0) {
            // Cannot pay off (this shouldn't happen if newEmi covers interest)
            result.put("error", "EMI too low to cover interest");
            return result;
        }
        
        double newTenure = -Math.log(term1) / Math.log(1 + r);
        int newTenureMonths = (int) Math.ceil(newTenure);
        
        // Calculate old tenure to find savings
        double oldTerm1 = 1.0 - (outstandingBalance * r / currentEmi);
        int oldTenureMonths = (int) Math.ceil(-Math.log(oldTerm1) / Math.log(1 + r));
        
        int monthsSaved = Math.max(0, oldTenureMonths - newTenureMonths);
        
        result.put("newTenure", newTenureMonths);
        result.put("monthsSaved", monthsSaved);
        return result;
    }

    // 4. Recommendation System Algorithm
    public Map<String, Object> recommendLoan(double income, String occupation) {
        Map<String, Object> result = new HashMap<>();
        String recommendation;
        
        if (income > 100000) {
            recommendation = "Home Loan (High Value Property)";
        } else if ("Student".equalsIgnoreCase(occupation)) {
            recommendation = "Education Loan (Low Interest)";
        } else if ("Business Owner".equalsIgnoreCase(occupation) || income > 80000) {
            recommendation = "Business Loan (Working Capital)";
        } else {
            recommendation = "Personal Loan (Quick Disbursal)";
        }
        
        result.put("recommendation", recommendation);
        return result;
    }
}
