import re

path = r'C:\loan managementproject\frontend\dashboard.js'
with open(path, 'r', encoding='utf-8') as f:
    js = f.read()

js = js.replace("fetch('/api/banks')", "fetch('http://localhost:8080/banks')")
js = js.replace("fetch('/api/customers'", "fetch('http://localhost:8080/customers'")

with open(path, 'w', encoding='utf-8') as f:
    f.write(js)

path2 = r'C:\loan managementproject\frontend\bank-manager-dashboard.html'
with open(path2, 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace("fetch('/api/bankmanager/analytics')", "fetch('http://localhost:8080/bankmanager/analytics')")
html = html.replace("fetch('/api/bankmanager/products'", "fetch('http://localhost:8080/bankmanager/products'")
html = html.replace("fetch('/api/bankmanager/leads')", "fetch('http://localhost:8080/bankmanager/leads')")

with open(path2, 'w', encoding='utf-8') as f:
    f.write(html)
    
print("Fixed URLs.")
