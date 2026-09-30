import re

path = r'C:\loan managementproject\frontend\dashboard.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

btn_html = """
<button class="btn btn-outline-primary admin-only" onclick="openBankManagerModal()">
    <i class="bi bi-briefcase"></i> Add Bank Manager
</button>
<button class="btn btn-primary admin-only" data-bs-toggle="modal" data-bs-target="#newCustomerModal">
"""

html = html.replace('<button class="btn btn-primary admin-only" data-bs-toggle="modal" data-bs-target="#newCustomerModal">', btn_html)

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
    
print("Dashboard HTML patched for button.")
