// ============================================================
//  Customer Management Page JavaScript
// ============================================================

const API = 'http://localhost:8080';

const DEMO_CUSTOMERS = [
    { id: 2, firstName: 'Rahul', lastName: 'Kumar', email: 'rahul@example.com', mobile: '9876500001', occupation: 'Software Engineer', income: 85000, loanType: 'Personal Loan', createdAt: '2024-01-10' },
    { id: 3, firstName: 'Priya', lastName: 'Sharma', email: 'priya@example.com', mobile: '9876500002', occupation: 'Teacher', income: 45000, loanType: 'Home Loan', createdAt: '2023-06-15' },
    { id: 4, firstName: 'Arun', lastName: 'Velmurugan', email: 'arun@example.com', mobile: '9876500003', occupation: 'Doctor', income: 120000, loanType: 'Education Loan', createdAt: '2023-09-05' },
    { id: 5, firstName: 'Meena', lastName: 'Krishnan', email: 'meena@example.com', mobile: '9876500004', occupation: 'Business Owner', income: 200000, loanType: 'Business Loan', createdAt: '2022-01-01' },
    { id: 6, firstName: 'Vijay', lastName: 'Raj', email: 'vijay@example.com', mobile: '9876500005', occupation: 'Marketing Manager', income: 65000, loanType: 'Vehicle Loan', createdAt: '2024-03-01' }
];

let allCustomers = [];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtDate(d) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

// ── Load Customers ─────────────────────────────────────────────────────────────
async function loadCustomers() {
    try {
        const res = await fetch(`${API}/customers`);
        allCustomers = await res.json();
    } catch { allCustomers = DEMO_CUSTOMERS; }

    renderCustomers(allCustomers);
    updateStats(allCustomers);
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customerBody');
    if (!tbody) return;

    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No customers found.</td></tr>';
        return;
    }

    tbody.innerHTML = customers.map((c, i) => `
        <tr class="fade-in" style="animation-delay:${i*0.06}s">
            <td><strong>#${c.id}</strong></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                         style="width:35px;height:35px;font-size:0.9rem;font-weight:600">
                        ${(c.firstName||'?')[0].toUpperCase()}
                    </div>
                    <div>
                        <strong>${c.firstName} ${c.lastName}</strong><br>
                        <small class="text-muted">${c.email}</small>
                    </div>
                </div>
            </td>
            <td>${c.mobile || '-'}</td>
            <td>${c.occupation || '-'}</td>
            <td>${fmt(c.income || c.monthlyIncome || 0)}</td>
            <td><span class="badge bg-info">${c.loanType || 'N/A'}</span></td>
            <td>${fmtDate(c.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewCustomerLoans(${c.id},'${c.firstName} ${c.lastName}')" title="View Loans">
                    <i class="bi bi-cash-stack"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${c.id},'${c.firstName} ${c.lastName}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ── Stats ──────────────────────────────────────────────────────────────────────
function updateStats(customers) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('totalCount', customers.length);
    set('activeCount', customers.filter(c => c.loanType).length);
}

// ── Search ─────────────────────────────────────────────────────────────────────
function searchCustomers() {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const occupation = (document.getElementById('filterOccupation')?.value || '').toLowerCase();

    const filtered = allCustomers.filter(c => {
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        const matchQ = !q || name.includes(q) || (c.email||'').toLowerCase().includes(q) || (c.mobile||'').includes(q);
        const matchO = !occupation || (c.occupation||'').toLowerCase().includes(occupation);
        return matchQ && matchO;
    });
    renderCustomers(filtered);
}

// ── View Customer Loans ────────────────────────────────────────────────────────
function viewCustomerLoans(customerId, name) {
    localStorage.setItem('viewCustomerId', customerId);
    localStorage.setItem('viewCustomerName', name);
    window.location.href = 'loans.html';
}

// ── Delete Customer ────────────────────────────────────────────────────────────
async function deleteCustomer(id, name) {
    if (!confirm(`Are you sure you want to delete customer: ${name}?\nThis will also delete their loan records.`)) return;

    try {
        const res = await fetch(`${API}/customers?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.status === 'success') {
            alert('Customer deleted successfully!');
            loadCustomers();
        } else { alert('Failed to delete customer.'); }
    } catch {
        // Demo: remove locally
        allCustomers = allCustomers.filter(c => c.id !== id);
        renderCustomers(allCustomers);
        updateStats(allCustomers);
        alert('Customer deleted! (Demo mode)');
    }
}

// ── Add Customer ───────────────────────────────────────────────────────────────
async function addCustomer() {
    const firstName  = document.getElementById('custFirstName')?.value.trim();
    const lastName   = document.getElementById('custLastName')?.value.trim();
    const email      = document.getElementById('custEmail')?.value.trim();
    const mobile     = document.getElementById('custMobile')?.value.trim();
    const address    = document.getElementById('custAddress')?.value.trim();
    const occupation = document.getElementById('custOccupation')?.value.trim();
    const income     = parseFloat(document.getElementById('custIncome')?.value || 0);
    const loanType   = document.getElementById('custLoanType')?.value;

    if (!firstName || !lastName || !email || !mobile) {
        alert('Please fill in required fields (First Name, Last Name, Email, Mobile).'); return;
    }

    const btn = document.getElementById('addCustBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    try {
        const res = await fetch(`${API}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, mobile, address, occupation, income, loanType })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert('Customer added successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
            if (modal) modal.hide();
            document.getElementById('addCustomerForm')?.reset();
            loadCustomers();
        } else { alert('Failed: ' + (data.message || '')); }
    } catch {
        // Demo
        const newId = Math.max(...allCustomers.map(c => c.id)) + 1;
        allCustomers.unshift({ id: newId, firstName, lastName, email, mobile, occupation, income, loanType, createdAt: new Date().toISOString().split('T')[0] });
        renderCustomers(allCustomers);
        updateStats(allCustomers);
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        if (modal) modal.hide();
        alert('Customer added! (Demo mode)');
    }

    if (btn) { btn.disabled = false; btn.textContent = 'Add Customer'; }
}

// ── Export CSV ─────────────────────────────────────────────────────────────────
function exportCSV() {
    const headers = ['ID','First Name','Last Name','Email','Mobile','Occupation','Income','Loan Type','Created'];
    const rows = allCustomers.map(c => [c.id, c.firstName, c.lastName, c.email, c.mobile, c.occupation, c.income||c.monthlyIncome||0, c.loanType, c.createdAt]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'customers.csv';
    a.click();
}

// ── Init ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('slm_session')) { window.location.href = 'login.html'; return; }
    const session = JSON.parse(localStorage.getItem('slm_session'));
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;
    loadCustomers();
});
