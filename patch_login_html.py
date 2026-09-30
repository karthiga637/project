import re

html_path = r'C:\loan managementproject\frontend\login.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Make all mobile number inputs 10 digits strictly
html = html.replace('id="mobile" class="form-control" placeholder="Enter your 10-digit mobile number" required', 'id="mobile" class="form-control" placeholder="Enter your 10-digit mobile number" maxlength="10" pattern="\d{10}" oninput="this.value=this.value.replace(/\\D/g,\'\').slice(0,10)" required')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("login.html patched for mobile number.")
