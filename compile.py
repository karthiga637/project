import shutil
import os
import subprocess
import glob

# copy java files to a temp dir without spaces
os.makedirs(r'C:\temp_src', exist_ok=True)
for f in glob.glob(r'C:\loan managementproject\backend\src\main\java\com\smartloan\*.java'):
    shutil.copy(f, r'C:\temp_src')

# copy jars
os.makedirs(r'C:\temp_libs', exist_ok=True)
shutil.copy(r'C:\loan managementproject\tomcat\apache-tomcat-10.1.20\lib\servlet-api.jar', r'C:\temp_libs')
for f in glob.glob(r'C:\loan managementproject\tomcat\apache-tomcat-10.1.20\webapps\ROOT\WEB-INF\lib\*.jar'):
    shutil.copy(f, r'C:\temp_libs')

with open(r'C:\temp_src\sources.txt', 'w') as f:
    f.write('\n'.join(glob.glob(r'C:\temp_src\*.java')))

cmd = r'javac -cp "C:\temp_libs\*" -d "C:\loan managementproject\tomcat\apache-tomcat-10.1.20\webapps\ROOT\WEB-INF\classes" @C:\temp_src\sources.txt'
subprocess.run(cmd, shell=True, check=True)
print("Compiled successfully.")

# copy frontend files
shutil.copytree(r'C:\loan managementproject\frontend', r'C:\loan managementproject\tomcat\apache-tomcat-10.1.20\webapps\ROOT', dirs_exist_ok=True)

