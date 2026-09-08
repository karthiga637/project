const API = 'http://localhost:8080';
let session = null;
let userLoans = [];
let nextEmiGlobal = null;
let totalOutstandingGlobal = 0;

// -- Helpers --------------------------------------------------------------------
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function badge(s) {
    const m = { 'Active':'success','Completed':'primary','Overdue':'danger','Pending':'warning','Paid':'success' };
    return `<span class="badge bg-${m[s]||'secondary'}">${s}</span>`;
}
function formatDate(dStr) {
    if(!dStr) return '-';
    return new Date(dStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric'});
}

// -- Initialization -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const s = localStorage.getItem('slm_session');
    if (!s) {
        window.location.href = 'login.html';
        return;
    }
    session = JSON.parse(s);
    
    // Set Profile UI
    const name = session.name || session.email || 'User';
    document.getElementById('welcomeMsg').textContent = "Welcome back, " + name;
    document.getElementById('profileAvatar').textContent = name.charAt(0).toUpperCase();

    // Hide admin-only elements for Customers
    if (session.role === 'Customer') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    if (session.role === 'Admin') {
        loadAdminData();
    } else {
        loadCustomerData();
    }
});

function logout() {
    localStorage.removeItem('slm_session');
    window.location.href = 'index.html';
}

// -- Load Admin Data ------------------------------------------------------------
async function loadAdminData() {
    try {
        const res = await fetch(API + '/customers?action=stats');
        const stats = await res.json();
        
        document.getElementById('activeLoansCount').textContent = stats.activeLoans || 0;
        document.getElementById('totalOutstanding').textContent = fmt(stats.totalLoanAmount || 0);
        document.querySelector('.dashboard .col-md-3:nth-child(1) h6').textContent = 'Active Bank Loans';
        document.querySelector('.dashboard .col-md-3:nth-child(2) h6').textContent = 'Total Capital Disbursed';
        
        const nextEmiH6 = document.querySelector('.dashboard .col-md-3:nth-child(3) h6');
        if (nextEmiH6) nextEmiH6.textContent = 'Total Customers';
        document.getElementById('nextEmiAmount').textContent = stats.totalCustomers || 0;
        document.getElementById('nextEmiDate').textContent = 'Registered accounts';

        const totalPaidH6 = document.querySelector('.dashboard .col-md-3:nth-child(4) h6');
        if (totalPaidH6) totalPaidH6.textContent = 'Overdue EMIs';
        document.getElementById('totalPaid').textContent = stats.overdueEMIs || 0;

        // Load all loans for table
                const loansRes = await fetch(API + '/loans');
        userLoans = await loansRes.json();
        
        // Render Pending Loans
        const pendingSection = document.getElementById('pendingLoansSection');
        if (pendingSection) {
            const pendingLoans = userLoans.filter(l => l.status === 'Pending');
            if (pendingLoans.length > 0) {
                pendingSection.style.display = 'flex';
                document.getElementById('pendingLoansBody').innerHTML = pendingLoans.map(l => `
                    <tr>
                        <td><strong>#${l.id}</strong></td>
                        <td>${l.customer_name || 'Customer'}</td>
                        <td>${l.loanType}</td>
                        <td>${fmt(l.loanAmount)}</td>
                        <td>${l.tenureMonths} Mos</td>
                        <td>
                            <button class="btn btn-success btn-sm me-2" onclick="updateLoanStatus(${l.id}, 'Active')"><i class="bi bi-check-circle"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="updateLoanStatus(${l.id}, 'Rejected')"><i class="bi bi-x-circle"></i></button>
                        </td>
                    </tr>
                `).join('');
            } else {
                pendingSection.style.display = 'none';
            }
        }
        
        renderMyLoansTable();
        populateLoanSelector();
        
        // Hide Customer-specific sections
        const loanSelector = document.getElementById('loanSelector');
        if (loanSelector) loanSelector.parentElement.style.display = 'none';
        
        const myLoansHeader = document.querySelector('.card-header h5');
        if (myLoansHeader && myLoansHeader.textContent.includes('My Loans')) {
            myLoansHeader.innerHTML = '<i class="bi bi-list-ul me-2"></i> All Loans';
        }

        generateAIInsights();
    } catch (err) {
        console.error('Failed to fetch admin data:', err);
    }
}

// -- Load Customer Data ---------------------------------------------------------
async function loadCustomerData() {
    try {
        const res = await fetch(API + '/loans?customerId=' + session.id);
        userLoans = await res.json();
        
        let totalOut = 0;
        let activeCount = 0;
        
        userLoans.forEach(l => {
            if(l.status === 'Active') activeCount++;
            totalOut += l.outstandingBalance || 0;
        });

        totalOutstandingGlobal = totalOut;
        document.getElementById('activeLoansCount').textContent = activeCount;
        document.getElementById('totalOutstanding').textContent = fmt(totalOut);
        
        renderMyLoansTable();
        populateLoanSelector();
        await calculateGlobalEmiStats();
        generateAIInsights(); // Generate insights based on loaded data

    } catch (err) {
        console.error('Failed to fetch data:', err);
        document.getElementById('alertContainer').innerHTML = `<div class="loan-alert"><i class="bi bi-info-circle-fill me-2"></i> Backend is currently offline or unreachable. Please try again later.</div>`;
    }
}

// -- Render My Loans Table ------------------------------------------------------
function renderMyLoansTable() {
    const tbody = document.getElementById('myLoansBody');
    if(userLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">You do not have any active loans right now.</td></tr>';
        return;
    }

    tbody.innerHTML = userLoans.map(l => `
        <tr>
            <td><strong>#${l.id}</strong></td>
            <td>${l.loanType}</td>
            <td>${fmt(l.loanAmount)}</td>
            <td class="text-danger fw-bold">${fmt(l.outstandingBalance)}</td>
            <td>${l.tenureMonths} Months</td>
            <td>
                ${badge(l.status)}
                ${(session.role === 'Admin' && l.status === 'Overdue') ? `<button class="btn btn-sm btn-outline-danger ms-2" onclick="sendReminder(${l.id}, '${l.customer_name || 'Customer'}')"><i class="bi bi-bell"></i> Notify</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// -- Render Loan Selector -------------------------------------------------------
function populateLoanSelector() {
    const sel = document.getElementById('loanSelector');
    sel.innerHTML = '<option value="">Select a Loan to view EMIs...</option>';
    userLoans.forEach(l => {
        sel.innerHTML += `<option value="${l.id}">Loan #${l.id} - ${l.loanType} (${fmt(l.loanAmount)})</option>`;
    });

    if(userLoans.length > 0) {
        sel.value = userLoans[0].id;
        loadEMISchedule(userLoans[0].id);
    }
}

// -- Load Specific EMI Schedule -------------------------------------------------
async function loadEMISchedule(loanId) {
    const tbody = document.getElementById('emiScheduleBody');
    if(!loanId) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Select a loan to view EMI schedule</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading EMIs... <span class="spinner-border spinner-border-sm"></span></td></tr>';

    try {
        const res = await fetch(API + '/emi?loanId=' + loanId);
        const emiList = await res.json();
        
        if(emiList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No EMI schedule found.</td></tr>';
            return;
        }

        let foundNextPending = false;
        tbody.innerHTML = emiList.map(e => {
            let actionBtn = '';
            if (e.status === 'Paid') {
                actionBtn = `<small class="text-success fw-bold"><i class="bi bi-check-all"></i> Paid on ${formatDate(e.paidDate)}</small>`;
            } else if ((e.status === 'Pending' || e.status === 'Overdue') && !foundNextPending) {
                foundNextPending = true;
                actionBtn = `<button class="btn btn-sm btn-primary px-3" onclick="payEMI(${e.id}, ${e.emiAmount})">Pay Now</button>`;
            } else {
                actionBtn = `<button class="btn btn-sm btn-secondary px-3" disabled>Locked</button>`;
            }

            return `
            <tr class="${e.status === 'Overdue' ? 'table-danger' : ''}">
                <td>${e.installmentNo}</td>
                <td class="${e.status === 'Overdue' ? 'text-danger fw-bold' : ''}">${formatDate(e.dueDate)}</td>
                <td class="fw-bold">${fmt(e.emiAmount)}</td>
                <td class="text-muted">${fmt(e.principalComponent)}</td>
                <td class="text-muted">${fmt(e.interestComponent)}</td>
                <td>${badge(e.status)}</td>
                <td>${actionBtn}</td>
            </tr>`;
        }).join('');

    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading EMI schedule.</td></tr>';
    }
}

// -- Global EMI Stats (Next Due, Total Paid) ------------------------------------
async function calculateGlobalEmiStats() {
    if(userLoans.length === 0) return;
    
    let totalPaid = 0;
    let nextEmi = null;

    for (let loan of userLoans) {
        try {
            const res = await fetch(API + '/emi?loanId=' + loan.id);
            const emiList = await res.json();
            
            emiList.forEach(e => {
                if (e.status === 'Paid') {
                    totalPaid += e.emiAmount;
                }
                if (e.status === 'Pending' || e.status === 'Overdue') {
                    if (!nextEmi) {
                        nextEmi = Object.assign({}, e);
                        nextEmi.totalSum = e.emiAmount;
                        nextEmi.loanCount = 1;
                        nextEmi.loanType = loan.loanType;
                    } else {
                        const d1 = new Date(e.dueDate).getTime();
                        const d2 = new Date(nextEmi.dueDate).getTime();
                        if (d1 < d2) {
                            nextEmi = Object.assign({}, e);
                            nextEmi.totalSum = e.emiAmount;
                            nextEmi.loanCount = 1;
                            nextEmi.loanType = loan.loanType;
                        } else if (d1 === d2) {
                            nextEmi.totalSum += e.emiAmount;
                            nextEmi.loanCount++;
                            nextEmi.loanType += " & " + loan.loanType;
                        }
                    }
                }
            });
        } catch(e) {}
    }

    nextEmiGlobal = nextEmi;
    document.getElementById('totalPaid').textContent = fmt(totalPaid);
    
    if (nextEmi) {
        document.getElementById('nextEmiAmount').textContent = fmt(nextEmi.totalSum || nextEmi.emiAmount);
        let label = "Due by " + formatDate(nextEmi.dueDate);
        if (nextEmi.loanCount > 1) label += ` (for ${nextEmi.loanCount} loans)`;
        document.getElementById('nextEmiDate').textContent = label;
        
        if (nextEmi.status === 'Overdue') {
            document.getElementById('nextEmiAmount').classList.add('text-danger');
            showAlert("You have an overdue EMI that was due on " + formatDate(nextEmi.dueDate) + ". Please pay immediately to avoid penalties.");
        }
    } else {
        document.getElementById('nextEmiAmount').textContent = '₹0';
        document.getElementById('nextEmiDate').textContent = 'No pending EMIs';
    }
}

// -- Pay EMI Action -------------------------------------------------------------
async function payEMI(emiId, amount) {
    if(!confirm("Are you sure you want to pay " + fmt(amount) + " now?")) return;

    try {
        const res = await fetch(API + '/emi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emiId: emiId })
        });
        const data = await res.json();

        if (data.status === 'success') {
            const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
            document.getElementById('paymentModalText').textContent = "Successfully paid " + fmt(amount) + " towards your loan.";
            modal.show();
            loadCustomerData();
        } else {
            alert('Failed to process payment. Try again later.');
        }
    } catch(err) {
        console.error(err);
        alert('Server error processing payment.');
    }
}

function showAlert(msg) {
    const div = document.createElement('div');
    div.className = 'loan-alert shadow-sm';
    div.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i> ${msg}`;
    document.getElementById('alertContainer').appendChild(div);
}

// -- AI Financial Insights ------------------------------------------------------
async function generateAIInsights() {
    const container = document.getElementById('aiInsightsContent');
    
    if (userLoans.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info border-0 shadow-sm">
                <strong><i class="bi bi-lightbulb-fill text-warning me-1"></i> Tip:</strong> 
                You currently don't have any active loans with us. Did you know our Home Loan rates start at just 8.5% p.a.? Applying is easy and paperless!
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm text-primary"></span><span class="ms-2 text-muted">Generating AI Insights...</span></div>';
    let insightsHTML = '';

    // Insight 1: Next EMI Urgency (Using EMI Reminder AI)
    if (nextEmiGlobal) {
        try {
            const res = await fetch(API + '/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'emi_reminder', 
                    missed_payments: 0, 
                    days_overdue: Math.max(0, Math.floor((new Date() - new Date(nextEmiGlobal.dueDate)) / (1000 * 60 * 60 * 24))), 
                    income: 50000 
                })
            });
            const data = await res.json();
            const sentiment = data.sentiment || "Neutral";
            const urgency = data.urgency_level || "Medium";
            const msg = data.message || "Your EMI is due soon.";
            
            let alertClass = 'warning';
            if (urgency === 'High' || urgency === 'Critical') alertClass = 'danger';
            else if (urgency === 'Low') alertClass = 'success';
            
            insightsHTML += `<div class="alert alert-${alertClass} border-0 shadow-sm mb-2">
                <i class="bi bi-robot me-2"></i><strong>AI EMI Reminder:</strong> ${msg}
            </div>`;
        } catch (e) {
            console.error(e);
        }
    }

    // Insight 2: Prepayment Savings Simulation (Using Early Closure AI)
    if (totalOutstandingGlobal > 0 && nextEmiGlobal) {
        try {
            const extraPayment = Math.floor(nextEmiGlobal.emiAmount * 0.1); // 10% extra
            const res = await fetch(API + '/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    type: 'early_closure', 
                    outstanding_balance: totalOutstandingGlobal, 
                    emi: nextEmiGlobal.emiAmount, 
                    extra_payment: extraPayment 
                })
            });
            const data = await res.json();
            
            insightsHTML += `
                <div class="alert bg-white border shadow-sm mb-0 mt-2">
                    <strong><i class="bi bi-robot text-success me-1"></i> AI Prepayment Strategy:</strong> 
                    By paying an extra <strong>${fmt(extraPayment)}</strong> towards your principal each month, you can close your loan in <strong>${data.new_months_to_close} months</strong> (saving ${data.months_saved} months) and save <strong>${fmt(data.interest_saved)}</strong> in interest!
                </div>
            `;
        } catch(e) {
            console.error(e);
        }
    }

    container.innerHTML = insightsHTML;
}

// -- AI Voice Assistant (Web Speech API) ----------------------------------------
let recognition = null;
let voiceModal = null;

function initVoiceAssistant() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, your browser doesn't support the AI Voice Assistant. Please use Google Chrome or Edge.");
        return false;
    }
    
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = function() {
        document.getElementById('aiVoiceBtn').classList.add('listening');
        document.getElementById('voiceModalTitle').textContent = "I'm listening...";
        document.getElementById('voiceModalTranscript').textContent = "Speak now...";
        if(!voiceModal) voiceModal = new bootstrap.Modal(document.getElementById('voiceModal'));
        voiceModal.show();
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        document.getElementById('voiceModalTranscript').textContent = '"' + transcript + '"';
        document.getElementById('voiceModalTitle').textContent = "Thinking...";
        
        setTimeout(() => processVoiceCommand(transcript), 1000);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
        document.getElementById('aiVoiceBtn').classList.remove('listening');
        if(voiceModal) voiceModal.hide();
        if(event.error !== 'no-speech') {
            alert('Microphone error. Please allow microphone permissions.');
        }
    };

    recognition.onend = function() {
        document.getElementById('aiVoiceBtn').classList.remove('listening');
    };
    return true;
}

function toggleVoiceAssistant() {
    if (!recognition) {
        if(!initVoiceAssistant()) return;
    }
    
    // Stop any currently speaking voice
    window.speechSynthesis.cancel();
    recognition.start();
}

function processVoiceCommand(command) {
    let responseText = "I'm sorry, I didn't catch that. You can ask me about your next EMI, your outstanding balance, or your total paid amount.";
    
    if (command.includes('next emi') || command.includes('due') || command.includes('pay next')) {
        if (nextEmiGlobal) {
            responseText = "Your next EMI is " + nextEmiGlobal.emiAmount + " rupees, and it is due on " + formatDate(nextEmiGlobal.dueDate) + ".";
        } else {
            responseText = "You don't have any pending EMIs at the moment. Great job!";
        }
    } 
    else if (command.includes('balance') || command.includes('outstanding') || command.includes('owe')) {
        if (totalOutstandingGlobal > 0) {
            responseText = "Your total outstanding balance across all your loans is " + totalOutstandingGlobal + " rupees.";
        } else {
            responseText = "You have zero outstanding balance. You do not owe anything right now.";
        }
    }
    else if (command.includes('paid') || command.includes('how much have i paid')) {
        const paidText = document.getElementById('totalPaid').textContent;
        responseText = "You have successfully paid back a total of " + paidText.replace('₹', '') + " rupees.";
    }
    else if (command.includes('active loan') || command.includes('how many loan')) {
        responseText = "You currently have " + document.getElementById('activeLoansCount').textContent + " active loans with us.";
    }

    document.getElementById('voiceModalTitle').textContent = "AI Response";
    document.getElementById('voiceModalTranscript').innerHTML = `<strong class="text-primary">${responseText}</strong>`;
    
    speakResponse(responseText);
    
    // Hide modal after a few seconds
    setTimeout(() => {
        if(voiceModal) voiceModal.hide();
    }, 5000);
}

function speakResponse(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
}


let bankProducts = [];

window.addEventListener('DOMContentLoaded', async () => {
    // Hide customer-only elements for Admin
    if (session && session.role === 'Admin') {
        document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'none');
    }
    
    // Fetch bank products
    try {
        const res = await fetch(API + '/bank-products');
        bankProducts = await res.json();
        const select = document.getElementById('newLoanBank');
        if (select) {
            select.innerHTML = '<option value="">Select a Bank & Loan Type...</option>';
            bankProducts.forEach(b => {
                select.innerHTML += `<option value="${b.id}">${b.bankName} - ${b.loanType} (${b.interestRate}% p.a.)</option>`;
            });
            
            select.addEventListener('change', (e) => {
                const product = (window.bankProductsData || bankProducts).find(p => p.id == e.target.value);
                if (product) {
                    document.getElementById('bankRateHint').textContent = `Official Interest Rate: ${product.interestRate}% p.a.`;
                }
            });
        }
    } catch(err) {}

    // Handle form submit
    const addLoanForm = document.getElementById('addLoanForm');
    if (addLoanForm) {
        addLoanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prodId = document.getElementById('newLoanBank').value;
            const amount = document.getElementById('newLoanAmount').value;
            const tenure = document.getElementById('newLoanTenure').value;
            
            const product = (window.bankProductsData || bankProducts).find(p => p.id == prodId);
            if (!product) return alert('Please select a bank');

            try {
                const res = await fetch(API + '/loans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerId: session.id,
                        loanType: product.bankName + " " + product.loanType,
                        loanAmount: Number(amount),
                        interestRate: product.interestRate,
                        tenureMonths: Number(tenure),
                        startDate: new Date().toISOString().split('T')[0]
                    })
                });
                
                const data = await res.json();
                if (data.status === 'success') {
                    alert('Loan added successfully! EMI schedule generated.');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addLoanModal'));
                    if(modal) modal.hide();
                    loadCustomerData(); // Reload UI
                } else {
                    alert('Failed to add loan.');
                }
            } catch(err) {
                console.error(err);
                alert('Error connecting to server.');
            }
        });
    }
});



// Profile Completion Logic
document.addEventListener('DOMContentLoaded', () => {
    const sessionStr = localStorage.getItem('slm_session');
    if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.role !== 'Admin' && (session.mobile === '0000000000' || !session.mobile)) {
            const modal = new bootstrap.Modal(document.getElementById('profileCompletionModal'));
            modal.show();
        }
    }
});

async function saveProfileMobile() {
    const mobile = document.getElementById('completeProfileMobile').value.trim();
    const msg = document.getElementById('profileCompletionMsg');
    
    if (mobile.length < 10) {
        msg.innerText = 'Please enter a valid mobile number.';
        msg.style.display = 'block';
        return;
    }
    
    msg.style.display = 'none';
    const session = JSON.parse(localStorage.getItem('slm_session'));
    
    try {
        const res = await fetch('http://localhost:8080/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: session.id, mobile: mobile })
        });
        
        const data = await res.json();
        if (data.status === 'success') {
            session.mobile = mobile;
            localStorage.setItem('slm_session', JSON.stringify(session));
            
            // Hide modal
            bootstrap.Modal.getInstance(document.getElementById('profileCompletionModal')).hide();
        } else {
            msg.innerText = 'Failed to save mobile number.';
            msg.style.display = 'block';
        }
    } catch (err) {
        msg.innerText = 'Server error. Please try again.';
        msg.style.display = 'block';
    }
}

// Handle Quick Customer Creation
document.addEventListener('DOMContentLoaded', () => {
    const quickCustomerForm = document.getElementById('quickCustomerForm');
    if (quickCustomerForm) {
        quickCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fn = document.getElementById('qcFirstName').value;
            const ln = document.getElementById('qcLastName').value;
            const em = document.getElementById('qcEmail').value;
            const mob = document.getElementById('qcMobile').value;
            const dob = document.getElementById('qcDob').value;
            const adr = document.getElementById('qcAddress').value;

            try {
                const res = await fetch('http://localhost:8080/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName: fn,
                        lastName: ln,
                        email: em,
                        mobile: mob,
                        dob: dob,
                        address: adr,
                        occupation: '',
                        income: 0,
                        loanType: ''
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert('Customer created successfully!');
                    quickCustomerForm.reset();
                    const modal = bootstrap.Modal.getInstance(document.getElementById('quickCustomerModal'));
                    if(modal) modal.hide();
                    if(typeof loadCustomers === 'function') loadCustomers();
                } else {
                    alert('Failed to create customer: ' + (data.message || 'Email might already exist.'));
                }
            } catch (err) {
                console.error(err);
                alert('Server error while creating customer.');
            }
        });
    }
});


// --- Bank Manager Creation Logic ---
function openBankManagerModal() {
    fetch('http://localhost:8080/banks')
        .then(r => r.json())
        .then(banks => {
            let select = document.getElementById('bmBankId');
            select.innerHTML = '<option value="">Select Bank</option>';
            banks.forEach(b => {
                select.innerHTML += `<option value="${b.id}">${b.bank_name}</option>`;
            });
            new bootstrap.Modal(document.getElementById('newBankManagerModal')).show();
        })
        .catch(e => console.error(e));
}

let bmForm = document.getElementById('newBankManagerForm');
if (bmForm) {
    bmForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let payload = {
            role: 'BankManager',
            firstName: document.getElementById('bmFirstName').value,
            lastName: document.getElementById('bmLastName').value,
            email: document.getElementById('bmEmail').value,
            mobile: document.getElementById('bmMobile').value,
            password: document.getElementById('bmPassword').value,
            bank_id: document.getElementById('bmBankId').value
        };
        
        try {
            let res = await fetch('http://localhost:8080/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data = await res.json();
            if (data.status === 'success') {
                if (data.emailSent) {
                    alert('Bank Manager created successfully and credentials sent to email!');
                } else {
                    alert('Bank Manager created successfully!\n\n(Note: Email sending failed. The assigned password is: ' + data.password + ')');
                }
                bootstrap.Modal.getInstance(document.getElementById('newBankManagerModal')).hide();
                bmForm.reset();
            } else {
                alert('Failed to create Bank Manager: ' + (data.message || 'Unknown error.'));
            }
        } catch (e) {
            console.error(e);
            alert('Error creating Bank Manager');
        }
    });
}
