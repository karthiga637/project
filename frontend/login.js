
let pendingLoginData = null;
let otpModalObj = null;

async function login(roleAttempt) {
    let rolePrefix = 'cust';
    if (roleAttempt === 'Admin') rolePrefix = 'admin';
    else if (roleAttempt === 'BankManager') rolePrefix = 'bm';
    const email    = document.getElementById('email_' + rolePrefix).value.trim();
    const password = document.getElementById('password_' + rolePrefix).value;
    const btn      = document.getElementById('loginBtn_' + rolePrefix);

    if (!email || !password) {
        showMsg('Please fill in all fields.', 'danger', rolePrefix);
        return;
    }

    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';

    if (roleAttempt === 'Admin' || roleAttempt === 'BankManager') {
        try {
            const res = await fetch('http://localhost:8080/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password, otp: '', role: roleAttempt })
            });
            const data = await res.json();
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;

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
                    mobile: data.mobile
                }));
                showMsg('Login successful! Redirecting...', 'success', rolePrefix);
                setTimeout(() => {
                    
if (data && data.role === 'BankManager') {
    window.location.href = 'bank-manager-dashboard.html';
} else if (typeof data === 'undefined' && typeof session !== 'undefined') {
    let s = JSON.parse(session);
    if (s.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
} else {
    window.location.href = 'dashboard.html';
}

                }, 800);
            } else {
                showMsg(data.message || 'Invalid email or password', 'danger', rolePrefix);
            }
        } catch(err) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
            showMsg('Server connection failed.', 'danger', rolePrefix);
        }
        return;
    }

    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending OTP...';

    try {
        const res = await fetch('http://localhost:8080/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;

        if (data.status === 'success') {
            pendingLoginData = { email, password, roleAttempt, rolePrefix };
            if(!otpModalObj) otpModalObj = new bootstrap.Modal(document.getElementById('otpModal'));
            document.getElementById('otpMsg').style.display = 'none';
            document.querySelectorAll('.otp-input').forEach(i => i.value = '');
            otpModalObj.show();
            setTimeout(() => document.getElementById('otp1').focus(), 500);
        } else {
            showMsg(data.message || 'Failed to send OTP', 'danger', rolePrefix);
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
        showMsg('Server connection failed.', 'danger', rolePrefix);
    }
}

async function verifyAndLogin() {
    if (!pendingLoginData) return;
    
    const otp = document.getElementById('otp1').value + 
                document.getElementById('otp2').value + 
                document.getElementById('otp3').value + 
                document.getElementById('otp4').value;
                
    if (otp.length < 4) return;
    
    const msgDiv = document.getElementById('otpMsg');
    msgDiv.style.display = 'none';
    
    const { email, password, roleAttempt, rolePrefix } = pendingLoginData;
    
    try {
        const res = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password, otp })
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            if (data.role !== roleAttempt) {
                msgDiv.innerText = 'Access denied. Invalid portal for your account type.';
                msgDiv.style.display = 'block';
                return;
            }
            
            otpModalObj.hide();
            localStorage.setItem('slm_session', JSON.stringify({
                email: data.email,
                name: data.name,
                role: data.role,
                id: data.id,
                mobile: data.mobile
            }));
            
            showMsg('Login successful! Redirecting...', 'success', rolePrefix);
            setTimeout(() => {
                
if (data && data.role === 'BankManager') {
    window.location.href = 'bank-manager-dashboard.html';
} else if (typeof data === 'undefined' && typeof session !== 'undefined') {
    let s = JSON.parse(session);
    if (s.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
} else {
    window.location.href = 'dashboard.html';
}

            }, 800);
        } else {
            msgDiv.innerText = data.message || "Invalid OTP or Password";
            msgDiv.style.display = 'block';
        }
    } catch(err) {
        msgDiv.innerText = "Server error.";
        msgDiv.style.display = 'block';
    }
}

// Auto-advance OTP inputs
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
        input.addEventListener('keyup', function(e) {
            if (this.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            if (e.key === 'Backspace' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});


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
        el.className = `alert alert-${type} mt-3`;
        el.textContent = msg;
        el.style.display = 'block';
    }
}

// Auto-redirect if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('slm_session');
    if (session) {
        
if (data && data.role === 'BankManager') {
    window.location.href = 'bank-manager-dashboard.html';
} else if (typeof data === 'undefined' && typeof session !== 'undefined') {
    let s = JSON.parse(session);
    if (s.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
} else {
    window.location.href = 'dashboard.html';
}

    }

    // Allow Enter key to submit
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            login(currentRoleTab);
        }
    });
});


async function handleGoogleLogin(response) {
    try {
        // Decode JWT to get email and name
        const responsePayload = JSON.parse(atob(response.credential.split('.')[1]));
        const email = responsePayload.email;
        const name = responsePayload.name;
        
        showMsg(`Verifying Google account for ${name}...`, 'info', 'cust');
        
        const res = await fetch('http://localhost:8080/google-login', {
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
                
if (data && data.role === 'BankManager') {
    window.location.href = 'bank-manager-dashboard.html';
} else if (typeof data === 'undefined' && typeof session !== 'undefined') {
    let s = JSON.parse(session);
    if (s.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
} else {
    window.location.href = 'dashboard.html';
}

            }, 800);
        } else {
            showMsg('Error logging in with Google.', 'danger', 'cust');
        }
    } catch (err) {
        showMsg('Server connection failed.', 'danger', 'cust');
    }
}

