import re

path = r'C:\loan managementproject\frontend\bank-manager-dashboard.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace("localStorage.getItem('smartloan_user')", "localStorage.getItem('slm_session')")
html = html.replace("localStorage.removeItem('smartloan_user')", "localStorage.removeItem('slm_session')")

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)
    
print("Fixed bank-manager-dashboard.html localStorage key.")
