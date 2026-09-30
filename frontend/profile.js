// ============================================================
//  Customer Profile & AI Recommendation Engine JavaScript
// ============================================================

var API = window.API_BASE || 'http://127.0.0.1:8080';
let currentCustomer = null;

function initProfilePage() {
    renderUserTopBar();
    loadProfile();

    const form = document.getElementById('profileForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            saveProfile();
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfilePage);
} else {
    initProfilePage();
}

function renderUserTopBar() {
    const sessionStr = localStorage.getItem('slm_session');
    if (!sessionStr) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const user = JSON.parse(sessionStr);
        const fullName = user.name || user.email || 'Customer';
        const firstName = fullName.split(' ')[0] || 'Customer';

        const welcomeEl = document.getElementById('welcomeMsg');
        if (welcomeEl) welcomeEl.innerText = `Welcome back, ${firstName}`;

        const avatarEl = document.getElementById('profileAvatar');
        if (avatarEl) avatarEl.innerText = fullName.charAt(0).toUpperCase();

        const dispName = document.getElementById('displayName');
        if (dispName) dispName.innerText = fullName;

        const dispEmail = document.getElementById('displayEmail');
        if (dispEmail) dispEmail.innerText = user.email || '';

        const largeAvatar = document.getElementById('largeAvatar');
        if (largeAvatar) largeAvatar.innerText = fullName.charAt(0).toUpperCase();
    } catch (e) {
        console.error('Error parsing session in top bar:', e);
    }
}

function logout() {
    localStorage.removeItem('slm_session');
    window.location.href = 'index.html';
}

function loadProfile() {
    const sessionStr = localStorage.getItem('slm_session');
    if (!sessionStr) return;
    const user = JSON.parse(sessionStr);
    const userEmail = (user.email || '').trim().toLowerCase();
    const userId = user.id ? parseInt(user.id) : 0;

    // 1. Instant 0ms Local Population
    currentCustomer = {
        id: user.id || 0,
        firstName: user.firstName || (user.name || '').split(' ')[0] || '',
        lastName: user.lastName || (user.name || '').split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        mobile: user.mobile || '',
        address: user.address || '',
        occupation: user.occupation || 'Salaried Professional',
        income: user.income || '',
        financialGoal: user.financialGoal || 'General'
    };

    let mappedLoans = JSON.parse(localStorage.getItem('slm_customer_loans') || '[]');
    let custLoan = mappedLoans.find(l => l.email && l.email.trim().toLowerCase() === userEmail);
    if (custLoan) {
        if (!currentCustomer.firstName && custLoan.name) {
            let parts = custLoan.name.trim().split(' ');
            currentCustomer.firstName = parts[0] || '';
            currentCustomer.lastName = parts.slice(1).join(' ') || '';
        }
        if (!currentCustomer.mobile && custLoan.mobile) currentCustomer.mobile = custLoan.mobile;
    }

    populateForm(currentCustomer);

    // 2. Background Refresh with 2s Timeout
    let fetchOpts = {};
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
        fetchOpts.signal = AbortSignal.timeout(2000);
    }

    fetch(API + '/customers', fetchOpts)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                let dbCust = data.find(c => {
                    const cEmail = (c.email || '').trim().toLowerCase();
                    const cId = c.id ? parseInt(c.id) : 0;
                    return (userId && cId === userId) || (cEmail && cEmail === userEmail);
                });
                if (dbCust) {
                    currentCustomer = dbCust;
                    populateForm(currentCustomer);
                }
            }
        })
        .catch(err => {
            console.warn('Background profile fetch skipped or timed out:', err);
        });
}

function populateForm(customer) {
    if (!customer) return;
    
    const fnInput = document.getElementById('firstName');
    if (fnInput) fnInput.value = customer.firstName || '';

    const lnInput = document.getElementById('lastName');
    if (lnInput) lnInput.value = customer.lastName || '';

    const emInput = document.getElementById('email');
    if (emInput) emInput.value = customer.email || '';

    const mobInput = document.getElementById('mobile');
    if (mobInput) mobInput.value = customer.mobile || '';

    const adrInput = document.getElementById('address');
    if (adrInput) adrInput.value = customer.address || '';

    const occInput = document.getElementById('occupation');
    if (occInput) {
        if (customer.occupation) {
            let matched = false;
            for (let i = 0; i < occInput.options.length; i++) {
                if (occInput.options[i].value.toLowerCase() === customer.occupation.toLowerCase()) {
                    occInput.selectedIndex = i;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                occInput.value = customer.occupation;
            }
        }
    }

    const incInput = document.getElementById('income');
    if (incInput) {
        const val = customer.income !== undefined && customer.income !== null ? customer.income : '';
        incInput.value = val;
    }

    const goalInput = document.getElementById('financialGoal');
    if (goalInput && customer.financialGoal) {
        goalInput.value = customer.financialGoal;
    }

    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Customer Profile';

    const dispName = document.getElementById('displayName');
    if (dispName) dispName.innerText = fullName;

    const dispEmail = document.getElementById('displayEmail');
    if (dispEmail) dispEmail.innerText = customer.email || '';

    const initial = (customer.firstName || customer.email || 'C').charAt(0).toUpperCase();

    const largeAvatar = document.getElementById('largeAvatar');
    if (largeAvatar) largeAvatar.innerText = initial;

    const welcomeEl = document.getElementById('welcomeMsg');
    if (welcomeEl) welcomeEl.innerText = `Welcome back, ${customer.firstName || fullName.split(' ')[0]}`;

    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.innerText = initial;

    // Trigger AI Loan Recommendation on initial load
    renderRecommendation();
}

function onProfileFinancialsChange() {
    renderRecommendation();
}

// ── AI Loan Recommendation Engine ───────────────────────────────────────────
function renderRecommendation() {
    const incomeInput = document.getElementById('income');
    const occInput = document.getElementById('occupation');
    const goalInput = document.getElementById('financialGoal');

    const income = parseFloat(incomeInput ? incomeInput.value : 0) || 0;
    const occupation = occInput ? occInput.value : 'Salaried Professional';
    const goal = goalInput ? goalInput.value : 'General';

    // 1. Client-Side High Performance Recommendation Logic
    let product = 'Personal Loan';
    let rate = 12.5;
    let maxAmount = Math.max(income * 12, 100000);
    let tenure = 'Up to 36 Months';
    let matchBadge = '92% Match (Instant Disbursal)';
    let rationale = 'Zero-collateral multipurpose financing with rapid digital verification and 24-hour fund disbursal.';
    let alt = 'Gold Loan @ 7.5% or Two-Wheeler Loan @ 11.0%';

    if (goal === 'Home' || income > 100000) {
        product = 'Home Loan';
        rate = 8.5;
        maxAmount = Math.max(income * 60, 2500000);
        tenure = 'Up to 240 Months';
        matchBadge = '98% Match (Top Recommendation)';
        rationale = 'High-income stability qualifies for prime residential property loans with long tenure and maximum tax benefits.';
        alt = 'Car Loan @ 9.0% or Personal Loan @ 12.5%';
    } else if (occupation === 'Student' || goal === 'Education') {
        product = 'Education Loan';
        rate = 9.5;
        maxAmount = Math.max(500000, income * 30);
        tenure = 'Up to 60 Months';
        matchBadge = '96% Match (Student Priority)';
        rationale = 'Subsidized interest rate with flexible repayment moratorium until course completion.';
        alt = 'Personal Loan @ 12.5%';
    } else if (occupation === 'Business Owner' || goal === 'Business' || income > 75000) {
        product = 'Business Loan';
        rate = 12.0;
        maxAmount = Math.max(income * 24, 1000000);
        tenure = 'Up to 48 Months';
        matchBadge = '95% Match (Working Capital)';
        rationale = 'Designed for working capital, business expansion, and equipment financing with minimal collateral requirements.';
        alt = 'Gold Loan @ 7.5% or Personal Loan @ 12.5%';
    } else if (goal === 'Vehicle' || (income >= 30000 && income <= 75000)) {
        product = 'Car / Vehicle Loan';
        rate = 9.0;
        maxAmount = Math.max(income * 18, 500000);
        tenure = 'Up to 84 Months';
        matchBadge = '94% Match (Auto Finance)';
        rationale = 'Competitive fixed rates for new or certified pre-owned vehicles with flexible 3 to 7 year repayment terms.';
        alt = 'Two-Wheeler Loan @ 11.0% or Personal Loan @ 12.5%';
    }

    // Update DOM Elements
    const titleEl = document.getElementById('recProductTitle');
    const badgeEl = document.getElementById('recMatchBadge');
    const rateEl = document.getElementById('recRateBadge');
    const tenureEl = document.getElementById('recTenureBadge');
    const maxAmtEl = document.getElementById('recMaxAmount');
    const ratEl = document.getElementById('recRationale');
    const altEl = document.getElementById('recAlternative');

    if (titleEl) titleEl.textContent = product;
    if (badgeEl) badgeEl.innerHTML = `<i class="bi bi-patch-check-fill me-1"></i>${matchBadge}`;
    if (rateEl) rateEl.innerHTML = `<i class="bi bi-percent me-1"></i>${rate}% p.a.`;
    if (tenureEl) tenureEl.innerHTML = `<i class="bi bi-calendar3 me-1"></i>${tenure}`;
    if (maxAmtEl) maxAmtEl.textContent = '₹' + Number(Math.round(maxAmount)).toLocaleString('en-IN');
    if (ratEl) ratEl.textContent = rationale;
    if (altEl) altEl.textContent = alt;

    // 2. Asynchronously sync with Backend Recommendation API
    fetch(`${API}/ai-insights?action=recommend&income=${income}&occupation=${encodeURIComponent(occupation)}&goal=${encodeURIComponent(goal)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.status === 'success' && data.product) {
                if (titleEl) titleEl.textContent = data.product;
                if (rateEl) rateEl.innerHTML = `<i class="bi bi-percent me-1"></i>${data.interestRate}% p.a.`;
                if (maxAmtEl) maxAmtEl.textContent = '₹' + Number(Math.round(data.maxEligibleAmount)).toLocaleString('en-IN');
                if (ratEl && data.rationale) ratEl.textContent = data.rationale;
                if (altEl && data.alternative) altEl.textContent = data.alternative;
                if (badgeEl && data.matchBadge) badgeEl.innerHTML = `<i class="bi bi-patch-check-fill me-1"></i>${data.matchBadge}`;
            }
        })
        .catch(err => {
            console.debug('Using client-side recommendation engine:', err);
        });
}

function saveProfile() {
    if (!currentCustomer) return;

    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    const mob = document.getElementById('mobile').value.trim();
    if (mob.length !== 10) {
        alert("Mobile number must be exactly 10 digits.");
        return;
    }
    const adr = document.getElementById('address').value.trim();
    const occ = document.getElementById('occupation').value.trim();
    const inc = document.getElementById('income').value.trim();
    const goal = document.getElementById('financialGoal')?.value || 'General';

    const data = {
        id: currentCustomer.id || 0,
        firstName: fn,
        lastName: ln,
        mobile: mob,
        address: adr,
        occupation: occ,
        income: inc,
        financialGoal: goal
    };

    const btn = document.getElementById('saveBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    }

    fetch(API + '/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(resData => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Save Changes';
        }

        if (resData.status === 'success') {
            showMessage('success', 'Profile and personal details updated successfully!');
            // Update local storage session
            const userStr = localStorage.getItem('slm_session');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.name = `${fn} ${ln}`.trim();
                user.mobile = mob;
                user.address = adr;
                user.occupation = occ;
                user.income = inc;
                user.financialGoal = goal;
                localStorage.setItem('slm_session', JSON.stringify(user));
            }
            
            renderUserTopBar();
            const fullName = `${fn} ${ln}`.trim();
            const dispName = document.getElementById('displayName');
            if (dispName) dispName.innerText = fullName;
            renderRecommendation();
        } else {
            showMessage('error', resData.message || 'Failed to update profile.');
        }
    })
    .catch(err => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Save Changes';
        }
        console.warn('API error, saving profile locally:', err);
        
        // Save locally to session
        const userStr = localStorage.getItem('slm_session');
        if (userStr) {
            const user = JSON.parse(userStr);
            user.name = `${fn} ${ln}`.trim();
            user.mobile = mob;
            user.address = adr;
            user.occupation = occ;
            user.income = inc;
            user.financialGoal = goal;
            localStorage.setItem('slm_session', JSON.stringify(user));
        }
        
        renderUserTopBar();
        const fullName = `${fn} ${ln}`.trim();
        const dispName = document.getElementById('displayName');
        if (dispName) dispName.innerText = fullName;
        
        showMessage('success', 'Profile and personal details updated successfully!');
        renderRecommendation();
    });
}

function showMessage(type, text) {
    const div = document.getElementById('statusMessage');
    if (!div) return;
    if (type === 'success') {
        div.innerHTML = `<div class="alert alert-success alert-dismissible fade show"><i class="bi bi-check-circle-fill me-2"></i>${text}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    } else {
        div.innerHTML = `<div class="alert alert-danger alert-dismissible fade show"><i class="bi bi-exclamation-triangle-fill me-2"></i>${text}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }
}
