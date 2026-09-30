// ============================================================
//  EMI Tracking Page JavaScript - Bank Manager & Customer Sync & ML Predictor
// ============================================================

const API = 'http://127.0.0.1:8080';

let allEMIs = [];
let userLoansList = [];
let currentSelectedLoan = null;
let allPaymentRecords = [];

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

function fmt(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function badge(s) {
    const m = { Paid: 'success', Pending: 'info', Overdue: 'danger', Due: 'warning', Upcoming: 'warning', Active: 'success', Completed: 'primary' };
    return `<span class="badge bg-${m[s]||'secondary'}">${s}</span>`;
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

    let txHistory = JSON.parse(localStorage.getItem('slm_payment_transactions') || '[]');
    let updatedTx = txHistory.filter(tx => String(tx.loanId || '').replace(/^#/, '') !== cleanId);
    localStorage.setItem('slm_payment_transactions', JSON.stringify(updatedTx));
}

window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(s);
    
    const nameStr = session.name || session.email || 'Customer';
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = nameStr;

    const emailEl = document.getElementById('custEmailDisplay');
    if (emailEl) emailEl.textContent = session.email || '';

    const avatarEl = document.getElementById('custAvatar');
    if (avatarEl) avatarEl.textContent = nameStr[0].toUpperCase();

    if (session.role === 'Customer') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    loadEMIs();
});

async function loadEMIs() {
    allEMIs = [];
    userLoansList = [];
    const session = JSON.parse(localStorage.getItem('slm_session') || '{}');
    const userEmail = (session.email || '').trim().toLowerCase();

    const params = new URLSearchParams(window.location.search);
    let filterLoanId = params.get('loanId') || localStorage.getItem('viewLoanId');
    if (filterLoanId) {
        filterLoanId = String(filterLoanId).replace(/^#/, '').trim();
    }
    const cleanFilter = filterLoanId ? filterLoanId.toLowerCase() : null;

    const paidEmiIds = new Set(JSON.parse(localStorage.getItem('slm_paid_emis') || '[]'));
    const extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');

    // 1. Fetch Bank Manager mapped customer loans from localStorage
    const rawMappedLoans = JSON.parse(localStorage.getItem('slm_customer_loans') || '[]');
    const seenLoanIds = new Set();
    const userMapped = [];

    rawMappedLoans.forEach(m => {
        const cleanId = String(m.loanId || m.id || '').replace(/^#/, '').trim();
        const lowerId = cleanId.toLowerCase();
        if (cleanId && !seenLoanIds.has(lowerId)) {
            if (session.role !== 'Customer' || (m.email && m.email.trim().toLowerCase() === userEmail)) {
                seenLoanIds.add(lowerId);
                userMapped.push(m);
            }
        }
    });

    // Fallback if no mapped loans yet for logged in customer
    if (userMapped.length === 0 && session.role === 'Customer') {
        userMapped.push(
            { loanId: 'HDFC-2026-9', name: session.name || 'Customer', email: session.email, loanType: 'Personal Loan', loanAmount: 2000, tenure: 5, interestRate: 12.5 },
            { loanId: 'HDFC-2026-30', name: session.name || 'Customer', email: session.email, loanType: 'Education Loan', loanAmount: 50000, tenure: 12, interestRate: 9.5 }
        );
    }

    // 2. Build Multi-Installment EMI Schedule with Reducing Balance & Sequential Payment Logic
    userMapped.forEach(m => {
        let lId = String(m.loanId || m.id || '').replace(/^#/, '').trim();
        let amount = parseFloat(m.loanAmount) || 50000;
        let tenure = parseInt(m.tenure || m.tenureMonths) || 12;
        let loanType = m.loanType || 'Personal Loan';
        let rate = getProductInterestRate(loanType, m.interestRate);
        
        let r = rate / (12 * 100);
        let emi = amount > 0 && tenure > 0 
            ? Math.round(amount * r * Math.pow(1 + r, tenure) / (Math.pow(1 + r, tenure) - 1))
            : 0;

        let extraPaid = Math.min(amount, parseFloat(extraPayments[lId] || extraPayments[`#${lId}`]) || 0);
        let currentBalance = Math.max(0, amount - extraPaid);

        let loanObj = {
            id: lId,
            loanId: lId,
            loanType: loanType,
            loanAmount: amount,
            interestRate: rate,
            tenureMonths: tenure,
            emiAmount: emi,
            outstandingBalance: currentBalance,
            status: currentBalance <= 0 ? 'Completed' : 'Active'
        };
        userLoansList.push(loanObj);

        // Check if this loan should be displayed in the schedule table
        const shouldIncludeInSchedule = !cleanFilter || cleanFilter === lId.toLowerCase();

        if (shouldIncludeInSchedule) {
            let foundNextUnpaid = false;
            const installmentsCount = tenure;

            for (let i = 1; i <= installmentsCount; i++) {
                let instId = `EMI-${lId}-${i}`;
                let d = new Date();
                d.setMonth(d.getMonth() + i);

                let isUserPaid = paidEmiIds.has(instId);

                // Reducing balance math
                let monthlyInterest = currentBalance > 0 ? Math.round(currentBalance * r) : 0;
                let requiredEmi = currentBalance > 0 ? Math.min(emi, Math.round(currentBalance + monthlyInterest)) : 0;
                let principalPaid = currentBalance > 0 ? Math.min(currentBalance, requiredEmi - monthlyInterest) : 0;

                if (isUserPaid) {
                    currentBalance = Math.max(0, currentBalance - principalPaid);
                }

                let status = 'Pending';
                let isPayable = false;

                if (isUserPaid) {
                    status = 'Paid';
                    isPayable = false;
                } else if (currentBalance <= 0) {
                    status = 'Completed';
                    isPayable = false;
                } else if (!foundNextUnpaid) {
                    status = 'Upcoming';
                    isPayable = true;
                    foundNextUnpaid = true;
                } else {
                    status = 'Pending';
                    isPayable = false;
                }

                allEMIs.push({
                    id: instId,
                    loanId: lId,
                    installmentNo: i,
                    customerName: m.name || session.name || 'Customer',
                    customerEmail: m.email,
                    loanType: loanType,
                    emiAmount: requiredEmi > 0 ? requiredEmi : emi,
                    principalPaid: principalPaid,
                    monthlyInterest: monthlyInterest,
                    dueDate: d.toISOString().split('T')[0],
                    paidDate: isUserPaid ? new Date().toISOString().split('T')[0] : null,
                    penalty: 0,
                    status: status,
                    isPayable: isPayable,
                    isUserPaid: isUserPaid
                });
            }

            loanObj.outstandingBalance = currentBalance;
            loanObj.status = (currentBalance <= 0) ? 'Completed' : 'Active';
        }
    });

    // Pick computed loan from userLoansList
    let selectedComputedLoan = null;
    if (cleanFilter) {
        selectedComputedLoan = userLoansList.find(x => String(x.loanId || x.id).replace(/^#/, '').trim().toLowerCase() === cleanFilter);
    }
    if (!selectedComputedLoan && userLoansList.length > 0) {
        selectedComputedLoan = userLoansList[0];
    }
    currentSelectedLoan = selectedComputedLoan;

    updateRepaymentHeader(selectedComputedLoan, allEMIs);
    updateSummary(allEMIs);
    renderEMIs(allEMIs);
    populateLoanFilterDropdown(userMapped, selectedComputedLoan ? selectedComputedLoan.loanId : '');
    populatePredictorDropdown();

    // Render payment history on emi page
    buildPaymentHistoryRecords(userLoansList, allEMIs);
    renderPaymentHistory(allPaymentRecords);
}

// ── Update Repayment Header Banner & Table Badges ────────────────────────────
function updateRepaymentHeader(loan, emis) {
    if (!loan && userLoansList.length > 0) {
        loan = userLoansList[0];
    }

    const headerLoanId = document.getElementById('headerLoanId');
    const headerLoanType = document.getElementById('headerLoanType');
    const headerPrincipal = document.getElementById('headerPrincipal');
    const headerInterestRate = document.getElementById('headerInterestRate');
    const headerTenure = document.getElementById('headerTenure');
    const headerMonthlyEmi = document.getElementById('headerMonthlyEmi');
    const headerOutstanding = document.getElementById('headerOutstanding');

    const tableStatusBadge = document.getElementById('repaymentTableStatusBadge');
    const tableBadges = document.getElementById('repaymentTableBadges');
    const pageTitle = document.getElementById('pageTitle');
    const welcomeMsg = document.getElementById('welcomeMsg');

    if (loan) {
        const lId = String(loan.loanId || loan.id || '').replace(/^#/, '');
        const loanAmt = parseFloat(loan.loanAmount) || 0;
        const tenure = parseInt(loan.tenureMonths || loan.tenure) || 0;
        const emi = parseFloat(loan.emiAmount) || 0;
        const rate = loan.interestRate || 12.5;
        const currentBal = loan.outstandingBalance != null ? loan.outstandingBalance : loanAmt;
        const isClosed = currentBal <= 0;

        if (headerLoanId) headerLoanId.textContent = `Loan #${lId}`;
        if (headerLoanType) headerLoanType.textContent = loan.loanType || 'Personal Loan';
        if (headerPrincipal) headerPrincipal.textContent = fmt(loanAmt);
        if (headerInterestRate) headerInterestRate.textContent = `${rate}% p.a.`;
        if (headerTenure) headerTenure.textContent = `${tenure} Months`;
        if (headerMonthlyEmi) headerMonthlyEmi.textContent = fmt(emi);
        if (headerOutstanding) headerOutstanding.textContent = fmt(currentBal);

        if (tableStatusBadge) {
            tableStatusBadge.className = isClosed ? 'badge bg-primary ms-2' : 'badge bg-success ms-2';
            tableStatusBadge.textContent = isClosed ? 'Closed / Settled' : 'Active Account';
        }

        if (pageTitle) {
            pageTitle.innerHTML = `<i class="bi bi-credit-card me-2"></i>My Repayments & EMI Schedule - Loan #${lId}`;
        }
        if (welcomeMsg) {
            welcomeMsg.textContent = `${loan.loanType || 'Personal Loan'} • Principal: ${fmt(loanAmt)} • Tenure: ${tenure} Months • EMI: ${fmt(emi)}/mo • Outstanding: ${fmt(currentBal)}`;
        }

        if (tableBadges) {
            tableBadges.innerHTML = `
                <span class="badge bg-primary px-3 py-2 fs-6 shadow-sm"><i class="bi bi-hash me-1"></i>Loan: <strong>#${lId}</strong></span>
                <span class="badge bg-info text-dark px-3 py-2 fs-6 shadow-sm"><i class="bi bi-tag-fill me-1"></i>${loan.loanType || 'Personal Loan'}</span>
                <span class="badge bg-success px-3 py-2 fs-6 shadow-sm"><i class="bi bi-wallet2 me-1"></i>Principal: <strong>${fmt(loanAmt)}</strong></span>
                <span class="badge bg-warning text-dark px-3 py-2 fs-6 shadow-sm"><i class="bi bi-calendar3 me-1"></i>Tenure: <strong>${tenure} Months</strong></span>
                <span class="badge bg-secondary px-3 py-2 fs-6 shadow-sm"><i class="bi bi-percent me-1"></i>Rate: <strong>${rate}%</strong></span>
                <span class="badge bg-light text-dark px-3 py-2 fs-6 shadow-sm border"><i class="bi bi-cash-coin me-1"></i>Monthly EMI: <strong>${fmt(emi)}</strong></span>
                <span class="badge bg-danger px-3 py-2 fs-6 shadow-sm"><i class="bi bi-hourglass-split me-1"></i>Outstanding: <strong>${fmt(currentBal)}</strong></span>
            `;
        }
    } else {
        if (tableStatusBadge) {
            tableStatusBadge.className = 'badge bg-secondary ms-2';
            tableStatusBadge.textContent = 'All Loans';
        }
        if (tableBadges) {
            const totalAmt = userLoansList.reduce((acc, l) => acc + (parseFloat(l.loanAmount) || 0), 0);
            const totalEmisSum = userLoansList.reduce((acc, l) => acc + (parseFloat(l.emiAmount) || 0), 0);
            tableBadges.innerHTML = `
                <span class="badge bg-primary px-3 py-2 fs-6"><i class="bi bi-layers me-1"></i>Total Loans: <strong>${userLoansList.length}</strong></span>
                <span class="badge bg-success px-3 py-2 fs-6"><i class="bi bi-wallet2 me-1"></i>Total Principal: <strong>${fmt(totalAmt)}</strong></span>
                <span class="badge bg-warning text-dark px-3 py-2 fs-6"><i class="bi bi-cash-coin me-1"></i>Total Monthly EMI: <strong>${fmt(totalEmisSum)}</strong></span>
            `;
        }
    }
}

// ── Populate Loan Filter Dropdown ─────────────────────────────────────────────
function populateLoanFilterDropdown(loans, selectedId) {
    const sel = document.getElementById('selectLoanIdFilter');
    if (!sel) return;
    let opts = '<option value="">All My Loans</option>';
    loans.forEach(l => {
        const id = String(l.loanId || l.id).replace(/^#/, '').trim();
        const isSel = selectedId && id.toLowerCase() === String(selectedId).replace(/^#/, '').trim().toLowerCase();
        opts += `<option value="${id}" ${isSel ? 'selected' : ''}>Loan #${id} (${l.loanType || 'Loan'} - ${fmt(l.loanAmount)})</option>`;
    });
    sel.innerHTML = opts;
}

function onLoanFilterDropdownChange(val) {
    if (val) {
        localStorage.setItem('viewLoanId', val);
        const url = new URL(window.location.href);
        url.searchParams.set('loanId', val);
        window.history.pushState({}, '', url);
    } else {
        localStorage.removeItem('viewLoanId');
        const url = new URL(window.location.href);
        url.searchParams.delete('loanId');
        window.history.pushState({}, '', url);
    }
    loadEMIs();
}

// ── Update Summary Cards ───────────────────────────────────────────────────────
function updateSummary(emis) {
    const total   = emis.length;
    const paid    = emis.filter(e => e.status === 'Paid' || e.status === 'Completed').length;
    const due     = emis.filter(e => e.status === 'Pending' || e.status === 'Due' || e.status === 'Upcoming').length;
    const overdue = emis.filter(e => e.status === 'Overdue').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalEmis', total);
    set('paidEmis', paid);
    set('dueEmis', due);
    set('overdueEmis', overdue);
}

// ── Render EMI Table ───────────────────────────────────────────────────────────
function renderEMIs(emis) {
    const tbody = document.getElementById('emiBody');
    if (!tbody) return;

    if (!emis || emis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-info-circle me-1"></i> No active EMI repayment records found.</td></tr>';
        return;
    }

    tbody.innerHTML = emis.map((e, i) => {
        const instLabel = `Installment #${e.installmentNo || (i + 1)} (Loan #${e.loanId || e.id})`;

        let actionBtn = '';
        if (e.status === 'Paid') {
            actionBtn = `<button class="btn btn-sm btn-outline-success disabled" disabled><i class="bi bi-check-circle me-1"></i>Paid</button>`;
        } else if (e.status === 'Completed') {
            actionBtn = `<button class="btn btn-sm btn-outline-primary disabled" disabled><i class="bi bi-check-circle-fill me-1"></i>Closed</button>`;
        } else if (e.isPayable) {
            actionBtn = `<button class="btn btn-sm btn-primary fw-bold shadow-sm" onclick="payEMI('${e.id}')"><i class="bi bi-credit-card me-1"></i>Pay Now</button>`;
        } else {
            actionBtn = `<button class="btn btn-sm btn-secondary opacity-50" disabled title="Please pay previous installments first"><i class="bi bi-lock me-1"></i>Pay Now</button>`;
        }

        return `
        <tr class="align-middle">
            <td class="ps-3 fw-bold">${instLabel}</td>
            <td><span class="badge bg-info text-dark">${e.loanType || 'Personal Loan'}</span></td>
            <td>${fmtDate(e.dueDate)}</td>
            <td class="fw-bold text-success">${fmt(e.emiAmount || e.amount)}</td>
            <td>${fmt(e.penalty || 0)}</td>
            <td>${badge(e.status || 'Upcoming')}</td>
            <td>${actionBtn}</td>
        </tr>`;
    }).join('');
}

// ── Search / Filter ────────────────────────────────────────────────────────────
function filterEMIs() {
    const q = (document.getElementById('searchEmi')?.value || '').trim().toLowerCase();
    const status = document.getElementById('emiStatus')?.value || '';

    const filtered = allEMIs.filter(e => {
        const matchQ = !q || String(e.loanId || e.id || '').toLowerCase().includes(q) || (e.customerName || '').toLowerCase().includes(q) || (e.loanType || '').toLowerCase().includes(q);
        const matchS = !status || e.status === status;
        return matchQ && matchS;
    });
    renderEMIs(filtered);
    updateSummary(filtered);
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
                loanId: tx.loanId,
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

    // 2. Regular Monthly EMIs marked as Paid
    emis.forEach(e => {
        if (e.isUserPaid || e.status === 'Paid') {
            const ref = `PAY-EMI-${e.loanId}-${e.installmentNo || e.id}`;
            if (!seenRefs.has(ref)) {
                seenRefs.add(ref);
                allPaymentRecords.push({
                    ref: ref,
                    loanId: e.loanId,
                    loanType: e.loanType || 'Personal Loan',
                    type: 'Monthly EMI',
                    date: e.paidDate || e.dueDate || new Date().toISOString().split('T')[0],
                    amount: e.emiAmount || e.amount || 413,
                    principal: e.principalPaid || Math.round((e.emiAmount || 413) * 0.95),
                    interest: e.monthlyInterest || Math.round((e.emiAmount || 413) * 0.05),
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
    const badgeEl = document.getElementById('paymentHistoryCountBadge');
    if (badgeEl) badgeEl.textContent = `${records ? records.length : 0} Records`;
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
            ? `<span class="badge bg-success-subtle text-success border border-success-subtle fw-bold"><i class="bi bi-check-all me-1"></i>Applied to Principal</span>`
            : `<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Paid</span>`;

        return `
        <tr class="align-middle text-center">
            <td class="ps-3 fw-bold text-secondary small">${p.ref}</td>
            <td class="fw-bold text-primary">#${p.loanId}</td>
            <td>${typeBadge}</td>
            <td>${fmtDate(p.date)}</td>
            <td class="fw-bold text-dark">${fmt(p.amount)}</td>
            <td class="fw-bold text-success">${fmt(p.principal)}</td>
            <td class="text-muted">${fmt(p.interest)}</td>
            <td>${statusBadge}</td>
        </tr>`;
    }).join('');
}

// ── Pay EMI & Extra Prepayment Modal Handler ──────────────────────────────────
function payEMI(emiId) {
    let targetEmi = allEMIs.find(e => e.id === emiId);
    if (!targetEmi) return;

    let cleanTargetLoanId = String(targetEmi.loanId).replace(/^#/, '').trim();
    let uLoan = userLoansList.find(x => String(x.id).replace(/^#/, '').trim() === cleanTargetLoanId);
    let remPrincipal = uLoan ? (uLoan.outstandingBalance != null ? uLoan.outstandingBalance : uLoan.loanAmount) : 50000;
    let baseEmi = Math.min(targetEmi.emiAmount || 413, remPrincipal);
    let maxExtra = Math.max(0, Math.round(remPrincipal - baseEmi));

    let emiIdInput = document.getElementById('payModalEmiId');
    let loanIdInput = document.getElementById('payModalLoanId');
    let instNumDisp = document.getElementById('payModalInstNum');
    let loanIdDisp = document.getElementById('payModalLoanIdDisp');
    let remDisp = document.getElementById('payModalRemPrincipalDisp');
    let baseEmiInput = document.getElementById('payModalBaseEmi');
    let extraInput = document.getElementById('payModalExtraAmount');
    let hintEl = document.getElementById('payModalMaxHint');

    if (emiIdInput) emiIdInput.value = emiId;
    if (loanIdInput) loanIdInput.value = cleanTargetLoanId;
    if (instNumDisp) instNumDisp.textContent = `Installment #${targetEmi.installmentNo || 1}`;
    if (loanIdDisp) loanIdDisp.textContent = `#${cleanTargetLoanId}`;
    if (remDisp) remDisp.textContent = `₹${remPrincipal.toLocaleString('en-IN')}`;
    if (baseEmiInput) baseEmiInput.value = baseEmi;

    if (extraInput) {
        extraInput.value = 0;
        extraInput.setAttribute('data-max-extra', maxExtra);
    }
    if (hintEl) {
        hintEl.textContent = `Max allowed extra prepayment: ₹${maxExtra.toLocaleString('en-IN')} (to fully pay off remaining ₹${remPrincipal.toLocaleString('en-IN')} balance).`;
    }

    calcPayModalTotal();

    let modalEl = document.getElementById('payEmiModal');
    if (modalEl) {
        new bootstrap.Modal(modalEl).show();
    }
}

function calcPayModalTotal() {
    let base = parseFloat(document.getElementById('payModalBaseEmi')?.value) || 0;
    let extraInput = document.getElementById('payModalExtraAmount');
    let extra = parseFloat(extraInput?.value) || 0;
    let maxExtra = parseFloat(extraInput?.getAttribute('data-max-extra') || '999999999');

    if (!isNaN(maxExtra) && maxExtra >= 0 && extra > maxExtra) {
        extra = maxExtra;
        if (extraInput) extraInput.value = maxExtra;
    }

    let total = base + extra;
    let totalEl = document.getElementById('payModalTotalAmount');
    if (totalEl) totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
}

async function confirmEmiPayment() {
    let emiId = document.getElementById('payModalEmiId').value;
    let loanId = document.getElementById('payModalLoanId').value;
    let cleanLId = String(loanId).replace(/^#/, '').trim();
    let baseEmi = parseFloat(document.getElementById('payModalBaseEmi').value) || 0;
    let extraInput = document.getElementById('payModalExtraAmount');
    let extraVal = parseFloat(extraInput?.value) || 0;
    let maxExtra = parseFloat(extraInput?.getAttribute('data-max-extra') || '999999999');

    if (!isNaN(maxExtra) && maxExtra >= 0 && extraVal > maxExtra) {
        extraVal = maxExtra;
        alert(`Extra prepayment capped at ₹${maxExtra.toLocaleString('en-IN')} so total payment does not exceed your remaining loan balance.`);
    }

    let modalEl = document.getElementById('payEmiModal');
    let modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    // 1. Save paid EMI ID
    const paidEmiIds = new Set(JSON.parse(localStorage.getItem('slm_paid_emis') || '[]'));
    paidEmiIds.add(emiId);
    localStorage.setItem('slm_paid_emis', JSON.stringify(Array.from(paidEmiIds)));

    // 2. Save extra prepayment amount
    if (extraVal > 0) {
        let extraPayments = JSON.parse(localStorage.getItem('slm_extra_payments') || '{}');
        let prevExtra = parseFloat(extraPayments[cleanLId] || extraPayments['#' + cleanLId] || 0);
        let newExtra = prevExtra + extraVal;
        extraPayments[cleanLId] = newExtra;
        extraPayments['#' + cleanLId] = newExtra;
        localStorage.setItem('slm_extra_payments', JSON.stringify(extraPayments));
    }

    // 3. Save explicit transaction log in slm_payment_transactions
    let txHistory = JSON.parse(localStorage.getItem('slm_payment_transactions') || '[]');
    let nowStr = new Date().toISOString().split('T')[0];
    let instNum = emiId.split('-').pop() || '1';

    txHistory.push({
        ref: `PAY-EMI-${cleanLId}-${instNum}`,
        loanId: cleanLId,
        type: 'Monthly EMI',
        date: nowStr,
        amount: baseEmi,
        principal: Math.round(baseEmi * 0.95),
        interest: Math.round(baseEmi * 0.05),
        status: 'Paid'
    });

    if (extraVal > 0) {
        txHistory.push({
            ref: `PREPAY-${cleanLId}-${Date.now().toString().slice(-4)}`,
            loanId: cleanLId,
            type: 'Extra Prepayment',
            date: nowStr,
            amount: extraVal,
            principal: extraVal,
            interest: 0,
            status: 'Applied to Principal'
        });
    }
    localStorage.setItem('slm_payment_transactions', JSON.stringify(txHistory));

    try {
        await fetch(`${API}/emi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emiId: emiId, extraAmount: extraVal })
        });
    } catch(e) {
        console.warn("API payment call fallback to local state update", e);
    }

    let msg = 'EMI payment processed successfully!';
    if (extraVal >= maxExtra && maxExtra >= 0) {
        msg += `\n\n🎉 Congratulations! Your extra prepayment of ₹${extraVal.toLocaleString('en-IN')} has FULLY PAID OFF & CLOSED your loan balance!`;
    } else if (extraVal > 0) {
        msg += `\n\nExtra prepayment of ₹${extraVal.toLocaleString('en-IN')} applied directly to reduce your principal balance!`;
    }
    alert(msg);
    loadEMIs();
}

// ── Early Loan Closure Predictor Widget Logic (Linear Regression Model) ───────
function populatePredictorDropdown() {
    const sel = document.getElementById('predictorLoanSelect');
    if (!sel) return;
    sel.innerHTML = userLoansList.map(l => 
        `<option value="${l.loanId || l.id}">${l.loanType} (#${l.loanId || l.id}) - Principal ${fmt(l.outstandingBalance != null ? l.outstandingBalance : l.loanAmount)}</option>`
    ).join('');
    
    if (userLoansList.length > 0) {
        const targetId = currentSelectedLoan ? (currentSelectedLoan.loanId || currentSelectedLoan.id) : (userLoansList[0].loanId || userLoansList[0].id);
        sel.value = targetId;
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

    const originalTotalCost = standardEmi * originalTenureMonths;

    if (totalPayment >= principal) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + 1);
        const closureDateStr = targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        return {
            newTenureMonths: 1,
            monthsSaved: Math.max(0, originalTenureMonths - 1),
            interestSaved: Math.max(0, Math.round(originalTotalCost - principal)),
            closureDateStr: closureDateStr
        };
    }
    
    const term1 = 1 - (principal * r / totalPayment);
    if (term1 <= 0) return { error: "Invalid payment amount." };
    
    const newTenureExact = -Math.log(term1) / Math.log(1 + r);
    const newTenureMonths = Math.ceil(newTenureExact);
    const monthsSaved = Math.max(0, originalTenureMonths - newTenureMonths);
    
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
    
    const cleanSelVal = String(sel.value).replace(/^#/, '').trim().toLowerCase();
    const targetLoan = userLoansList.find(l => String(l.loanId || l.id).replace(/^#/, '').trim().toLowerCase() === cleanSelVal);
    if (!targetLoan) return;
    
    const standardEmiEl = document.getElementById('predictorStandardEmi');
    if (standardEmiEl) standardEmiEl.value = Number(targetLoan.emiAmount || 413).toLocaleString('en-IN');
    
    const extraInputEl = document.getElementById('predictorExtraInput');
    let extraVal = parseFloat(extraInputEl?.value) || 0;
    const principal = parseFloat(targetLoan.outstandingBalance != null ? targetLoan.outstandingBalance : (targetLoan.loanAmount || 2000));
    const rateAnnual = getProductInterestRate(targetLoan.loanType, targetLoan.interestRate);
    const standardEmi = parseFloat(targetLoan.emiAmount) || 413;
    const originalTenure = parseInt(targetLoan.tenureMonths || targetLoan.tenure) || 5;

    // Set sensible default extra payment if input exceeds loan
    if (extraVal > principal && principal > 0) {
        extraVal = Math.min(500, Math.round(principal / 4));
        if (extraInputEl) extraInputEl.value = extraVal;
    }

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
