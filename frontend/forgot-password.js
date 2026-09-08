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

let verifiedEmail = "";
let verifiedMobile = "";

// Step 1: Verify Identity
function verifyIdentity() {
    const email = document.getElementById("email").value;
    const mobile = document.getElementById("mobile").value;
    const msg = document.getElementById("verifyMsg");
    const btn = document.getElementById("verifyBtn");

    if (!email || !mobile) {
        msg.className = "alert alert-warning mt-3";
        msg.innerHTML = "Please enter both Email and Mobile Number.";
        msg.style.display = "block";
        return;
    }

    msg.style.display = "none";
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...`;
    btn.disabled = true;

    // Call the backend to verify
    fetch("http://localhost:8080/reset-password?action=verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, mobile: mobile })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            // Verification successful
            verifiedEmail = email;
            verifiedMobile = mobile;
            
            // Hide verify form, show reset form
            document.getElementById("verifyForm").style.display = "none";
            document.getElementById("resetForm").style.display = "block";
            document.getElementById("page-subtitle").innerText = "Enter your new password below";
            
        } else {
            msg.className = "alert alert-danger mt-3";
            msg.innerHTML = data.message || "Invalid Email or Mobile Number.";
            msg.style.display = "block";
            btn.innerHTML = `<i class="bi bi-person-check"></i> Verify Identity`;
            btn.disabled = false;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.className = "alert alert-danger mt-3";
        msg.innerHTML = "Server error. Please make sure the backend is running.";
        msg.style.display = "block";
        btn.innerHTML = `<i class="bi bi-person-check"></i> Verify Identity`;
        btn.disabled = false;
    });
}

// Step 2: Reset Password
function resetPassword() {
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
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...`;
    btn.disabled = true;

    // Call backend to update password
    fetch("http://localhost:8080/reset-password?action=reset", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            email: verifiedEmail, 
            mobile: verifiedMobile, 
            newPassword: newPassword 
        })
    })
    .then(response => response.json())
    .then(data => {
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
            msg.innerHTML = data.message || "Failed to update password.";
            msg.style.display = "block";
            btn.innerHTML = `<i class="bi bi-key"></i> Update Password`;
            btn.disabled = false;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        msg.className = "alert alert-danger mt-3";
        msg.innerHTML = "Server error. Please try again later.";
        msg.style.display = "block";
        btn.innerHTML = `<i class="bi bi-key"></i> Update Password`;
        btn.disabled = false;
    });
}
