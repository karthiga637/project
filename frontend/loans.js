// ============================================================
//  My Loans Page JavaScript - Matching Dashboard Interface & Live Data Exactly
// ============================================================

const API = 'http://127.0.0.1:8080';

let allLoans = [];
let currentLoanTab = 'all';

const DEFAULT_PRODUCT_RATES = {
    'Home Loan': 8.5,
    'Personal Loan': 12.5,
    'Education Loan': 9.5,
    'Car Loan': 9.0,
    'Business Loan': 12.0,
    'Two-Wheeler Loan': 11.0,
    'Gold Loan': 7.5
};

function getProductInterestRate(loanType, explicitRate) {
    if (explicitRate && parseFloat(explicitRate) > 0) return parseFloat(explicitRate);
    return DEFAULT_PRODUCT_RATES[loanType] || 10.5;
}

function fmtMoney(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }

function getBadge(status) {
    if (status === 'Completed') return '<span class="badge bg-primary">Completed</span>';
    if (status === 'Active') return '<span class="badge bg-success">Active</span>';
    const map = { 'Paid': 'success', 'Upcoming': 'warning', 'Overdue': 'danger', 'Pending': 'info' };
    return `<span class="badge bg-${map[status] || 'secondary'}">${status || 'Active'}</span>`;
}

window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(s);

    if (session.role === 'Admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    } else if (session.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
        return;
    }

    const nameStr = session.name || session.email || 'Customer';
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = nameStr;

    const emailEl = document.getElementById('custEmailDisplay');
    if (emailEl) emailEl.textContent = session.email || '';

    const avatarEl = document.getElementById('custAvatar');
    if (avatarEl) avatarEl.textContent = nameStr[0].toUpperCase();

    loadLoansPage(session);
});

async function loadLoansPage(session) {
    allLoans = [];
    const userEmail = (session.email || '').trim().toLowerCase();

    // 1. Clean up & Deduplicate slm_customer_loans in localStorage
    let rawMappedLoans = JSON.parse(localStorage.getItem('slm_customer_loans') || '[]');
    let cleanMappedLoans = [];
    let globalSeenIds = new Set();
    let hadDuplicates = false;

    rawMappedLoans.forEach(m => {
        let cleanId = (m.loanId || '').trim().toLowerCase();
        if (cleanId && !globalSeenIds.has(cleanId)) {
            globalSeenIds.add(cleanId);
            cleanMappedLoans.push(m);
        } else if (cleanId) {
            hadDuplicates = true;
        }
    });

    if (hadDuplicates) {
        localStorage.setItem('slm_customer_loans', JSON.stringify(cleanMappedLoans));
    }

    // 2. Filter loans strictly for logged in customer email & apply Product-Specific Rate Lock-in
    const seenLoanIds = new Set();

    cleanMappedLoans.forEach(m => {
        if (m.email && m.email.trim().toLowerCase() === userEmail) {
            let cleanId = (m.loanId || '').trim();
            let lowerId = cleanId.toLowerCase();
            if (cleanId && !seenLoanIds.has(lowerId)) {
                seenLoanIds.add(lowerId);

                let amount = parseFloat(m.loanAmount) || 50000;
                let tenure = parseInt(m.tenure) || 12;
                let loanType = m.loanType || 'Personal Loan';
                let rate = getProductInterestRate(loanType, m.interestRate);
                let r = rate / (12 * 100);
                let emi = Math.round(amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1));

                allLoans.push({
                    id: cleanId,
                    loanId: cleanId,
                    customerId: session.id,
                    customerEmail: session.email,
                    loanType: loanType,
                    loanAmount: amount,
                    interestRate: rate,
                    tenureMonths: tenure,
                    emiAmount: emi,
                    outstandingBalance: amount,
                    startDate: new Date().toISOString().split('T')[0],
                    status: 'Active'
                });
            }
        }
    });

    // Fallback if no mapped loans found
    if (allLoans.length === 0) {
        allLoans.push(
            { id: 'HDFC-2026-12', loanId: 'HDFC-2026-12', customerEmail: session.email, loanType: 'Personal Loan', loanAmount: 200000, interestRate: 12.5, tenureMonths: 12, emiAmount: 17820, outstandingBalance: 200000, status: 'Active' },
            { id: 'HDFC-2026-22', loanId: 'HDFC-2026-22', customerEmail: session.email, loanType: 'Car Loan', loanAmount: 50000, interestRate: 9.0, tenureMonths: 12, emiAmount: 4373, outstandingBalance: 50000, status: 'Active' }
        );
    }

    // 3. Fetch Loans from backend API if available
    try {
        const res = await fetch(`${API}/loans?customerId=${session.id || 0}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(l => {
                    if (l.customerEmail && l.customerEmail.trim().toLowerCase() === userEmail) {
                        const lIdStr = String(l.loanId || l.id || '').trim();
                        const lowerId = lIdStr.toLowerCase();
                        if (lIdStr && !seenLoanIds.has(lowerId)) {
                            seenLoanIds.add(lowerId);
                            let rate = getProductInterestRate(l.loanType, l.interestRate);
                            l.interestRate = rate;
                            allLoans.push(l);
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.warn("API loans fetch fallback", e);
    }

    // 4. Calculate Live Reducing Balance from Paid EMIs & Extra Prepayments
    const paidEmiIds = new Set(JSON.parse(localStorage.getItem('slm_paid_emis') || '[]'));
    const extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');

    allLoans.forEach(l => {
        let lId = l.loanId || l.id;
        let amount = parseFloat(l.loanAmount) || 50000;
        let tenure = parseInt(l.tenureMonths || l.tenure) || 12;
        let rate = getProductInterestRate(l.loanType, l.interestRate);
        l.interestRate = rate;

        let r = rate / (12 * 100);
        let emi = Math.round(amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1));
        l.emiAmount = emi;

        let cleanLId = String(lId).replace(/^#/, '').trim();
        let extraPaid = Math.min(amount, parseFloat(extraPayments[cleanLId] || extraPayments['#' + cleanLId] || extraPayments[lId] || extraPayments[l.id]) || 0);
        let currentBalance = Math.max(0, amount - extraPaid);

        for (let i = 1; i <= tenure; i++) {
            let instId = `EMI-${cleanLId}-${i}`;
            let altInstId = `EMI-${lId}-${i}`;
            let isUserPaid = paidEmiIds.has(instId) || paidEmiIds.has(altInstId);

            let monthlyInterest = currentBalance > 0 ? Math.round(currentBalance * r) : 0;
            let requiredEmi = currentBalance > 0 ? Math.min(emi, Math.round(currentBalance + monthlyInterest)) : 0;
            let principalPaid = currentBalance > 0 ? Math.min(currentBalance, requiredEmi - monthlyInterest) : 0;

            if (isUserPaid) {
                currentBalance = Math.max(0, currentBalance - principalPaid);
            }
        }

        l.outstandingBalance = currentBalance;
        l.status = (currentBalance <= 0) ? 'Completed' : 'Active';
    });

    // 5. Render table with active tab
    filterLoansTab(currentLoanTab || 'all');

    // 6. Pre-fill & Run AI Loan Eligibility Predictor
    const eligIncEl = document.getElementById('eligIncome');
    if (eligIncEl && session.income) eligIncEl.value = session.income;
    runLoanEligibilityModel();
}

// ── Filter Loans Tab (All / Active / Completed) ───────────────────────────────
function filterLoansTab(tab) {
    currentLoanTab = tab || 'all';
    ['btnFilterAllLoans', 'btnFilterActiveLoans', 'btnFilterCompletedLoans'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('btn-light', 'text-primary', 'active');
            btn.classList.add('btn-outline-light');
        }
    });

    const activeBtnId = tab === 'active' ? 'btnFilterActiveLoans' : (tab === 'completed' ? 'btnFilterCompletedLoans' : 'btnFilterAllLoans');
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
        activeBtn.classList.remove('btn-outline-light');
        activeBtn.classList.add('btn-light', 'text-primary', 'active');
    }

    let filtered = allLoans;
    if (tab === 'active') {
        filtered = allLoans.filter(l => l.status === 'Active' && l.outstandingBalance > 0);
    } else if (tab === 'completed') {
        filtered = allLoans.filter(l => l.status === 'Completed' || l.outstandingBalance <= 0);
    }
    renderLoansTable(filtered);
}

// ── Search / Filter By Loan ID ──────────────────────────────────────────────────
function filterByLoanId() {
    const inputVal = (document.getElementById('loanIdInput')?.value || '').trim();
    const alertEl = document.getElementById('loanSearchAlert');

    if (!inputVal || inputVal.toLowerCase() === 'all') {
        resetLoanFilter();
        return;
    }

    const searchId = inputVal.toLowerCase().replace(/^#/, '');

    const filteredLoans = allLoans.filter(l => {
        const cleanId1 = String(l.id || '').toLowerCase().replace(/^#/, '');
        const cleanId2 = String(l.loanId || '').toLowerCase().replace(/^#/, '');
        return cleanId1.includes(searchId) || cleanId2.includes(searchId);
    });

    if (filteredLoans.length === 0) {
        if (alertEl) {
            alertEl.style.display = 'block';
            alertEl.textContent = `❌ No loan found matching #${inputVal}.`;
        }
        renderLoansTable([]);
        return;
    }

    if (alertEl) alertEl.style.display = 'none';
    renderLoansTable(filteredLoans);
}

function resetLoanFilter() {
    const inputEl = document.getElementById('loanIdInput');
    if (inputEl) inputEl.value = '';

    const alertEl = document.getElementById('loanSearchAlert');
    if (alertEl) alertEl.style.display = 'none';

    filterLoansTab(currentLoanTab || 'all');
}

// ── Navigation to Repayments ──────────────────────────────────────────────────
function goToLoanRepayments(loanId) {
    if (!loanId) return;
    const cleanId = String(loanId).replace(/^#/, '').trim();
    localStorage.setItem('viewLoanId', cleanId);
    window.location.href = `emi.html?loanId=${encodeURIComponent(cleanId)}`;
}

// ── Render Loans Table ─────────────────────────────────────────────────────────
function renderLoansTable(loans) {
    const tbody = document.getElementById('loansBody');
    if (!tbody) return;

    if (!loans || loans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-info-circle me-1"></i> No loans found matching the criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = loans.map(l => {
        const lId = l.loanId || l.id;
        const currentBalance = l.outstandingBalance != null ? l.outstandingBalance : l.loanAmount;
        const loanStatus = (currentBalance <= 0) ? 'Completed' : (l.status || 'Active');

        return `
        <tr class="align-middle text-center loan-row-hover" style="cursor: pointer;" onclick="goToLoanRepayments('${lId}')" title="Click to view repayments for loan #${lId}">
            <td class="ps-3 fw-bold text-primary"><a href="emi.html?loanId=${encodeURIComponent(lId)}" onclick="event.stopPropagation(); goToLoanRepayments('${lId}'); return false;" class="text-decoration-none fw-bold text-primary">#${lId} <i class="bi bi-box-arrow-up-right small text-primary ms-1" style="font-size:0.75rem;"></i></a></td>
            <td><span class="badge bg-info text-dark">${l.loanType || 'Personal Loan'}</span></td>
            <td class="fw-bold text-success">${fmtMoney(l.loanAmount)}</td>
            <td><span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 fw-bold">${l.interestRate || getProductInterestRate(l.loanType)}%</span></td>
            <td class="fw-bold">${fmtMoney(l.emiAmount)}</td>
            <td class="text-danger fw-bold">${fmtMoney(currentBalance)}</td>
            <td>${getBadge(loanStatus)}</td>
        </tr>`;
    }).join('');
}

// ── AI Loan Eligibility Predictor (Logistic Regression Model) ─────────────────
function runLoanEligibilityModel() {
    const incomeInput = document.getElementById('eligIncome');
    const amountInput = document.getElementById('eligAmount');
    const tenureSelect = document.getElementById('eligTenure');
    const typeSelect = document.getElementById('eligLoanType');

    const income = parseFloat(incomeInput ? incomeInput.value : 0) || 0;
    const loanAmt = parseFloat(amountInput ? amountInput.value : 0) || 0;
    const tenure = parseInt(tenureSelect ? tenureSelect.value : 24) || 24;
    const loanType = typeSelect ? typeSelect.value : 'Personal Loan';

    // 1. Financial Metrics (EMI and Max Limit)
    const rate = getProductInterestRate(loanType);
    const r = (rate / 100) / 12;
    const emi = loanAmt > 0 && r > 0 ? Math.round(loanAmt * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1)) : 0;
    
    // Max Safe Limit (based on 50% Debt-to-income threshold)
    const maxAffordableEmi = income * 0.5;
    let maxSafeLimit = r > 0 ? Math.round(maxAffordableEmi * (Math.pow(1 + r, tenure) - 1) / (r * Math.pow(1 + r, tenure))) : income * 10;
    maxSafeLimit = Math.max(50000, Math.round(maxSafeLimit / 10000) * 10000);

    // 2. Upgraded Dynamic Logistic Regression: DTI (FOIR) & Tenure-Sensitive
    const dti = income > 0 ? (emi / income) : 1.0;
    const loanToAnnualIncome = income > 0 ? (loanAmt / (income * 12.0)) : 1.0;

    let z = 3.5 - (8.0 * dti) - (0.5 * loanToAnnualIncome);
    if (z > 6.0) z = 6.0;
    if (z < -6.0) z = -6.0;

    const probRaw = 1.0 / (1.0 + Math.exp(-z));
    let percent = Math.min(98, Math.max(2, Math.round(probRaw * 100)));

    // 3. Status Classification
    let statusBadgeHtml = '';
    let barColorClass = 'bg-success';
    let explanation = '';

    if (percent >= 70) {
        statusBadgeHtml = '<i class="bi bi-patch-check-fill me-1"></i>Eligible / High Probability';
        barColorClass = 'bg-success';
        explanation = `Logistic Regression model indicates strong debt-service capability (DTI: ${(dti * 100).toFixed(1)}%). Your monthly income easily covers the ₹${Number(emi).toLocaleString('en-IN')} installment.`;
    } else if (percent >= 45) {
        statusBadgeHtml = '<i class="bi bi-exclamation-triangle-fill me-1"></i>Moderate Probability / Conditional';
        barColorClass = 'bg-warning text-dark';
        explanation = `Monthly commitment represents ${(dti * 100).toFixed(1)}% of income. Eligible with supplementary co-signer or by choosing a longer tenure to reduce the EMI.`;
    } else {
        statusBadgeHtml = '<i class="bi bi-x-circle-fill me-1"></i>High Rejection Risk';
        barColorClass = 'bg-danger';
        explanation = `Estimated EMI (₹${Number(emi).toLocaleString('en-IN')}) consumes ${(dti * 100).toFixed(1)}% of income, exceeding safe debt thresholds. We recommend borrowing up to ₹${Number(maxSafeLimit).toLocaleString('en-IN')} or extending your tenure.`;
    }

    // 4. Update DOM Elements
    const valEl = document.getElementById('eligProbValue');
    const barEl = document.getElementById('eligProgressBar');
    const badgeEl = document.getElementById('eligStatusBadge');
    const emiEl = document.getElementById('eligEstEmi');
    const limitEl = document.getElementById('eligMaxLimit');
    const explEl = document.getElementById('eligExplanation');

    if (valEl) valEl.textContent = `${percent}%`;
    if (barEl) {
        barEl.style.width = `${percent}%`;
        barEl.setAttribute('aria-valuenow', percent);
        barEl.className = `progress-bar ${barColorClass}`;
    }
    if (badgeEl) {
        badgeEl.className = `badge ${percent >= 70 ? 'bg-success' : (percent >= 45 ? 'bg-warning text-dark' : 'bg-danger')} px-2 py-1 fw-bold`;
        badgeEl.innerHTML = statusBadgeHtml;
    }
    if (emiEl) emiEl.textContent = `₹${Number(emi).toLocaleString('en-IN')}`;
    if (limitEl) limitEl.textContent = `₹${Number(maxSafeLimit).toLocaleString('en-IN')}`;
    if (explEl) explEl.textContent = explanation;

    // 5. Async Server Model Sync
    fetch(`${API}/ai-insights?action=eligibility&income=${income}&loanAmount=${loanAmt}&tenure=${tenure}&rate=${rate}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.probability != null) {
                const srvPct = Math.min(98, Math.max(2, Math.round(data.probability * 100)));
                if (valEl) valEl.textContent = `${srvPct}%`;
                if (barEl) {
                    barEl.style.width = `${srvPct}%`;
                    barEl.setAttribute('aria-valuenow', srvPct);
                }
            }
        })
        .catch(err => {
            console.debug('Client-side logistic model active:', err);
        });
}
