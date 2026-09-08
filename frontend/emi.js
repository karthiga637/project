// ============================================================
//  EMI Tracking Page JavaScript
// ============================================================

const API = 'http://localhost:8080';

const DEMO_EMIS = Array.from({ length: 36 }, (_, i) => ({
    id: i + 1,
    loanId: 1,
    loanType: 'Personal Loan',
    customerName: 'Rahul Kumar',
    installmentNo: i + 1,
    dueDate: new Date(2024, 1 + i, 15).toISOString().split('T')[0],
    emiAmount: 6495,
    principalComponent: 4800 + i * 30,
    interestComponent: 1695 - i * 30,
    outstandingBalance: Math.max(200000 - (i + 1) * 5500, 0),
    status: i < 20 ? 'Paid' : i < 22 ? 'Overdue' : 'Pending',
    paidDate: i < 20 ? new Date(2024, 1 + i, 14).toISOString().split('T')[0] : null
}));

let allEMIs = [];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
function badge(s) {
    const m = { Paid: 'success', Pending: 'warning', Overdue: 'danger' };
    return `<span class="badge bg-${m[s]||'secondary'}">${s}</span>`;
}

// ── Load EMIs ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(s);
    if (session.role === 'Customer') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    loadEMIs();
});

async function loadEMIs() {
    // Check URL for loanId filter
    const params = new URLSearchParams(window.location.search);
    const loanId = params.get('loanId') || localStorage.getItem('viewLoanId');

    try {
        const url = loanId ? `${API}/emi?loanId=${loanId}` : `${API}/emi`;
        const res = await fetch(url);
        let data = await res.json();
        
        const session = JSON.parse(localStorage.getItem('slm_session'));
        if (!loanId && session && session.role === 'Customer') {
            const loanRes = await fetch(`${API}/loans?customerId=${session.id}`);
            const userLoans = await loanRes.json();
            const myLoanIds = userLoans.map(l => l.id);
            data = data.filter(e => myLoanIds.includes(e.loanId));
        }
        allEMIs = data;
    } catch {
        allEMIs = DEMO_EMIS;
    }

    updateSummary(allEMIs);
    renderEMIs(allEMIs);
    renderEMIChart(allEMIs);
}

// ── Update Summary Cards ───────────────────────────────────────────────────────
function updateSummary(emis) {
    const paid    = emis.filter(e => e.status === 'Paid').length;
    const pending = emis.filter(e => e.status === 'Pending').length;
    const overdue = emis.filter(e => e.status === 'Overdue').length;
    const totalPaid = emis.filter(e => e.status === 'Paid').reduce((s, e) => s + e.emiAmount, 0);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalPaid', paid);
    set('totalPending', pending);
    set('totalOverdue', overdue);
    set('totalPaidAmt', fmt(totalPaid));
}

// ── Render EMI Table ───────────────────────────────────────────────────────────
function renderEMIs(emis) {
    const tbody = document.getElementById('emiBody');
    if (!tbody) return;

    if (!emis || emis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No EMI records found.</td></tr>';
        return;
    }

    tbody.innerHTML = emis.map((e, i) => `
        <tr class="fade-in" style="animation-delay:${i*0.04}s">
            <td><strong>#${e.installmentNo || i+1}</strong></td>
            <td>${e.customerName || (e.loanType ? '' : '-')}</td>
            <td>${e.loanType || '-'}</td>
            <td>${fmtDate(e.dueDate)}</td>
            <td>${fmt(e.emiAmount)}</td>
            <td>${fmt(e.principalComponent)}</td>
            <td>${fmt(e.interestComponent)}</td>
            <td>${fmt(e.outstandingBalance)}</td>
            <td>${badge(e.status)}</td>
            <td>${e.paidDate ? fmtDate(e.paidDate) : '-'}</td>
            <td>
                ${e.status !== 'Paid'
                    ? `<button class="btn btn-sm btn-success" onclick="payEMI(${e.id})">
                        <i class="bi bi-check-circle me-1"></i>Pay
                       </button>`
                    : `<span class="text-success"><i class="bi bi-check-circle-fill"></i></span>`
                }
            </td>
        </tr>
    `).join('');
}

// ── Search / Filter ────────────────────────────────────────────────────────────
function filterEMIs() {
    const q = (document.getElementById('emiSearch')?.value || '').toLowerCase();
    const status = document.getElementById('filterStatus')?.value || '';

    const filtered = allEMIs.filter(e => {
        const matchQ = !q || (e.customerName || '').toLowerCase().includes(q) || (e.loanType || '').toLowerCase().includes(q);
        const matchS = !status || e.status === status;
        return matchQ && matchS;
    });
    renderEMIs(filtered);
}

// ── Pay EMI ────────────────────────────────────────────────────────────────────
async function payEMI(emiId) {
    if (!confirm('Mark this EMI as Paid?')) return;

    try {
        const res = await fetch(`${API}/emi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emiId })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert('EMI marked as paid!');
            loadEMIs();
        } else { alert('Failed: ' + (data.message || '')); }
    } catch {
        // Demo: update locally
        const emi = allEMIs.find(e => e.id === emiId);
        if (emi) {
            emi.status = 'Paid';
            emi.paidDate = new Date().toISOString().split('T')[0];
        }
        renderEMIs(allEMIs);
        updateSummary(allEMIs);
        alert('EMI marked as paid! (Demo mode)');
    }
}

// ── EMI Doughnut Chart ─────────────────────────────────────────────────────────
function renderEMIChart(emis) {
    const ctx = document.getElementById('emiStatusChart');
    if (!ctx) return;

    const paid    = emis.filter(e => e.status === 'Paid').length;
    const pending = emis.filter(e => e.status === 'Pending').length;
    const overdue = emis.filter(e => e.status === 'Overdue').length;

    if (window._emiChart) window._emiChart.destroy();

    window._emiChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Pending', 'Overdue'],
            datasets: [{
                data: [paid, pending, overdue],
                backgroundColor: ['#198754', '#ffc107', '#dc3545'],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ── Init ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('slm_session')) { window.location.href = 'login.html'; return; }
    const session = JSON.parse(localStorage.getItem('slm_session'));
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;
    loadEMIs();
});
