import re

path_manager = r'C:\loan managementproject\backend\src\main\java\com\smartloan\BankManagerServlet.java'
with open(path_manager, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('import com.google.gson.Gson;', 'import com.fasterxml.jackson.databind.ObjectMapper;')
code = code.replace('private final Gson gson = new Gson();', 'private final ObjectMapper mapper = new ObjectMapper();')
code = code.replace('gson.toJson', 'mapper.writeValueAsString')
code = code.replace('gson.fromJson(request.getReader(), Map.class)', 'mapper.readValue(request.getReader(), Map.class)')

with open(path_manager, 'w', encoding='utf-8') as f:
    f.write(code)

path_bank = r'C:\loan managementproject\backend\src\main\java\com\smartloan\BankServlet.java'
with open(path_bank, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('import com.google.gson.Gson;', 'import com.fasterxml.jackson.databind.ObjectMapper;')
code = code.replace('private final Gson gson = new Gson();', 'private final ObjectMapper mapper = new ObjectMapper();')
code = code.replace('gson.toJson', 'mapper.writeValueAsString')

with open(path_bank, 'w', encoding='utf-8') as f:
    f.write(code)

print("Switched from Gson to Jackson.")
