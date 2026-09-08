// ============================================================
//  Loans Page JavaScript
// ============================================================

const API = 'http://localhost:8080';

const DEMO_LOANS = [
    { id: 1, customerName: 'Rahul Kumar', loanType: 'Personal Loan', loanAmount: 200000, interestRate: 10.5, tenureMonths: 36, emiAmount: 6495, outstandingBalance: 130000, startDate: '2024-01-15', status: 'Active' },
    { id: 2, customerName: 'Priya Sharma', loanType: 'Home Loan', loanAmount: 1500000, interestRate: 8.5, tenureMonths: 180, emiAmount: 14751, outstandingBalance: 1200000, startDate: '2023-06-20', status: 'Active' },
    { id: 3, customerName: 'Arun Velmurugan', loanType: 'Education Loan', loanAmount: 450000, interestRate: 9.0, tenureMonths: 60, emiAmount: 9330, outstandingBalance: 250000, startDate: '2023-09-10', status: 'Active' },
    { id: 4, customerName: 'Meena Krishnan', loanType: 'Business Loan', loanAmount: 800000, interestRate: 12.0, tenureMonths: 48, emiAmount: 21067, outstandingBalance: 0, startDate: '2022-01-01', status: 'Completed' },
    { id: 5, customerName: 'Vijay Raj', loanType: 'Vehicle Loan', loanAmount: 500000, interestRate: 9.5, tenureMonths: 60, emiAmount: 10490, outstandingBalance: 350000, startDate: '2024-03-01', status: 'Active' }
];

const DEMO_CUSTOMERS = [
    { id: 2, firstName: 'Rahul', lastName: 'Kumar', email: 'rahul@example.com' },
    { id: 3, firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com' },
    { id: 4, firstName: 'Arun', lastName: 'Velmurugan', email: 'arun@example.com' },
    { id: 5, firstName: 'Meena', lastName: 'Krishnan', email: 'meena@example.com' },
    { id: 6, firstName: 'Vijay', lastName: 'Raj', email: 'vijay@example.com' }
];

let allLoans = [];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function badge(s) {
    const m = { 'Active':'success','Completed':'primary','Overdue':'danger','Pending':'warning','Approved':'info','Defaulted':'dark' };
    return `<span class="badge bg-${m[s]||'secondary'}">${s}</span>`;
}

window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(s);
    
    if (session.role === 'Customer') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    } else {
        const titleText = document.getElementById('loansHeaderTitle');
        if(titleText) titleText.textContent = "All Loans";
        const sidebarText = document.querySelector('.sidebarLoansText');
        if(sidebarText) sidebarText.textContent = "Loans";
    }

    loadLoans();

    document.getElementById('addLoanForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addLoan();
    });

});

// ── Load Loans ─────────────────────────────────────────────────────────────────
async function loadLoans() {
    try {
        const session = JSON.parse(localStorage.getItem('slm_session'));
        const url = (session && session.role === 'Customer') 
            ? `${API}/loans?customerId=${session.id}`
            : `${API}/loans`;
            
        const res = await fetch(url);
        allLoans = await res.json();
    } catch { allLoans = DEMO_LOANS; }
    renderLoans(allLoans);
}

function renderLoans(loans) {
    const tbody = document.getElementById('loansBody');
    if (!tbody) return;

    if (!loans || loans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No loans found.</td></tr>';
        return;
    }

    const session = JSON.parse(localStorage.getItem('slm_session') || '{}');
    const isAdmin = session.role === 'Admin';

    tbody.innerHTML = loans.map((l, i) => {
        const pct = l.loanAmount > 0 ? Math.round(((l.loanAmount - l.outstandingBalance) / l.loanAmount) * 100) : 0;
        return `
        <tr class="fade-in" style="animation-delay:${i*0.06}s">
            <td><strong>#${l.id}</strong></td>
            ${isAdmin ? `<td>${l.customerName || '-'}</td>` : ''}
            <td>${l.loanType || '-'}</td>
            <td>${fmt(l.loanAmount)}</td>
            <td>${l.interestRate}%</td>
            <td>${fmt(l.emiAmount)}</td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height:10px;border-radius:5px">
                        <div class="progress-bar bg-success" style="width:${pct}%"></div>
                    </div>
                    <small>${pct}%</small>
                </div>
            </td>
            <td>${badge(l.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewLoanEMI(${l.id})" title="View EMI Schedule">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ── Search / Filter ────────────────────────────────────────────────────────────
function searchLoans() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const type = document.getElementById('filterType')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    const filtered = allLoans.filter(l => {
        const matchQ = !q || (l.customerName || '').toLowerCase().includes(q) || (l.loanType || '').toLowerCase().includes(q);
        const matchT = !type || l.loanType === type;
        const matchS = !status || l.status === status;
        return matchQ && matchT && matchS;
    });
    renderLoans(filtered);
}

// ── View EMI Schedule ──────────────────────────────────────────────────────────
async function viewLoanEMI(loanId) {
    localStorage.setItem('viewLoanId', loanId);
    window.location.href = 'emi.html?loanId=' + loanId;
}

// ── EMI Calculator ─────────────────────────────────────────────────────────────
function calculateEMI() {
    const P = parseFloat(document.getElementById('calcAmount')?.value || 0);
    const r = parseFloat(document.getElementById('calcRate')?.value || 0) / (12 * 100);
    const n = parseInt(document.getElementById('calcTenure')?.value || 0);

    if (!P || !r || !n) return;

    const emi  = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    const interest = total - P;

    document.getElementById('calcResult').style.display = 'block';
    document.getElementById('calcEMI').textContent   = fmt(Math.round(emi));
    document.getElementById('calcTotal').textContent = fmt(Math.round(total));
    document.getElementById('calcInt').textContent   = fmt(Math.round(interest));
}

// ── Load Customers in Add Loan Dropdown ───────────────────────────────────────
async function loadCustomersDropdown() {
    let customers = [];
    try {
        const res = await fetch(`${API}/customers`);
        customers = await res.json();
    } catch { customers = DEMO_CUSTOMERS; }

    const sel = document.getElementById('loanCustomerId');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Customer</option>' +
        customers.map(c => `<option value="${c.id}">${c.firstName} ${c.lastName} — ${c.email}</option>`).join('');
}

// ── Add Loan ───────────────────────────────────────────────────────────────────
async function addLoan() {
    const customerId   = document.getElementById('addCustomerId')?.value;
    const loanType     = document.getElementById('addLoanType')?.value;
    const loanAmount   = parseFloat(document.getElementById('addLoanAmount')?.value || 0);
    const interestRate = parseFloat(document.getElementById('addInterestRate')?.value || 0);
    const tenureMonths = parseInt(document.getElementById('addTenureMonths')?.value || 0);
    const startDate    = document.getElementById('addStartDate')?.value;

    if (!customerId || !loanType || !loanAmount || !interestRate || !tenureMonths || !startDate) {
        alert('Please fill in all fields.'); return;
    }

    const btn = document.getElementById('addLoanBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; }

    try {
        const res = await fetch(`${API}/loans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: parseInt(customerId), loanType, loanAmount, interestRate, tenureMonths, startDate })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert('Loan added successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addLoanModal'));
            if (modal) modal.hide();
            loadLoans();

    document.getElementById('addLoanForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addLoan();
    });

        } else { alert('Failed to add loan: ' + (data.message || '')); }
    } catch {
        // Demo mode: simulate adding
        alert('Loan added successfully! (Demo mode)');
        const modal = bootstrap.Modal.getInstance(document.getElementById('addLoanModal'));
        if (modal) modal.hide();
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Loan'; }
}

// ── Init ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('slm_session')) { window.location.href = 'index.html'; return; }
    const session = JSON.parse(localStorage.getItem('slm_session'));
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;

    if (session.role === 'Customer') {
        const addBtn = document.querySelector('[data-bs-target="#addLoanModal"]');
        if (addBtn) addBtn.style.display = 'none';
    }

    loadLoans();

    document.getElementById('addLoanForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addLoan();
    });

    if (session.role !== 'Customer') {
        loadCustomersDropdown();
    }
});
