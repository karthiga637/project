// ============================================================
//  Reports Page JavaScript
// ============================================================

const API = 'http://localhost:8080';

const DEMO_REPORTS = {
    totalLoansDisbursed: 125,
    totalAmountDisbursed: 55000000,
    totalInterestEarned: 4500000,
    activeLoans: 98,
    closedLoans: 20,
    defaultedLoans: 7,
    recentTransactions: [
        { id: 'TRX-1001', date: '2024-05-10', customer: 'Rahul Kumar', type: 'EMI Payment', amount: 6495, status: 'Success' },
        { id: 'TRX-1002', date: '2024-05-09', customer: 'Priya Sharma', type: 'Loan Disbursement', amount: 1500000, status: 'Success' },
        { id: 'TRX-1003', date: '2024-05-08', customer: 'Arun Velmurugan', type: 'EMI Payment', amount: 9330, status: 'Failed' },
        { id: 'TRX-1004', date: '2024-05-07', customer: 'Vijay Raj', type: 'EMI Payment', amount: 10490, status: 'Success' },
        { id: 'TRX-1005', date: '2024-05-06', customer: 'Meena Krishnan', type: 'Prepayment', amount: 50000, status: 'Success' }
    ]
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ── Load Reports ───────────────────────────────────────────────────────────────
async function loadReports() {
    let data = null;
    try {
        const res = await fetch(`${API}/reports`);
        data = await res.json();
    } catch { data = DEMO_REPORTS; }

    updateReportCards(data);
    renderTransactions(data.recentTransactions || []);
}

function updateReportCards(data) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('totalLoansDisbursed', data.totalLoansDisbursed || 0);
    set('totalAmountDisbursed', fmt(data.totalAmountDisbursed || 0));
    set('totalInterestEarned', fmt(data.totalInterestEarned || 0));
    set('activeLoans', data.activeLoans || 0);
    set('closedLoans', data.closedLoans || 0);
    set('defaultedLoans', data.defaultedLoans || 0);
}

function renderTransactions(trx) {
    const tbody = document.getElementById('transactionBody');
    if (!tbody) return;

    if (!trx || trx.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No recent transactions.</td></tr>';
        return;
    }

    tbody.innerHTML = trx.map((t, i) => {
        const statusClass = t.status === 'Success' ? 'success' : t.status === 'Failed' ? 'danger' : 'warning';
        return `
        <tr class="fade-in" style="animation-delay:${i*0.05}s">
            <td><strong>${t.id}</strong></td>
            <td>${fmtDate(t.date)}</td>
            <td>${t.customer}</td>
            <td>${t.type}</td>
            <td><strong>${fmt(t.amount)}</strong></td>
            <td><span class="badge bg-${statusClass}">${t.status}</span></td>
        </tr>`;
    }).join('');
}

// ── Generate Custom Report ─────────────────────────────────────────────────────
function generateCustomReport() {
    const type = document.getElementById('reportType')?.value;
    const start = document.getElementById('startDate')?.value;
    const end = document.getElementById('endDate')?.value;

    if (!type || !start || !end) {
        alert('Please fill out all fields to generate a custom report.');
        return;
    }

    alert(`Generating ${type.toUpperCase()} report from ${start} to ${end}...\n\n(This feature will download a PDF/Excel file in production)`);
}

// ── Export ─────────────────────────────────────────────────────────────────────
function exportReport(format) {
    alert(`Exporting reports in ${format.toUpperCase()} format...\n(Demo mode)`);
}

// ── Init ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('slm_session')) { window.location.href = 'login.html'; return; }
    const session = JSON.parse(localStorage.getItem('slm_session'));
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;
    loadReports();
});
