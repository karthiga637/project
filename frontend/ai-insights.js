
window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(s);
    document.getElementById('userName').textContent = session.name;
    
    // Hide Admin-only cards for Customer
    if (session.role === 'Customer') {
        const cards = document.querySelectorAll('.ai-card');
        if (cards.length > 1) {
            cards[0].style.display = 'none'; // Eligibility
            cards[1].style.display = 'none'; // Urgency
        }
    }
});
const API_URL = "http://localhost:8080/api/ai";

function logout() {
    sessionStorage.clear();
    window.location.href = "index.html";
}

async function postAI(data) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("API failed");
    return await response.json();
}

// 1. Logistic Regression: Eligibility
async function predictEligibility() {
    const income = document.getElementById("eligIncome").value;
    const loan = document.getElementById("eligLoan").value;
    const resDiv = document.getElementById("eligResult");
    
    resDiv.style.display = "block";
    resDiv.className = "ai-result";
    resDiv.innerHTML = "Processing model...";

    try {
        // Mapping loan to existing_debt and dummy credit_score for ai_loan_eligibility.py
        const data = await postAI({
            type: 'loan_eligibility',
            credit_score: 700, 
            income: income,
            existing_debt: loan
        });
        
        if (data.eligible === true || data.eligible === "Yes") {
            resDiv.className = "ai-result success";
            resDiv.innerHTML = `<strong>Approved</strong><br>Probability Score: ${data.probability}%<br><em>The logistic regression model predicts this user is highly capable of repayment.</em>`;
        } else {
            resDiv.className = "ai-result danger";
            resDiv.innerHTML = `<strong>Rejected</strong><br>Probability Score: ${data.probability}%<br><em>High risk of default detected based on income-to-loan ratio.</em>`;
        }
    } catch (e) {
        resDiv.className = "ai-result danger";
        resDiv.innerHTML = "Error connecting to AI engine.";
    }
}

// 2. Decision Tree: Urgency
async function checkUrgency() {
    const days = document.getElementById("urgencyDays").value;
    const resDiv = document.getElementById("urgencyResult");
    
    resDiv.style.display = "block";
    resDiv.className = "ai-result";
    resDiv.innerHTML = "Analyzing tree nodes...";

    try {
        const data = await postAI({
            type: 'emi_reminder',
            missed_payments: Math.floor(days/30),
            days_overdue: days,
            income: 50000 // dummy
        });
        
        let msg = "";
        let urgency = data.priority; // python returns "priority": "High" / "Medium" / "Low"
        
        if (urgency === "High" || urgency === "Urgent") {
            resDiv.className = "ai-result danger";
            msg = "Immediate action required. High risk of NPA (Non-Performing Asset).";
            urgency = "Urgent";
        } else if (urgency === "Medium") {
            resDiv.className = "ai-result warning";
            msg = "Standard follow-up required. Mild delay.";
        } else {
            resDiv.className = "ai-result success";
            msg = "Low priority. Account is in good standing or advance reminder.";
            urgency = "Low";
        }
        
        resDiv.innerHTML = `<strong>Priority Level: ${urgency}</strong><br><em>${msg}</em>`;
    } catch (e) {
        resDiv.className = "ai-result danger";
        resDiv.innerHTML = "Error connecting to AI engine.";
    }
}

// 3. Linear Regression: Early Closure
async function predictClosure() {
    const bal = document.getElementById("clsBalance").value;
    const emi = document.getElementById("clsCurrentEmi").value;
    const extra = document.getElementById("clsExtraEmi").value;
    const resDiv = document.getElementById("closureResult");
    
    resDiv.style.display = "block";
    resDiv.className = "ai-result";
    resDiv.innerHTML = "Calculating trajectory...";

    try {
        const data = await postAI({
            type: 'early_closure',
            outstanding_balance: bal,
            emi: emi,
            extra_payment: extra
        });
        
        resDiv.className = "ai-result success";
        resDiv.innerHTML = `<strong>Projection Complete</strong><br>
            Months Saved: <strong>${data.months_saved} months</strong><br>
            Interest Saved: ₹${data.interest_saved}<br>
            <em>By paying an extra ₹${extra}/mo, the regression model estimates a significant reduction in loan life.</em>`;
    } catch (e) {
        resDiv.className = "ai-result danger";
        resDiv.innerHTML = "Error connecting to AI engine. Ensure inputs are valid.";
    }
}

// 4. Recommendation System
async function getRecommendation() {
    const income = document.getElementById("recIncome").value;
    const occ = document.getElementById("recOcc").value; // e.g. Software Engineer
    const resDiv = document.getElementById("recResult");
    
    resDiv.style.display = "block";
    resDiv.className = "ai-result";
    resDiv.innerHTML = "Evaluating profile...";

    try {
        const data = await postAI({
            type: 'loan_recommendation',
            age: 30, // dummy
            income: income,
            loan_purpose: occ // passing occ as loan_purpose for variation
        });
        
        resDiv.className = "ai-result success";
        resDiv.innerHTML = `<strong>Recommended Product: ${data.recommendation}</strong><br><em>Based on profile similarity to historical successful loans.</em>`;
    } catch (e) {
        resDiv.className = "ai-result danger";
        resDiv.innerHTML = "Error connecting to AI engine.";
    }
}
