let otpModalObj = null;
let verifiedEmail = "";
let validatedOtp = "";

// Toggle password visibility
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("bi-eye");
        icon.classList.add("bi-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("bi-eye-slash");
        icon.classList.add("bi-eye");
    }
}

// Step 1: Send OTP to verify identity
async function sendResetOTP() {
    const email = document.getElementById("email").value.trim();
    const msg = document.getElementById("verifyMsg");
    const btn = document.getElementById("verifyBtn");

    if (!email) {
        msg.className = "alert alert-warning mt-3";
        msg.innerHTML = "Please enter your Email Address.";
        msg.style.display = "block";
        return;
    }

    msg.style.display = "none";
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending OTP...`;
    btn.disabled = true;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Send OTP with type "forgot" so the backend knows to check if email EXISTS
        const res = await fetch("http://127.0.0.1:8080/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, type: "forgot" }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        
        if (data.status === "success") {
            verifiedEmail = email; // Temporarily store it
            
            if (!otpModalObj) otpModalObj = new bootstrap.Modal(document.getElementById('otpModal'));
            document.getElementById('otpMsg').style.display = 'none';
            document.querySelectorAll('.otp-input').forEach(i => i.value = '');
            otpModalObj.show();
            setTimeout(() => document.getElementById('otp1').focus(), 500);
            
        } else {
            msg.className = "alert alert-danger mt-3";
            msg.innerHTML = data.message || "Failed to send OTP.";
            msg.style.display = "block";
        }
    } catch (error) {
        msg.className = "alert alert-danger mt-3";
        msg.innerHTML = "Server error. Please make sure the backend is running.";
        msg.style.display = "block";
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

// Step 2: Verify OTP
function verifyOTPAndShowReset() {
    const otp = document.getElementById('otp1').value + 
                document.getElementById('otp2').value + 
                document.getElementById('otp3').value + 
                document.getElementById('otp4').value;
                
    if (otp.length < 4) return;
    
    // For Reset Password, we will pass the OTP directly to the reset-password API along with the new password
    // So we just close the modal and show the reset form. We don't need a separate verify call here!
    // But we need to save the OTP to send it with the new password.
    validatedOtp = otp;
    
    otpModalObj.hide();
    
    // Hide verify form, show reset form
    document.getElementById("verifyForm").style.display = "none";
    document.getElementById("resetForm").style.display = "block";
    document.getElementById("page-subtitle").innerText = "Enter your new password below";
}

// Step 3: Reset Password
async function resetPassword() {
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const msg = document.getElementById("resetMsg");
    const btn = document.getElementById("resetBtn");

    if (!newPassword || !confirmPassword) {
        msg.className = "alert alert-warning mt-3";
        msg.innerHTML = "Please fill in all fields.";
        msg.style.display = "block";
        return;
    }
    
    if (newPassword !== confirmPassword) {
        msg.className = "alert alert-danger mt-3";
        msg.innerHTML = "Passwords do not match.";
        msg.style.display = "block";
        return;
    }

    if (newPassword.length < 6) {
        msg.className = "alert alert-warning mt-3";
        msg.innerHTML = "Password must be at least 6 characters long.";
        msg.style.display = "block";
        return;
    }

    msg.style.display = "none";
    const originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...`;
    btn.disabled = true;

    try {
        const res = await fetch("http://127.0.0.1:8080/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: verifiedEmail, 
                otp: validatedOtp, 
                newPassword: newPassword 
            })
        });
        
        const data = await res.json();
        
        if (data.status === "success") {
            msg.className = "alert alert-success mt-3";
            msg.innerHTML = "Password reset successful! Redirecting to login...";
            msg.style.display = "block";
            btn.innerHTML = `<i class="bi bi-check-circle"></i> Password Updated`;
            
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
            
        } else {
            msg.className = "alert alert-danger mt-3";
            msg.innerHTML = data.message || "Invalid OTP or failed to update password.";
            msg.style.display = "block";
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    } catch (error) {
        msg.className = "alert alert-danger mt-3";
        msg.innerHTML = "Server error. Please try again later.";
        msg.style.display = "block";
        btn.innerHTML = originalHtml;
        btn.disabled = false;
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
