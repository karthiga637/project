// ============================================================
//  Customer Dashboard JavaScript - Bank Manager Loan Sync & ML Predictor
// ============================================================

const API = 'http://127.0.0.1:8080';

let allUserLoans = [];
let allUserEmis = [];
let currentCustomerSession = null;

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
function fmtD(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function getBadge(status) {
    const map = { 'Active': 'success', 'Completed': 'primary', 'Paid': 'success', 'Upcoming': 'warning', 'Overdue': 'danger', 'Pending': 'info' };
    return `<span class="badge bg-${map[status] || 'secondary'}">${status}</span>`;
}

function clearLoanPaymentHistory(loanId) {
    if (!loanId) return;
    let cleanId = String(loanId).trim().replace(/^#/, '');
    
    let paidEmis = JSON.parse(localStorage.getItem('slm_paid_emis') || '[]');
    let updatedPaidEmis = paidEmis.filter(id => {
        let strId = String(id);
        return !strId.includes(`-${cleanId}-`) && !strId.endsWith(`-${cleanId}`) && strId !== cleanId;
    });
    localStorage.setItem('slm_paid_emis', JSON.stringify(updatedPaidEmis));

    let extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');
    delete extraPayments[cleanId];
    delete extraPayments[`#${cleanId}`];
    localStorage.setItem('slm_extra_payments', JSON.stringify(extraPayments));
}

// ── Init Dashboard ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const sessionStr = localStorage.getItem('slm_session');
    if (!sessionStr) {
        window.location.href = 'login.html';
        return;
    }
    currentCustomerSession = JSON.parse(sessionStr);

    if (currentCustomerSession.role === 'Admin') {
        window.location.href = 'admin-dashboard.html';
        return;
    } else if (currentCustomerSession.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
        return;
    }

    const nameStr = currentCustomerSession.name || currentCustomerSession.email || 'Customer';
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = nameStr;

    const emailEl = document.getElementById('custEmailDisplay');
    if (emailEl) emailEl.textContent = currentCustomerSession.email || '';

    const subEl = document.getElementById('custWelcomeSub');
    if (subEl) subEl.textContent = `Welcome back, ${nameStr}!`;

    const avatarEl = document.getElementById('custAvatar');
    if (avatarEl) avatarEl.textContent = nameStr[0].toUpperCase();

    loadCustomerDashboard(currentCustomerSession);
});

async function loadCustomerDashboard(session) {
    allUserLoans = [];
    allUserEmis = [];
    const userEmail = (session.email || '').trim().toLowerCase();

    // 1. Clean up & Deduplicate slm_customer_loans in localStorage directly
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

                allUserLoans.push({
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

    // Fallback if no mapped loans yet
    if (allUserLoans.length === 0) {
        allUserLoans.push(
            { id: 'HDFC-2026-12', loanId: 'HDFC-2026-12', customerEmail: session.email, loanType: 'Personal Loan', loanAmount: 200000, interestRate: 12.5, tenureMonths: 12, emiAmount: 17820, outstandingBalance: 200000, status: 'Active' },
            { id: 'HDFC-2026-22', loanId: 'HDFC-2026-22', customerEmail: session.email, loanType: 'Car Loan', loanAmount: 50000, interestRate: 9.0, tenureMonths: 12, emiAmount: 4373, outstandingBalance: 50000, status: 'Active' }
        );
    }

    // 3. Fetch Loans from backend API if available
    try {
        let fetchOptions = {};
        if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
            fetchOptions.signal = AbortSignal.timeout(2000);
        }
        const res = await fetch(`${API}/loans?customerId=${session.id || 0}`, fetchOptions);
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
                        allUserLoans.push(l);
                    }
                }
            });
        }
    } catch(e) {
        console.warn("API loans fetch unavailable", e);
    }

    // 4. Generate EMI Schedule with Reducing Balance & Sequential Payment Logic
    const paidEmiIds = new Set(JSON.parse(localStorage.getItem('slm_paid_emis') || '[]'));
    const extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');
    const seenEmiKeys = new Set();

    allUserLoans.forEach(l => {
        let lId = l.loanId || l.id;
        let amount = parseFloat(l.loanAmount) || 50000;
        let tenure = parseInt(l.tenureMonths || l.tenure) || 12;
        let rate = getProductInterestRate(l.loanType, l.interestRate);
        l.interestRate = rate;

        let r = rate / (12 * 100);
        let emi = Math.round(amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1));
        l.emiAmount = emi;

        let cleanLId = String(lId).replace(/^#/, '').trim();
        let foundNextUnpaid = false;
        let extraPaid = Math.min(amount, parseFloat(extraPayments[cleanLId] || extraPayments['#' + cleanLId] || extraPayments[lId]) || 0);
        let currentBalance = Math.max(0, amount - extraPaid);

        const installmentsCount = tenure;
        for (let i = 1; i <= installmentsCount; i++) {
            let instId = `EMI-${cleanLId}-${i}`;
            let altInstId = `EMI-${lId}-${i}`;
            if (!seenEmiKeys.has(instId)) {
                seenEmiKeys.add(instId);
                let d = new Date();
                d.setMonth(d.getMonth() + i);

                let isUserPaid = paidEmiIds.has(instId) || paidEmiIds.has(altInstId);

                // Reducing balance math
                let monthlyInterest = currentBalance > 0 ? Math.round(currentBalance * r) : 0;
                let requiredEmi = currentBalance > 0 ? Math.min(emi, Math.round(currentBalance + monthlyInterest)) : 0;
                let principalPaid = currentBalance > 0 ? Math.min(currentBalance, requiredEmi - monthlyInterest) : 0;

                if (isUserPaid) {
                    currentBalance = Math.max(0, currentBalance - principalPaid);
                }

                let status = 'Pending';
                let isPayable = false;
                let actualPaidForThisRow = 0;

                if (isUserPaid) {
                    status = 'Paid';
                    isPayable = false;
                    actualPaidForThisRow = requiredEmi > 0 ? requiredEmi : emi;
                } else if (currentBalance <= 0) {
                    status = 'Completed';
                    isPayable = false;
                    actualPaidForThisRow = 0;
                } else if (!foundNextUnpaid) {
                    status = 'Upcoming';
                    isPayable = true;
                    foundNextUnpaid = true;
                    actualPaidForThisRow = 0;
                } else {
                    status = 'Pending';
                    isPayable = false;
                    actualPaidForThisRow = 0;
                }

                allUserEmis.push({
                    id: instId,
                    loanId: lId,
                    loanType: l.loanType || 'Personal Loan',
                    installmentNo: i,
                    dueDate: d.toISOString().split('T')[0],
                    amount: requiredEmi > 0 ? requiredEmi : emi,
                    interestComponent: monthlyInterest,
                    principalComponent: principalPaid,
                    remainingBalance: currentBalance,
                    penalty: 0,
                    status: status,
                    isPayable: isPayable,
                    isUserPaid: isUserPaid,
                    actualPaidAmount: actualPaidForThisRow
                });
            }
        }
        l.outstandingBalance = currentBalance;
        l.status = (currentBalance <= 0) ? 'Completed' : 'Active';
    });

    // 5. Render Dashboard & History
    buildPaymentHistoryRecords(allUserLoans, allUserEmis);
    renderStats(allUserLoans, allUserEmis);
    filterLoansTab(currentLoanTab || 'all');
    renderSmartEmiReminders(allUserEmis, allUserLoans);
    renderPaymentHistory(allPaymentRecords);
    renderCompletedLoansTable(allUserLoans);
    populatePredictorDropdown();
}

let allPaymentRecords = [];
let currentLoanTab = 'all';

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

    let filtered = allUserLoans;
    if (tab === 'active') {
        filtered = allUserLoans.filter(l => l.status === 'Active' && l.outstandingBalance > 0);
    } else if (tab === 'completed') {
        filtered = allUserLoans.filter(l => l.status === 'Completed' || l.outstandingBalance <= 0);
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

    const searchId = inputVal.toLowerCase();

    const filteredLoans = allUserLoans.filter(l => 
        String(l.id).toLowerCase() === searchId || 
        String(l.loanId || '').toLowerCase() === searchId
    );

    if (filteredLoans.length === 0) {
        if (alertEl) {
            alertEl.style.display = 'block';
            alertEl.textContent = `❌ No loan found with ID #${inputVal} registered under your email (${currentCustomerSession.email}).`;
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

// ── Render Stats ───────────────────────────────────────────────────────────────
function renderStats(loans, emis) {
    const activeLoans = loans.filter(l => l.status === 'Active' && (l.outstandingBalance == null || l.outstandingBalance > 0)).length;
    const completedLoans = loans.filter(l => l.status === 'Completed' || (l.outstandingBalance != null && l.outstandingBalance <= 0)).length;
    const totalLoanAmt = loans.reduce((acc, l) => acc + Number(l.loanAmount || 0), 0);
    
    const upcoming = emis.filter(e => e.isPayable && (e.status === 'Upcoming' || e.status === 'Due'));
    const nextEmiAmt = upcoming.length > 0 ? (upcoming[0].amount || upcoming[0].emiAmount || 0) : 0;
    
    const extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');
    let totalPaid = 0;

    loans.forEach(l => {
        let lId = l.loanId || l.id;
        const cleanLId = String(lId).replace(/^#/, '').trim();
        let amount = parseFloat(l.loanAmount) || 0;
        let extra = Math.min(amount, Number(extraPayments[cleanLId] || extraPayments['#' + cleanLId] || extraPayments[lId] || 0));
        let paidEmisForLoan = emis.filter(e => {
            const eClean = String(e.loanId || '').replace(/^#/, '').trim();
            return (eClean === cleanLId || e.loanId === lId) && (e.isUserPaid || e.status === 'Paid');
        });
        let emiSum = paidEmisForLoan.reduce((acc, e) => acc + Number(e.actualPaidAmount || e.amount || e.emiAmount || 0), 0);
        
        let loanTotalPaid = emiSum + extra;
        if (l.outstandingBalance <= 0) {
            let maxExpected = Math.round(amount * (1 + (l.interestRate / 100)));
            loanTotalPaid = Math.min(loanTotalPaid, maxExpected);
        }
        totalPaid += loanTotalPaid;
    });

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('cardActiveLoans', activeLoans);
    setEl('cardCompletedLoans', completedLoans);
    setEl('cardTotalLoanAmt', fmtMoney(totalLoanAmt));
    setEl('cardNextEmi', fmtMoney(nextEmiAmt));
    setEl('cardTotalPaid', fmtMoney(totalPaid));
}

function goToLoanRepayments(loanId) {
    if (!loanId) return;
    const cleanId = String(loanId).replace(/^#/, '').trim();
    localStorage.setItem('viewLoanId', cleanId);
    window.location.href = `emi.html?loanId=${encodeURIComponent(cleanId)}`;
}

// ── Render Loans Table ─────────────────────────────────────────────────────────
function renderLoansTable(loans) {
    const tbody = document.getElementById('myLoansBody');
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

// ── Render Smart EMI Reminders & Alerts ───────────────────────────────────────
function renderSmartEmiReminders(emis, loans) {
    const container = document.getElementById('smartEmiRemindersContainer');
    if (!container) return;

    // Filter upcoming payable EMIs for active loans
    const upcomingEmis = emis.filter(e => {
        const parentLoan = loans.find(l => String(l.loanId || l.id) === String(e.loanId));
        const isLoanActive = parentLoan ? (parentLoan.status === 'Active' && parentLoan.outstandingBalance > 0) : true;
        return isLoanActive && (e.isPayable || e.status === 'Upcoming' || e.status === 'Due');
    });

    if (upcomingEmis.length === 0) {
        const completedCount = loans.filter(l => l.status === 'Completed' || l.outstandingBalance <= 0).length;
        if (completedCount > 0 && loans.length === completedCount) {
            container.innerHTML = `
                <div class="alert alert-success d-flex align-items-center mb-0 p-3 shadow-sm border-0">
                    <i class="bi bi-patch-check-fill fs-2 text-success me-3"></i>
                    <div>
                        <h6 class="fw-bold mb-1 text-success">🎉 Congratulations! All Loans Fully Settled</h6>
                        <p class="mb-0 text-muted small">You have successfully paid off all your loan accounts. No upcoming EMI payments are due.</p>
                    </div>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="alert alert-info d-flex align-items-center mb-0 p-3 shadow-sm border-0">
                    <i class="bi bi-check-circle-fill fs-2 text-info me-3"></i>
                    <div>
                        <h6 class="fw-bold mb-1 text-info">No Upcoming EMI Payments Due</h6>
                        <p class="mb-0 text-muted small">You are all caught up! All current installment dues are paid.</p>
                    </div>
                </div>`;
        }
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const cardsHtml = upcomingEmis.map(e => {
        const due = new Date(e.dueDate);
        due.setHours(0,0,0,0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Evaluate Decision Tree Classification
        const daysOverdue = diffDays < 0 ? Math.abs(diffDays) : 0;
        const dt = classifyEmiUrgencyDecisionTree(diffDays < 0 ? daysOverdue : -diffDays);

        return `
        <div class="card p-3 mb-3 shadow-sm border ${dt.borderClass}" ${dt.bgClass}>
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span class="badge bg-primary">Installment #${e.installmentNo}</span>
                        <strong class="text-dark">Loan #${e.loanId}</strong>
                        <span class="text-muted small">(${e.loanType || 'Personal Loan'})</span>
                        ${dt.badge}
                    </div>
                    <div>
                        <span class="text-muted small me-3"><i class="bi bi-calendar-event me-1"></i>Due Date: <strong>${fmtD(e.dueDate)}</strong></span>
                        <span class="text-muted small"><i class="bi bi-wallet2 me-1"></i>Amount: <strong class="text-success">${fmtMoney(e.amount)}</strong></span>
                    </div>
                    ${dt.alertNote}
                </div>
                <div class="d-flex align-items-center">
                    <a href="emi.html?loanId=${encodeURIComponent(e.loanId)}" class="btn btn-sm btn-primary fw-bold shadow-sm px-3">
                        <i class="bi bi-credit-card me-1"></i>Pay on Repayments Page <i class="bi bi-arrow-right ms-1"></i>
                    </a>
                </div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = cardsHtml;
}

// ── Decision Tree Algorithm: EMI Urgency & Priority Classifier ────────────────
function classifyEmiUrgencyDecisionTree(daysOverdueParam) {
    if (daysOverdueParam > 30) {
        return {
            urgency: 'Urgent',
            badge: '<span class="badge bg-danger shadow-sm"><i class="bi bi-exclamation-octagon-fill me-1"></i>Urgent Priority (Default Risk)</span>',
            borderClass: 'border-danger border-2',
            bgClass: 'style="background: #fff5f5;"',
            alertNote: `<div class="text-danger small mt-1 fw-bold"><i class="bi bi-shield-slash me-1"></i>Decision Tree Alert: Overdue by ${daysOverdueParam} days! Severe default risk and penalty fees. Pay immediately to preserve credit score.</div>`
        };
    } else if (daysOverdueParam > 0) {
        return {
            urgency: 'Medium',
            badge: '<span class="badge bg-warning text-dark shadow-sm"><i class="bi bi-exclamation-triangle-fill me-1"></i>Medium Priority (Grace Period)</span>',
            borderClass: 'border-warning',
            bgClass: 'style="background: #fffdf5;"',
            alertNote: `<div class="text-warning-emphasis small mt-1 fw-bold"><i class="bi bi-hourglass-split me-1"></i>Decision Tree Alert: Overdue by ${daysOverdueParam} days. Grace period active; pay soon to avoid statutory penalties.</div>`
        };
    } else {
        const daysLeft = Math.abs(daysOverdueParam);
        return {
            urgency: 'Low',
            badge: `<span class="badge bg-info text-dark shadow-sm"><i class="bi bi-calendar-check me-1"></i>Low Priority (${daysLeft === 0 ? 'Due Today' : 'Due in ' + daysLeft + ' Days'})</span>`,
            borderClass: daysLeft <= 3 ? 'border-primary' : 'border-info',
            bgClass: 'style="background: #f8fbff;"',
            alertNote: `<div class="text-muted small mt-1"><i class="bi bi-check-circle me-1 text-success"></i>Decision Tree Notice: Scheduled installment on track. Account in healthy standing.</div>`
        };
    }
}

// ── Payment History (Monthly EMIs & Extra Prepayments) ────────────────────────
function buildPaymentHistoryRecords(loans, emis) {
    allPaymentRecords = [];
    const extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');
    const txHistory = JSON.parse(localStorage.getItem('slm_payment_transactions') || '[]');
    const seenRefs = new Set();

    // 1. Transactions logged from explicit payment actions
    txHistory.forEach(tx => {
        const ref = tx.ref || `TX-${tx.loanId}-${Date.now()}`;
        if (!seenRefs.has(ref)) {
            seenRefs.add(ref);
            allPaymentRecords.push({
                ref: ref,
                loanId: String(tx.loanId).replace(/^#/, ''),
                loanType: tx.loanType || 'Personal Loan',
                type: tx.type,
                date: tx.date || new Date().toISOString().split('T')[0],
                amount: parseFloat(tx.amount) || 0,
                principal: parseFloat(tx.principal) || parseFloat(tx.amount) || 0,
                interest: parseFloat(tx.interest) || 0,
                status: tx.status || 'Paid'
            });
        }
    });

    // 2. Regular Monthly EMIs actually paid by user
    emis.forEach(e => {
        if (e.isUserPaid || e.status === 'Paid') {
            const cleanLId = String(e.loanId).replace(/^#/, '').trim();
            const ref = `PAY-EMI-${cleanLId}-${e.installmentNo || e.id}`;
            if (!seenRefs.has(ref)) {
                seenRefs.add(ref);
                allPaymentRecords.push({
                    ref: ref,
                    loanId: cleanLId,
                    loanType: e.loanType || 'Personal Loan',
                    type: 'Monthly EMI',
                    date: e.paidDate || e.dueDate || new Date().toISOString().split('T')[0],
                    amount: e.actualPaidAmount || e.amount || e.emiAmount || 413,
                    principal: e.principalComponent || Math.round((e.amount || 413) * 0.95),
                    interest: e.interestComponent || Math.round((e.amount || 413) * 0.05),
                    status: 'Paid'
                });
            }
        }
    });

    // 3. Extra prepayments applied directly to principal
    loans.forEach(l => {
        const cleanLId = String(l.loanId || l.id).replace(/^#/, '').trim();
        const extra = parseFloat(extraPayments[cleanLId] || extraPayments['#' + cleanLId] || extraPayments[l.loanId]) || 0;
        if (extra > 0) {
            const ref = `PREPAY-${cleanLId}`;
            if (!seenRefs.has(ref)) {
                seenRefs.add(ref);
                allPaymentRecords.push({
                    ref: ref,
                    loanId: cleanLId,
                    loanType: l.loanType || 'Personal Loan',
                    type: 'Extra Prepayment',
                    date: new Date().toISOString().split('T')[0],
                    amount: extra,
                    principal: extra,
                    interest: 0,
                    status: 'Applied to Principal'
                });
            }
        }
    });

    // Sort newest first
    allPaymentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function filterPaymentHistory() {
    const sel = document.getElementById('paymentHistoryFilter')?.value || 'all';
    let filtered = allPaymentRecords;
    if (sel !== 'all') {
        filtered = allPaymentRecords.filter(p => p.type === sel);
    }
    renderPaymentHistory(filtered);
}

function renderPaymentHistory(records) {
    const tbody = document.getElementById('paymentHistoryBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><i class="bi bi-info-circle me-1"></i> No payment history records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(p => {
        const typeBadge = p.type === 'Extra Prepayment' 
            ? `<span class="badge text-white" style="background-color: #6f42c1;"><i class="bi bi-lightning-charge-fill me-1"></i>Extra Prepayment</span>`
            : `<span class="badge bg-primary"><i class="bi bi-calendar-check me-1"></i>Monthly EMI</span>`;

        const statusBadge = p.status === 'Applied to Principal'
            ? `<span class="badge bg-info text-dark"><i class="bi bi-check2-circle me-1"></i>Principal Reduced</span>`
            : `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Paid</span>`;

        return `
        <tr class="align-middle text-center">
            <td class="ps-3 fw-bold text-secondary font-monospace small">${p.ref}</td>
            <td class="fw-bold text-primary">#${p.loanId}</td>
            <td>${typeBadge}</td>
            <td>${fmtD(p.date)}</td>
            <td class="fw-bold text-success">${fmtMoney(p.amount)}</td>
            <td class="fw-bold text-dark">${fmtMoney(p.principal)}</td>
            <td class="text-muted">${fmtMoney(p.interest)}</td>
            <td>${statusBadge}</td>
        </tr>`;
    }).join('');
}

// ── Completed Loans List (Completement) ───────────────────────────────────────
function renderCompletedLoansTable(loans) {
    const tbody = document.getElementById('completedLoansBody');
    const badgeEl = document.getElementById('badgeCompletedLoansCount');
    
    const completedLoans = loans.filter(l => l.status === 'Completed' || (l.outstandingBalance != null && l.outstandingBalance <= 0));
    
    if (badgeEl) {
        badgeEl.textContent = `${completedLoans.length} Settled Loans`;
    }

    if (!tbody) return;

    if (!completedLoans || completedLoans.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><i class="bi bi-info-circle me-1"></i> No completed loans yet. Completed loans will appear here once fully settled.</td></tr>`;
        return;
    }

    tbody.innerHTML = completedLoans.map(l => {
        const lId = l.loanId || l.id;
        const totalInterest = Math.round(l.loanAmount * ((l.interestRate || 10) / 100));
        const totalSettlement = l.loanAmount + totalInterest;

        return `
        <tr class="align-middle text-center">
            <td class="ps-3 fw-bold text-primary">#${lId}</td>
            <td><span class="badge bg-info text-dark">${l.loanType || 'Personal Loan'}</span></td>
            <td class="fw-bold text-dark">${fmtMoney(l.loanAmount)}</td>
            <td class="text-muted">${fmtMoney(totalInterest)}</td>
            <td class="fw-bold text-success">${fmtMoney(totalSettlement)}</td>
            <td>${l.tenureMonths || l.tenure || 12} Months</td>
            <td><span class="badge bg-success px-3 py-2"><i class="bi bi-check-circle-fill me-1"></i>Completed & Closed</span></td>
        </tr>`;
    }).join('');
}

// ── Pay EMI ────────────────────────────────────────────────────────────────────
async function payMyEmi(emiId) {
    if (!confirm('Are you sure you want to pay this EMI installment?')) return;

    const paidEmiIds = new Set(JSON.parse(localStorage.getItem('slm_paid_emis') || '[]'));
    paidEmiIds.add(emiId);
    localStorage.setItem('slm_paid_emis', JSON.stringify(Array.from(paidEmiIds)));

    try {
        await fetch(`${API}/emi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emiId: emiId })
        });
    } catch(e) {
        console.warn(e);
    }
    alert('EMI payment processed successfully!');
    if (currentCustomerSession) {
        loadCustomerDashboard(currentCustomerSession);
    }
}

// ── Early Loan Closure Predictor Widget Logic (Linear Regression Model) ───────
function populatePredictorDropdown() {
    const sel = document.getElementById('predictorLoanSelect');
    if (!sel) return;
    sel.innerHTML = allUserLoans.map(l => 
        `<option value="${l.loanId || l.id}">${l.loanType} (#${l.loanId || l.id}) - Principal ${fmtMoney(l.outstandingBalance != null ? l.outstandingBalance : l.loanAmount)}</option>`
    ).join('');
    
    if (allUserLoans.length > 0) {
        sel.value = allUserLoans[0].loanId || allUserLoans[0].id;
    }
    runEarlyClosurePrediction();
}

function calculateEarlyClosurePredictor(principal, rateAnnual, standardEmi, extraPayment, originalTenureMonths) {
    extraPayment = parseFloat(extraPayment) || 0;
    const r = (rateAnnual / 100) / 12;
    const totalPayment = standardEmi + extraPayment;
    
    if (totalPayment <= principal * r) {
        return { error: "Extra payment must be greater than monthly interest." };
    }
    
    const term1 = 1 - (principal * r / totalPayment);
    if (term1 <= 0) return { error: "Invalid payment amount." };
    
    const newTenureExact = -Math.log(term1) / Math.log(1 + r);
    const newTenureMonths = Math.ceil(newTenureExact);
    const monthsSaved = Math.max(0, originalTenureMonths - newTenureMonths);
    
    const originalTotalCost = standardEmi * originalTenureMonths;
    const newTotalCost = totalPayment * newTenureMonths;
    const interestSaved = Math.max(0, Math.round(originalTotalCost - newTotalCost));
    
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + newTenureMonths);
    const closureDateStr = targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    return {
        newTenureMonths,
        monthsSaved,
        interestSaved,
        closureDateStr
    };
}

function runEarlyClosurePrediction() {
    const sel = document.getElementById('predictorLoanSelect');
    if (!sel || !sel.value) return;
    
    const targetLoan = allUserLoans.find(l => String(l.loanId || l.id) === String(sel.value));
    if (!targetLoan) return;
    
    const standardEmiEl = document.getElementById('predictorStandardEmi');
    if (standardEmiEl) standardEmiEl.value = Number(targetLoan.emiAmount || 4000).toLocaleString('en-IN');
    
    const extraVal = parseFloat(document.getElementById('predictorExtraInput')?.value) || 0;
    const principal = parseFloat(targetLoan.outstandingBalance != null ? targetLoan.outstandingBalance : (targetLoan.loanAmount || 50000));
    const rateAnnual = getProductInterestRate(targetLoan.loanType, targetLoan.interestRate);
    const standardEmi = parseFloat(targetLoan.emiAmount) || 4000;
    const originalTenure = parseInt(targetLoan.tenureMonths || targetLoan.tenure) || 12;

    const res = calculateEarlyClosurePredictor(principal, rateAnnual, standardEmi, extraVal, originalTenure);

    const mSavedEl = document.getElementById('predResultMonths');
    const iSavedEl = document.getElementById('predResultInterest');
    const dateEl = document.getElementById('predResultDate');

    if (res.error) {
        if (mSavedEl) mSavedEl.textContent = 'N/A';
        if (iSavedEl) iSavedEl.textContent = 'N/A';
        if (dateEl) dateEl.textContent = res.error;
    } else {
        if (mSavedEl) mSavedEl.textContent = `${res.monthsSaved} Months`;
        if (iSavedEl) iSavedEl.textContent = `₹${Number(res.interestSaved).toLocaleString('en-IN')}`;
        if (dateEl) dateEl.textContent = res.closureDateStr;
    }
}
