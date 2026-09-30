// ============================================================
//  Login Page JavaScript
// ============================================================
let currentRoleTab = 'Customer';

function setLoginRole(role) {
    currentRoleTab = role;
    const registerLink = document.getElementById('registerLinkContainer');
    if (registerLink) {
        if (role === 'Customer') {
            registerLink.style.display = 'block';
        } else {
            registerLink.style.display = 'none';
        }
    }
}

function togglePassword(inputId, iconId) {
    const pwd = document.getElementById(inputId);
    const eye = document.getElementById(iconId);
    if (pwd.type === 'password') {
        pwd.type = 'text';
        eye.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        pwd.type = 'password';
        eye.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

function showMsg(msg, type, rolePrefix) {
    const elId = 'loginMsg_' + (rolePrefix ? rolePrefix : 'cust');
    const el = document.getElementById(elId);
    if (el) {
        el.className = 'alert alert-' + type + ' mt-3';
        el.textContent = msg;
        el.style.display = 'block';
    }
}

function checkLoginState() {
    const sessionStr = localStorage.getItem('slm_session');
    if (sessionStr) {
        try {
            const s = JSON.parse(sessionStr);
            if (s && s.role) {
                if (s.role === 'Admin') {
                    window.location.replace('admin-dashboard.html');
                } else if (s.role === 'BankManager') {
                    window.location.replace('bank-manager-dashboard.html');
                } else {
                    window.location.replace('customer.html');
                }
            }
        } catch(e) {
            localStorage.removeItem('slm_session');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    checkLoginState();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            login(currentRoleTab);
        }
    });
});

window.addEventListener('pageshow', () => {
    checkLoginState();
});

async function login(roleAttempt) {
    let emailId, passId, rolePrefix;
    
    if (roleAttempt === 'Admin') {
        emailId = 'email_admin';
        passId = 'password_admin';
        rolePrefix = 'admin';
    } else if (roleAttempt === 'BankManager') {
        emailId = 'email_bm';
        passId = 'password_bm';
        rolePrefix = 'bm';
    } else {
        emailId = 'email_cust';
        passId = 'password_cust';
        rolePrefix = 'cust';
    }
    
    const email = document.getElementById(emailId).value.trim();
    const password = document.getElementById(passId).value;
    
    if (!email || !password) {
        showMsg('Please fill in all fields.', 'warning', rolePrefix);
        return;
    }
    
    if (roleAttempt === 'Admin') {
        if (email === 'smartloanmanagement@gmail.com' && password === 'smartloan') {
            localStorage.setItem('slm_session', JSON.stringify({
                email: email,
                name: 'System Administrator',
                role: 'Admin',
                id: 0
            }));
            showMsg('Login successful! Redirecting...', 'success', 'admin');
            setTimeout(() => {
                window.location.replace('admin-dashboard.html');
            }, 500);
        } else {
            showMsg('Invalid admin credentials.', 'danger', 'admin');
        }
        return;
    }

    let btn = document.getElementById('loginBtn_' + rolePrefix);
    if (!btn) btn = document.getElementById('loginBtn_bm'); 
    
    let originalBtnHtml = '';
    if (btn) {
        originalBtnHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
    }
    
    try {
        const res = await fetch('http://127.0.0.1:8080/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
        
        if (data.status === 'success') {
            if (data.role !== roleAttempt) {
                showMsg('Access denied. Invalid portal for your account type.', 'danger', rolePrefix);
                return;
            }
            
            localStorage.setItem('slm_session', JSON.stringify({
                email: data.email,
                name: data.name,
                role: data.role,
                id: data.id,
                mobile: data.mobile,
                bank_id: data.bank_id,
                address: data.address || '',
                branch_name: data.branch_name || ''
            }));
            
            showMsg('Login successful! Redirecting...', 'success', rolePrefix);
            setTimeout(() => {
                if (data.role === 'BankManager') {
                    window.location.replace('bank-manager-dashboard.html');
                } else {
                    window.location.replace('customer.html');
                }
            }, 500);
        } else {
            showMsg(data.message || "Invalid email or password", 'danger', rolePrefix);
        }
    } catch(err) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
        showMsg("Server error.", 'danger', rolePrefix);
    }
}

async function handleGoogleLogin(response) {
    try {
        const responsePayload = JSON.parse(atob(response.credential.split('.')[1]));
        const email = responsePayload.email;
        const name = responsePayload.name;
        
        showMsg('Verifying Google account for ' + name + '...', 'info', 'cust');
        
        const res = await fetch('http://127.0.0.1:8080/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            localStorage.setItem('slm_session', JSON.stringify({
                email: data.email,
                name: data.name,
                role: data.role,
                id: data.id,
                mobile: data.mobile
            }));
            showMsg('Google Login successful! Redirecting...', 'success', 'cust');
            setTimeout(() => {
                if (data.role === 'BankManager') {
                    window.location.replace('bank-manager-dashboard.html');
                } else {
                    window.location.replace('customer.html');
                }
            }, 500);
        } else {
            showMsg(data.message || 'Error logging in with Google.', 'danger', 'cust');
        }
    } catch (err) {
        showMsg('Server connection failed.', 'danger', 'cust');
    }
}
