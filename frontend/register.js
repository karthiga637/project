let otpModalObj = null;
let pendingRegisterData = null;

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

function showMsg(msg, type) {
    const el = document.getElementById('registerMsg');
    el.className = `alert alert-${type} mt-3 mb-3`;
    el.textContent = msg;
    el.style.display = 'block';
}

async function registerUser() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!firstName || !lastName || !email || !mobile || !password || !confirmPassword) {
        showMsg("Please fill all fields.", "warning");
        return;
    }
    
    if (mobile.length !== 10) {
        showMsg("Mobile number must be exactly 10 digits.", "warning");
        return;
    }
    
    if (password !== confirmPassword) {
        showMsg("Passwords do not match.", "danger");
        return;
    }
    
    const btn = document.getElementById('registerBtn');
    const originalBtnHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending OTP...';
    
    // Step 1: Send OTP. The backend will block it if email is already registered.
    try {
        const res = await fetch('http://127.0.0.1:8080/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
        
        if (data.status === 'success') {
            pendingRegisterData = { firstName, lastName, email, mobile, password, role: 'Customer' };
            if (!otpModalObj) otpModalObj = new bootstrap.Modal(document.getElementById('otpModal'));
            document.getElementById('otpMsg').style.display = 'none';
            document.querySelectorAll('.otp-input').forEach(i => i.value = '');
            otpModalObj.show();
            setTimeout(() => document.getElementById('otp1').focus(), 500);
        } else {
            // This will show "Email already registered" if the backend caught it.
            showMsg(data.message || 'Registration failed', 'danger');
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
        showMsg('Server connection failed.', 'danger');
    }
}

async function verifyOTPAndRegister() {
    if (!pendingRegisterData) return;
    
    const otp = document.getElementById('otp1').value + 
                document.getElementById('otp2').value + 
                document.getElementById('otp3').value + 
                document.getElementById('otp4').value;
                
    if (otp.length < 4) return;
    
    const msgDiv = document.getElementById('otpMsg');
    msgDiv.style.display = 'none';
    
    // Inject OTP into the registration payload
    pendingRegisterData.otp = otp;
    
    try {
        const res = await fetch('http://127.0.0.1:8080/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(pendingRegisterData)
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            otpModalObj.hide();
            showMsg("Registration successful! You can now login.", "success");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            msgDiv.innerText = data.message || "Registration failed";
            msgDiv.style.display = 'block';
        }
    } catch(err) {
        msgDiv.innerText = "Server error.";
        msgDiv.style.display = 'block';
    }
}

async function resendOTP() {
    if (!pendingRegisterData) return;
    const email = pendingRegisterData.email;
    const msgDiv = document.getElementById('otpMsg');
    msgDiv.className = 'alert alert-info';
    msgDiv.innerText = 'Resending OTP...';
    msgDiv.style.display = 'block';
    
    try {
        const res = await fetch('http://127.0.0.1:8080/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.status === 'success') {
            msgDiv.className = 'alert alert-success';
            msgDiv.innerText = 'OTP Resent Successfully!';
        } else {
            msgDiv.className = 'alert alert-danger';
            msgDiv.innerText = data.message || 'Failed to resend OTP';
        }
    } catch (err) {
        msgDiv.className = 'alert alert-danger';
        msgDiv.innerText = 'Server connection failed.';
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


async function handleGoogleLogin(response) {
    try {
        const responsePayload = JSON.parse(atob(response.credential.split('.')[1]));
        const email = responsePayload.email;
        const name = responsePayload.name;
        
        showMsg('Verifying Google account for ' + name + '...', 'info');
        
        const res = await fetch('http://127.0.0.1:8080/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
            showMsg('Successfully registered with Google! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMsg(data.message || 'Google registration failed', 'danger');
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        showMsg('An error occurred during Google registration', 'danger');
    }
}
