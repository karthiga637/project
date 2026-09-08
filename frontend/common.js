// ============================================================
//  Smart Loan Management - Shared Utilities
// ============================================================

const API_BASE = 'http://localhost:8080';

// ── Session Management ─────────────────────────────────────────────────────────
function getSession() {
    const s = localStorage.getItem('slm_session');
    return s ? JSON.parse(s) : null;
}

function setSession(data) {
    localStorage.setItem('slm_session', JSON.stringify(data));
}

function clearSession() {
    localStorage.removeItem('slm_session');
}

function requireLogin() {
    const session = getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// ── Toast Notifications ────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Format Currency ────────────────────────────────────────────────────────────
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return '₹' + parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// ── Format Date ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function statusBadge(status) {
    const map = {
        'Active': 'success', 'Paid': 'success', 'Low': 'success', 'Approved': 'success',
        'Pending': 'warning', 'Due Soon': 'warning', 'Due': 'warning', 'Medium': 'warning',
        'Overdue': 'danger', 'High': 'danger', 'Defaulted': 'danger', 'Rejected': 'danger',
        'Completed': 'primary'
    };
    const cls = map[status] || 'secondary';
    return `<span class="badge bg-${cls}">${status}</span>`;
}

// ── Progress Bar ───────────────────────────────────────────────────────────────
function progressBar(pct, color = 'success') {
    const p = Math.min(Math.max(pct, 0), 100);
    return `<div class="progress"><div class="progress-bar bg-${color}" style="width:${p}%">${p}%</div></div>`;
}

// ── Set User Info in Topbar ────────────────────────────────────────────────────
function setTopbarUser() {
    const session = getSession();
    if (!session) return;
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;
}

// ── API Helper ─────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    try {
        const res = await fetch(API_BASE + path, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('API error for', path, ':', e.message);
        return null;
    }
}
