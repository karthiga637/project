import re

path = r'C:\loan managementproject\frontend\dashboard.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Add a button in the topbar or sidebar? Let's add it to the Customer Tab (wait, Admin has a Customer Tab).
# Actually, let's just add a new modal and a button next to Quick Add Customer.
# I will use a python script to insert it before <!-- Quick New Customer Modal -->
# Also need to fetch banks for the dropdown.

modal_html = """
<!-- Quick Add Bank Manager Modal -->
<div class="modal fade" id="newBankManagerModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="bi bi-briefcase-fill me-2"></i>Add Bank Manager</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <form id="bankManagerForm">
          <div class="row">
              <div class="col-md-6 mb-3"><label>First Name</label><input type="text" id="bmFirstName" class="form-control" required></div>
              <div class="col-md-6 mb-3"><label>Last Name</label><input type="text" id="bmLastName" class="form-control" required></div>
          </div>
          <div class="mb-3"><label>Email</label><input type="email" id="bmEmail" class="form-control" required></div>
          <div class="mb-3"><label>Mobile</label><input type="text" id="bmMobile" class="form-control" maxlength="10" pattern="\\d{10}" oninput="this.value=this.value.replace(/\\D/g,'').slice(0,10)" required></div>
          <div class="mb-3"><label>Password</label><input type="password" id="bmPassword" class="form-control" required></div>
          <div class="mb-3">
              <label>Assign Bank</label>
              <select id="bmBankId" class="form-select" required>
                  <option value="">Loading banks...</option>
              </select>
          </div>
          <button type="submit" class="btn btn-primary w-100">Create Bank Manager</button>
        </form>
      </div>
    </div>
  </div>
</div>
"""

# Insert modal
if "newBankManagerModal" not in html:
    html = html.replace('<!-- Quick New Customer Modal -->', modal_html + '\n<!-- Quick New Customer Modal -->')

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Dashboard HTML patched for Bank Manager modal.")
