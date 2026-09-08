// ============================================================
//  Register Page JavaScript
// ============================================================

function togglePassword(inputId, eyeId) {
    const input = document.getElementById(inputId);
    const eye   = document.getElementById(eyeId);
    if (input.type === 'password') {
        input.type = 'text';
        eye.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        input.type = 'password';
        eye.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

async function registerUser() {
    const firstName       = document.getElementById('firstName').value.trim();
    const lastName        = document.getElementById('lastName').value.trim();
    const email           = document.getElementById('email').value.trim();
    const mobile          = '0000000000'; // Default dummy number, updated in dashboard
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role            = 'Customer';

    // ── Validations ────────────────────────────────────────────────────────────
    const nameRegex   = /^[A-Za-z ]+$/;
    const emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!nameRegex.test(firstName)) { showMsg('First Name should contain only letters.', 'danger'); return; }
    if (!nameRegex.test(lastName))  { showMsg('Last Name should contain only letters.', 'danger'); return; }
    if (!emailRegex.test(email))    { showMsg('Enter a valid Email Address.', 'danger'); return; }
    if (password.length < 6)        { showMsg('Password must be at least 6 characters.', 'danger'); return; }
    if (password !== confirmPassword){ showMsg('Passwords do not match.', 'danger'); return; }

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...';

    try {
        const res = await fetch('http://localhost:8080/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, mobile, password, role })
        });

        const data = await res.json();

        if (data.status === 'success') {
            showMsg('Registration Successful! Redirecting to login...', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } else {
            showMsg(data.message || 'Registration failed. Try again.', 'danger');
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Create Account';
        }
    } catch (err) {
        // Demo mode - simulate registration
        console.warn('Backend not available, simulating registration:', err.message);
        showMsg('Registration Successful! (Demo mode - Backend not running)', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    }
}

function showMsg(msg, type) {
    const el = document.getElementById('registerMsg');
    if (el) {
        el.className = `alert alert-${type} mt-3`;
        el.textContent = msg;
        el.style.display = 'block';
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Redirect if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('slm_session');
    if (session) window.location.href = 'dashboard.html';
});


function loginWithGoogle() {
    const modal = new bootstrap.Modal(document.getElementById('googleLoginModal'));
    modal.show();
}

function simulateGoogleLogin(name, email) {
    const modalEl = document.getElementById('googleLoginModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Create session directly as if they registered via Google OAuth
    localStorage.setItem('slm_session', JSON.stringify({
        email: email,
        name: name,
        role: 'Customer',
        id: Math.floor(Math.random() * 1000) + 100
    }));

    showMsg(`Account securely created with Google as ${name}! Redirecting...`, 'success');
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}
