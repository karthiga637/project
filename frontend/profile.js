const API_BASE = 'http://localhost:8080';
let currentCustomer = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile();
    });
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('slm_session'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('welcomeMsg').innerText = `Welcome back, ${user.name.split(' ')[0]}`;
    document.getElementById('profileAvatar').innerText = user.name.charAt(0).toUpperCase();
}

function logout() {
    localStorage.removeItem('slm_session');
    window.location.href = 'index.html';
}

function loadProfile() {
    const user = JSON.parse(localStorage.getItem('slm_session'));
    const email = user.email; // We know their email. But we need ID.
    
    // The easiest way is to fetch all customers and find by email, since the API doesn't have getByEmail directly.
    fetch(API_BASE + '/customers')
        .then(res => res.json())
        .then(data => {
            currentCustomer = data.find(c => c.email === email);
            if (currentCustomer) {
                populateForm(currentCustomer);
            } else {
                showMessage('error', 'Profile not found.');
            }
        })
        .catch(err => {
            console.error(err);
            showMessage('error', 'Error loading profile.');
        });
}

function populateForm(customer) {
    document.getElementById('firstName').value = customer.firstName || '';
    document.getElementById('lastName').value = customer.lastName || '';
    document.getElementById('email').value = customer.email || '';
    document.getElementById('mobile').value = customer.mobile || '';
    
    // Address may not be returned by getAllCustomers, but let's try. If missing, we should fetch by ID to get full details.
    if (!customer.address) {
        fetch(API_BASE + '/customers?id=' + customer.id)
            .then(res => res.json())
            .then(fullCustomer => {
                currentCustomer = fullCustomer;
                document.getElementById('address').value = fullCustomer.address || '';
                document.getElementById('occupation').value = fullCustomer.occupation || '';
                document.getElementById('income').value = fullCustomer.income || '';
                
                document.getElementById('displayName').innerText = `${fullCustomer.firstName} ${fullCustomer.lastName}`;
                document.getElementById('displayEmail').innerText = fullCustomer.email;
                document.getElementById('largeAvatar').innerText = fullCustomer.firstName.charAt(0).toUpperCase();
            });
    } else {
        document.getElementById('address').value = customer.address || '';
        document.getElementById('occupation').value = customer.occupation || '';
        document.getElementById('income').value = customer.income || '';
        
        document.getElementById('displayName').innerText = `${customer.firstName} ${customer.lastName}`;
        document.getElementById('displayEmail').innerText = customer.email;
        document.getElementById('largeAvatar').innerText = customer.firstName.charAt(0).toUpperCase();
    }
}

function saveProfile() {
    if (!currentCustomer) return;

    const data = {
        id: currentCustomer.id,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        mobile: document.getElementById('mobile').value,
        address: document.getElementById('address').value,
        occupation: document.getElementById('occupation').value,
        income: document.getElementById('income').value
    };

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

    fetch(API_BASE + '/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(resData => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Save Changes';

        if (resData.status === 'success') {
            showMessage('success', 'Profile updated successfully!');
            // Update local storage name if it changed
            const user = JSON.parse(localStorage.getItem('slm_session'));
            user.name = data.firstName + ' ' + data.lastName;
            localStorage.setItem('slm_session', JSON.stringify(user));
            
            checkAuth(); // Refresh top bar name
            document.getElementById('displayName').innerText = `${data.firstName} ${data.lastName}`;
        } else {
            showMessage('error', resData.message || 'Failed to update profile.');
        }
    })
    .catch(err => {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-floppy-fill me-2"></i>Save Changes';
        console.error(err);
        showMessage('error', 'Server error while updating profile.');
    });
}

function showMessage(type, text) {
    const div = document.getElementById('statusMessage');
    if (type === 'success') {
        div.innerHTML = `<div class="alert alert-success alert-dismissible fade show"><i class="bi bi-check-circle-fill me-2"></i>${text}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    } else {
        div.innerHTML = `<div class="alert alert-danger alert-dismissible fade show"><i class="bi bi-exclamation-triangle-fill me-2"></i>${text}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }
}



