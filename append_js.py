js_code = """
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
"""

with open(r'C:\loan managementproject\frontend\dashboard.js', 'a', encoding='utf-8') as f:
    f.write(js_code)

print("Appended JS logic.")
