import re

path = r'C:\loan managementproject\frontend\login.js'
with open(path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace 'dashboard.html' with dynamic check based on role, except on initial load where we can parse session
js = js.replace("window.location.href = 'dashboard.html';", """
if (data && data.role === 'BankManager') {
    window.location.href = 'bank-manager-dashboard.html';
} else if (typeof data === 'undefined' && typeof session !== 'undefined') {
    let s = JSON.parse(session);
    if (s.role === 'BankManager') {
        window.location.href = 'bank-manager-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
} else {
    window.location.href = 'dashboard.html';
}
""")

with open(path, 'w', encoding='utf-8') as f:
    f.write(js)
    
print("Fixed login.js redirection.")
