@echo off
set CP="C:\loan managementproject\tomcat\apache-tomcat-10.1.20\lib\servlet-api.jar;C:\loan managementproject\tomcat\apache-tomcat-10.1.20\webapps\ROOT\WEB-INF\lib\*"
set OUT="C:\loan managementproject\tomcat\apache-tomcat-10.1.20\webapps\ROOT\WEB-INF\classes"
set SRC="C:\loan managementproject\backend\src\main\java\com\smartloan\*.java"
javac -cp %CP% -d %OUT% %SRC%
