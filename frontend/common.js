// ============================================================
//  Smart Loan Management - Shared Utilities & Auth Guards
// ============================================================

const API_BASE = 'http://127.0.0.1:8080';

// ── Session Management & Strict Auth Protection ──────────────────────────────
function getSession() {
    const s = localStorage.getItem('slm_session');
    if (!s) return null;
    try {
        const session = JSON.parse(s);
        if (!session || !session.role) return null;
        return session;
    } catch(e) {
        localStorage.removeItem('slm_session');
        return null;
    }
}

function setSession(data) {
    localStorage.setItem('slm_session', JSON.stringify(data));
}

function clearSession() {
    localStorage.removeItem('slm_session');
    sessionStorage.clear();
}

function checkAuth(allowedRoles = []) {
    const session = getSession();
    if (!session) {
        window.location.replace('login.html');
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
        // Redirect unauthorized role attempt to correct dashboard
        if (session.role === 'Admin') {
            window.location.replace('admin-dashboard.html');
        } else if (session.role === 'BankManager') {
            window.location.replace('bank-manager-dashboard.html');
        } else {
            window.location.replace('customer.html');
        }
        return null;
    }
    return session;
}

function initAuthGuard(allowedRoles = []) {
    // 1. Check immediately on script load
    checkAuth(allowedRoles);

    // 2. Check on Back/Forward Browser Cache Restore (bfcache)
    window.addEventListener('pageshow', function (event) {
        checkAuth(allowedRoles);
    });

    // 3. Check on Tab Focus / Visibility Change
    window.addEventListener('focus', function () {
        checkAuth(allowedRoles);
    });

    // 4. Periodic check to detect logout from another tab/window
    setInterval(function() {
        if (!localStorage.getItem('slm_session')) {
            window.location.replace('login.html');
        }
    }, 1000);
}

function redirectIfLoggedIn() {
    const session = getSession();
    if (session) {
        if (session.role === 'Admin') window.location.replace('admin-dashboard.html');
        else if (session.role === 'BankManager') window.location.replace('bank-manager-dashboard.html');
        else window.location.replace('customer.html');
    }
}

function logout() {
    clearSession();
    window.location.replace('login.html');
}

function goToDashboard() {
    const session = getSession();
    if (!session) {
        window.location.replace('login.html');
        return;
    }
    if (session.role === 'Admin') {
        window.location.replace('admin-dashboard.html');
    } else if (session.role === 'BankManager') {
        window.location.replace('bank-manager-dashboard.html');
    } else {
        window.location.replace('customer.html');
    }
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
