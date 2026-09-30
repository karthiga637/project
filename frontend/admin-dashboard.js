document.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('slm_session');
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(session);
    if (user.role !== 'Admin') {
        window.location.href = 'login.html';
        return;
    }

    fetchBanks();
    loadUsers();
    loadLoanRates();
    
    document.getElementById('newBMForm').addEventListener('submit', createBankManager);
});

function logout() {
    localStorage.removeItem('slm_session');
    window.location.href = 'login.html';
}

function showTab(tab) {
    document.getElementById('tab-bm').style.display = 'none';
    document.getElementById('tab-cust').style.display = 'none';
    const tabRates = document.getElementById('tab-rates');
    if (tabRates) tabRates.style.display = 'none';

    document.getElementById('nav-bm').classList.remove('active');
    document.getElementById('nav-cust').classList.remove('active');
    const navRates = document.getElementById('nav-rates');
    if (navRates) navRates.classList.remove('active');

    if (tab === 'bm') {
        document.getElementById('tab-bm').style.display = 'block';
        document.getElementById('nav-bm').classList.add('active');
        document.getElementById('pageTitle').innerText = 'Bank Managers Overview';
    } else if (tab === 'cust') {
        document.getElementById('tab-cust').style.display = 'block';
        document.getElementById('nav-cust').classList.add('active');
        document.getElementById('pageTitle').innerText = 'All Customers Overview';
    } else if (tab === 'rates') {
        if (tabRates) tabRates.style.display = 'block';
        if (navRates) navRates.classList.add('active');
        document.getElementById('pageTitle').innerText = 'Loan Interest Rates Management';
        loadLoanRates();
    }
}

let allBanks = [];

async function fetchBanks() {
    try {
        const res = await fetch('http://127.0.0.1:8080/banks');
        allBanks = await res.json();
        const sel = document.getElementById('bmBankId');
        allBanks.forEach(b => {
            if (b.bank_name.includes('HDFC')) {
                sel.innerHTML += `<option value="${b.id}">${b.bank_name}</option>`;
            }
        });
        const hdfc = allBanks.find(b => b.bank_name === 'HDFC' || b.bank_name.includes('HDFC'));
        if (hdfc) {
            sel.value = hdfc.id;
        }
    } catch(e) {
        console.error("Failed to fetch banks", e);
    }
}

function getBankName(bankId) {
    const b = allBanks.find(x => x.id == bankId);
    if (!b) return 'Main Branch';
    if (b.bank_name === 'HDFC' || b.bank_name.includes('HDFC')) return 'Main Branch';
    return b.bank_name;
}

async function loadUsers() {
    try {
        const res = await fetch('http://127.0.0.1:8080/customers');
        const users = await res.json();
        
        const bms = users.filter(u => u.role === 'BankManager' || (u.role == null && u.bank_id && u.bank_id > 0));
        const custs = users.filter(u => u.role === 'Customer' || u.role === 'customer' || (u.role == null && (!u.bank_id || u.bank_id == 0)));
        
        const elBM = document.getElementById('statBM');
        if (elBM) elBM.textContent = bms.length;
        const elBMH = document.getElementById('statBMHeader');
        if (elBMH) elBMH.textContent = bms.length;

        const elCust = document.getElementById('statCust');
        if (elCust) elCust.textContent = custs.length;
        const elCustH = document.getElementById('statCustHeader');
        if (elCustH) elCustH.textContent = custs.length;
        
        const bmBody = document.getElementById('bmTableBody');
        bmBody.innerHTML = '';
        if(bms.length === 0) {
            bmBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No Bank Managers found.</td></tr>';
        } else {
            bms.forEach(u => {
                bmBody.innerHTML += `
                    <tr>
                        <td class="ps-4">#${u.id}</td>
                        <td class="fw-bold">${u.firstName} ${u.lastName}</td>
                        <td>${u.email}</td>
                        <td>${u.mobile}</td>
                        <td><span class="badge bg-secondary">${u.address ? u.address : 'HDFC Branch'}</span></td>
                        <td class="text-end pe-4">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
        
        const custBody = document.getElementById('custTableBody');
        custBody.innerHTML = '';
        if(custs.length === 0) {
            custBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No Customers found.</td></tr>';
        } else {
            custs.forEach(u => {
                custBody.innerHTML += `
                    <tr>
                        <td class="ps-4">#${u.id}</td>
                        <td class="fw-bold">${u.firstName} ${u.lastName}</td>
                        <td>${u.email}</td>
                        <td>${u.mobile}</td>
                        <td><span class="badge bg-light text-dark border">${u.branch_name ? u.branch_name : (u.bank_id ? getBankName(u.bank_id) : 'Main Branch')}</span></td>
                        <td class="text-end pe-4">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${u.id})" title="Delete Customer"><i class="bi bi-trash"></i></button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) {
        console.error("Failed to load users", e);
    }
}

async function createBankManager(e) {
    e.preventDefault();
    const data = {
        role: 'BankManager',
        firstName: document.getElementById('bmFirstName').value,
        lastName: document.getElementById('bmLastName').value,
        email: document.getElementById('bmEmail').value,
        mobile: document.getElementById('bmMobile').value,
        password: document.getElementById('bmPassword').value,
        bank_id: document.getElementById('bmBankId').value,
        city: document.getElementById('bmCity').value,
        branch: document.getElementById('bmBranch').value
    };
    
    try {
        const res = await fetch('http://127.0.0.1:8080/customers', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const d = await res.json();
        if(d.status === 'success') {
            alert('Bank Manager created successfully!');
            document.getElementById('newBMForm').reset();
            const hdfc = allBanks.find(b => b.bank_name.includes('HDFC'));
            if (hdfc) document.getElementById('bmBankId').value = hdfc.id;
            const modal = bootstrap.Modal.getInstance(document.getElementById('newBMModal'));
            modal.hide();
            loadUsers();
        } else {
            alert('Error creating Bank Manager: ' + (d.message || 'Unknown error'));
        }
    } catch(err) {
        alert('Server error.');
    }
}

async function deleteUser(id) {
    if(!confirm("Are you sure you want to delete this user?")) return;
    try {
        const res = await fetch('http://127.0.0.1:8080/customers?id=' + id, { method: 'DELETE' });
        const data = await res.json();
        if(data.status === 'success') {
            loadUsers();
        } else {
            alert("Error deleting user.");
        }
    } catch(e) {
        alert("Server error.");
    }
}
function toggleBMPassword() {
    const pwd = document.getElementById('bmPassword');
    const eye = document.getElementById('bmEyeIcon');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        eye.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        pwd.type = 'password';
        eye.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

let allProducts = [];

async function loadLoanRates() {
    const tbody = document.getElementById('ratesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading interest rates...</td></tr>';
    try {
        const res = await fetch('http://127.0.0.1:8080/bank-products');
        allProducts = await res.json();
        
        const statProd = document.getElementById('statProducts');
        if (statProd) statProd.textContent = allProducts.length;

        tbody.innerHTML = '';
        if (allProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No loan products found.</td></tr>';
            return;
        }

        allProducts.forEach(p => {
            tbody.innerHTML += `
                <tr style="cursor: pointer;" onclick="selectRateForEdit(${p.id}, '${p.loanType}', ${p.interestRate})" title="Click to edit ${p.loanType}">
                    <td class="ps-4 fw-bold text-dark fs-6 py-3">
                        <i class="bi bi-bank me-2 text-primary"></i>${p.loanType}
                    </td>
                    <td class="py-3">
                        <span class="badge bg-success-subtle text-success fs-6 border border-success-subtle px-3 py-1 fw-bold">
                            ${p.interestRate}%
                        </span>
                    </td>
                    <td class="text-end pe-4 py-3">
                        <button class="btn btn-sm btn-outline-primary fw-bold" onclick="selectRateForEdit(${p.id}, '${p.loanType}', ${p.interestRate})" title="Select ${p.loanType} to update">
                            <i class="bi bi-arrow-right-short fs-5"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch(e) {
        console.error("Failed to load loan rates", e);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error loading interest rates from server.</td></tr>';
    }
}

function enableInlineEdit(id, loanType, currentRate) {
    const rateTd = document.getElementById(`rate-cell-${id}`);
    const actionTd = document.getElementById(`action-cell-${id}`);
    if (!rateTd || !actionTd) return;

    rateTd.innerHTML = `
        <div class="input-group input-group-sm" style="max-width: 140px;">
            <input type="number" step="0.01" min="0" max="100" id="inline-input-${id}" value="${currentRate}" class="form-control fw-bold text-primary">
            <span class="input-group-text fw-bold">%</span>
        </div>
    `;

    actionTd.innerHTML = `
        <button class="btn btn-sm btn-success fw-bold me-1" onclick="saveInlineRate(${id}, '${loanType}')">
            <i class="bi bi-check-lg me-1"></i> Save
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="loadLoanRates()">
            <i class="bi bi-x-lg"></i> Cancel
        </button>
    `;

    const input = document.getElementById(`inline-input-${id}`);
    if (input) {
        input.focus();
        input.select();
    }
}

async function saveInlineRate(id, loanType) {
    const input = document.getElementById(`inline-input-${id}`);
    if (!input) return;
    const rate = parseFloat(input.value);

    if (isNaN(rate) || rate < 0 || rate > 100) {
        alert("Please enter a valid interest rate between 0% and 100%");
        return;
    }

    try {
        const res = await fetch('http://127.0.0.1:8080/bank-products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, loanType: loanType, interestRate: rate })
        });

        const data = await res.json();
        if (data.status === 'success' || res.ok) {
            loadLoanRates();
        } else {
            alert('Error updating interest rate: ' + (data.message || 'Unknown error'));
        }
    } catch(err) {
        alert('Failed to update interest rate. Server error.');
    }
}

function selectRateForEdit(id, loanType, rate) {
    const idEl = document.getElementById('formProductId');
    const typeEl = document.getElementById('formLoanType');
    const rateEl = document.getElementById('formInterestRate');
    if (idEl) idEl.value = id;
    if (typeEl) typeEl.value = loanType;
    if (rateEl) rateEl.value = rate;
    if (typeEl) typeEl.focus();
}

function resetRateForm() {
    const idEl = document.getElementById('formProductId');
    const typeEl = document.getElementById('formLoanType');
    const rateEl = document.getElementById('formInterestRate');
    if (idEl) idEl.value = '';
    if (typeEl) typeEl.value = '';
    if (rateEl) rateEl.value = '';
}

async function saveNewOrUpdatedRate(e) {
    e.preventDefault();
    const id = document.getElementById('formProductId').value;
    const loanType = document.getElementById('formLoanType').value.trim();
    const rate = parseFloat(document.getElementById('formInterestRate').value);

    if (!loanType) {
        alert("Please enter a valid loan name.");
        return;
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
        alert("Please enter a valid interest rate between 0% and 100%");
        return;
    }

    try {
        const payload = { loanType: loanType, interestRate: rate };
        if (id) payload.id = parseInt(id);

        const res = await fetch('http://127.0.0.1:8080/bank-products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.status === 'success' || res.ok) {
            alert(`Loan interest rate for "${loanType}" saved successfully at ${rate}%!`);
            resetRateForm();
            loadLoanRates();
        } else {
            alert('Error saving loan rate: ' + (data.message || 'Unknown error'));
        }
    } catch(err) {
        alert('Server error saving loan rate.');
    }
}
