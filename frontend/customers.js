
const API = 'http://localhost:8080';

// ── Initialization ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // 1. Session & Role Check
    const sessionStr = localStorage.getItem('slm_session');
    if (!sessionStr) {
        window.location.href = 'login.html';
        return;
    }
    const session = JSON.parse(sessionStr);

    // KICK OUT CUSTOMERS!
    if (session.role === 'Customer') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Admin Initialization
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    document.getElementById('profileName').textContent = session.name;

    // 2. Fetch Customers
    loadCustomers();
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function showAlert(msg, type = 'danger') {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

async function loadCustomers() {
    try {
        const res = await fetch(`${API}/customers`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        renderTable(data);
    } catch (err) {
        showAlert(err.message, 'danger');
        document.getElementById('customersTableBody').innerHTML = 
            `<tr><td colspan="6" class="text-center text-muted">Error loading data.</td></tr>`;
    }
}

function renderTable(data) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No customers found.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.firstName}</td>
            <td>${c.lastName}</td>
            <td>${c.email}</td>
            <td>${c.mobile}</td>
            <td><span class="badge ${c.role === 'Admin' ? 'bg-primary' : 'bg-secondary'}">${c.role}</span></td>
        </tr>
    `).join('');
}

function logout() {
    localStorage.removeItem('slm_session');
    window.location.href = 'login.html';
}
