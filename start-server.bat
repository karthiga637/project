@echo off
echo Starting Smart Loan Management Backend Server...

:: Set Java Home
set JAVA_HOME=C:\Program Files\Java\jdk-21

:: Navigate to Tomcat directory and start
cd "C:\loan managementproject\tomcat\apache-tomcat-10.1.20\bin"
call catalina.bat run
