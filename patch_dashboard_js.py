import re

path = r'C:\loan managementproject\frontend\dashboard.js'
with open(path, 'r', encoding='utf-8') as f:
    js = f.read()

# Append logic for Bank Manager modal at the end of the file
js_logic = """

// --- Bank Manager Creation Logic ---
function openBankManagerModal() {
    fetch('/api/banks')
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

let bmForm = document.getElementById('bankManagerForm');
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
            let res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data = await res.json();
            if (data.status === 'success') {
                alert('Bank Manager created successfully!');
                bootstrap.Modal.getInstance(document.getElementById('newBankManagerModal')).hide();
                bmForm.reset();
            } else {
                alert('Failed to create Bank Manager.');
            }
        } catch (e) {
            console.error(e);
            alert('Error creating Bank Manager');
        }
    });
}
"""

if "openBankManagerModal" not in js:
    with open(path, 'a', encoding='utf-8') as f:
        f.write(js_logic)
        
print("Dashboard JS patched.")
