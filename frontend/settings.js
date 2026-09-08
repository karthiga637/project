// ============================================================
//  Settings Page JavaScript
// ============================================================

const API = 'http://localhost:8080';

// ── Helpers ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    alert(`${type.toUpperCase()}: ${message}`);
}

// ── Profile Updates ────────────────────────────────────────────────────────────
function updateProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profileName')?.value;
    const email = document.getElementById('profileEmail')?.value;
    
    if (!name || !email) {
        showToast('Name and Email are required.', 'error');
        return;
    }

    // Update local session
    const session = JSON.parse(localStorage.getItem('slm_session')) || {};
    session.name = name;
    session.email = email;
    localStorage.setItem('slm_session', JSON.stringify(session));

    // Update UI
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = name;

    showToast('Profile updated successfully!');
}

// ── Password Reset ─────────────────────────────────────────────────────────────
function updatePassword(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword')?.value;
    const newPass = document.getElementById('newPassword')?.value;
    const confirm = document.getElementById('confirmPassword')?.value;

    if (!current || !newPass || !confirm) {
        showToast('All password fields are required.', 'error');
        return;
    }

    if (newPass !== confirm) {
        showToast('New password and confirm password do not match.', 'error');
        return;
    }

    showToast('Password updated successfully!');
    e.target.reset();
}

// ── Application Settings ───────────────────────────────────────────────────────
function updateAppSettings(e) {
    e.preventDefault();
    const currency = document.getElementById('currencyFormat')?.value;
    const theme = document.getElementById('themePreference')?.value;
    const notifications = document.getElementById('enableNotifications')?.checked;

    const settings = { currency, theme, notifications };
    localStorage.setItem('slm_settings', JSON.stringify(settings));

    showToast('Application settings saved!');
}

// ── Init ───────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('slm_session')) { window.location.href = 'login.html'; return; }
    
    // Bind event listeners
    document.getElementById('profileForm')?.addEventListener('submit', updateProfile);
    document.getElementById('passwordForm')?.addEventListener('submit', updatePassword);
    document.getElementById('appSettingsForm')?.addEventListener('submit', updateAppSettings);

    // Populate current info
    const session = JSON.parse(localStorage.getItem('slm_session'));
    const nameEl = document.getElementById('user-name');
    if (nameEl) nameEl.textContent = session.name || session.email;
    
    const profName = document.getElementById('profileName');
    const profEmail = document.getElementById('profileEmail');
    if (profName) profName.value = session.name || '';
    if (profEmail) profEmail.value = session.email || '';

    // Populate settings
    const settings = JSON.parse(localStorage.getItem('slm_settings')) || { currency: 'INR', theme: 'light', notifications: true };
    const currSelect = document.getElementById('currencyFormat');
    const themeSelect = document.getElementById('themePreference');
    const notifCheck = document.getElementById('enableNotifications');
    
    if (currSelect) currSelect.value = settings.currency;
    if (themeSelect) themeSelect.value = settings.theme;
    if (notifCheck) notifCheck.checked = settings.notifications;
});
