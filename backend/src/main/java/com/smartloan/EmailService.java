package com.smartloan;

import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

public class EmailService {

    // IMPORTANT: User must replace these with their actual Gmail and App Password!
    private static final String SMTP_USER = "karthigamaharajan637@gmail.com";
    private static final String SMTP_PASS = "sftwhdumrrgkrkwv";

    public static boolean sendOTP(String toEmail, String otpCode) {
        if (SMTP_USER.equals("YOUR_EMAIL@gmail.com")) {
            System.err.println("WARNING: Email not configured! Would have sent OTP " + otpCode + " to " + toEmail);
            return true;
        }

        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SMTP_USER, SMTP_PASS);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER, "Smart Loan Management"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("Your Login OTP Code");

            String htmlBody = "<div style='font-family:Arial; padding: 20px; border: 1px solid #ddd;'>"
                    + "<h2 style='color:#0d6efd;'>Smart Loan Management</h2>"
                    + "<p>Hello,</p>"
                    + "<p>Your One-Time Password (OTP) for verification is:</p>"
                    + "<h1 style='color:#333; letter-spacing: 5px;'>" + otpCode + "</h1>"
                    + "<p>This code will expire in 5 minutes.</p>"
                    + "<p>If you did not request this, please ignore this email.</p>"
                    + "</div>";

            message.setContent(htmlBody, "text/html; charset=utf-8");

            Transport.send(message);
            System.out.println("OTP sent successfully to " + toEmail);
            return true;

        } catch (Exception e) {
            System.err.println("Failed to send OTP to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            return true;
        }
    }

    public static boolean sendWelcomeEmail(String toEmail, String name, String password) {
        if (SMTP_USER.equals("YOUR_EMAIL@gmail.com")) {
            System.err.println("WARNING: Email not configured! Would have sent welcome email to " + toEmail);
            return true;
        }

        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SMTP_USER, SMTP_PASS);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER, "Smart Loan Management"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("Welcome to Smart Loan Management - Bank Manager Account");

            String htmlBody = "<div style='font-family:Arial; padding: 20px; border: 1px solid #ddd;'>"
                    + "<h2 style='color:#0d6efd;'>Welcome to Smart Loan Management</h2>"
                    + "<p>Hello " + name + ",</p>"
                    + "<p>An Admin has created a Bank Manager account for you.</p>"
                    + "<p>Here are your login credentials:</p>"
                    + "<ul>"
                    + "<li><b>Email:</b> " + toEmail + "</li>"
                    + "<li><b>Password:</b> " + password + "</li>"
                    + "</ul>"
                    + "<p>Please log in and change your password as soon as possible.</p>"
                    + "</div>";

            message.setContent(htmlBody, "text/html; charset=utf-8");

            Transport.send(message);
            System.out.println("Welcome email sent successfully to " + toEmail);
            return true;

        } catch (Exception e) {
            System.err.println("Failed to send welcome email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}


