package com.smartloan;

import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

public class EmailService {

    private static final String SMTP_USER = "smartloanmanagement@gmail.com";
    private static final String SMTP_PASS = "vzrczefqzqkmmgcl";

    public static boolean sendOTP(String toEmail, String otpCode) {
        System.out.println("=================================================");
        System.out.println(">>> OTP GENERATED FOR " + toEmail + " : [" + otpCode + "] <<<");
        System.out.println("=================================================");

        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.connectiontimeout", "10000"); // 10s timeout
        props.put("mail.smtp.timeout", "10000");           // 10s timeout
        props.put("mail.smtp.writetimeout", "10000");      // 10s timeout

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SMTP_USER, SMTP_PASS);
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER, "Smart Loan Management"));
            message.setReplyTo(new Address[]{ new InternetAddress(SMTP_USER) });
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            
            // Clear, natural subject line for Gmail inbox categorization
            message.setSubject("Security Verification Code: " + otpCode + " - Smart Loan Management");

            // Anti-spam headers
            message.setHeader("X-Priority", "1");
            message.setHeader("Priority", "Urgent");
            message.setHeader("Importance", "High");
            message.setHeader("X-Mailer", "Smart Loan Management System");

            MimeMultipart multipart = new MimeMultipart("alternative");

            // 1. Plain Text Alternative (Essential for Gmail Spam Filter passing)
            MimeBodyPart textPart = new MimeBodyPart();
            textPart.setText("Hello,\n\nYour security verification code for Smart Loan Management account registration is: " + otpCode + "\n\nThis code will expire in 5 minutes.\n\nThank you,\nSmart Loan Management Team", "utf-8");
            multipart.addBodyPart(textPart);

            // 2. HTML Part
            MimeBodyPart htmlPart = new MimeBodyPart();
            String htmlBody = "<div style='font-family:Arial, sans-serif; padding: 25px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 500px; margin: 0 auto;'>"
                    + "<h2 style='color:#0d6efd; margin-top:0;'>Smart Loan Management</h2>"
                    + "<p style='font-size: 15px; color: #333;'>Hello,</p>"
                    + "<p style='font-size: 15px; color: #555;'>Your security verification code for account registration is:</p>"
                    + "<div style='background: #f4f7fa; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0;'>"
                    + "<h1 style='color:#0d6efd; letter-spacing: 8px; margin: 0; font-size: 32px;'>" + otpCode + "</h1>"
                    + "</div>"
                    + "<p style='font-size: 14px; color: #777;'>This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>"
                    + "<hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>"
                    + "<p style='font-size: 12px; color: #aaa; text-align: center;'>Smart Loan Management System</p>"
                    + "</div>";
            htmlPart.setContent(htmlBody, "text/html; charset=utf-8");
            multipart.addBodyPart(htmlPart);

            message.setContent(multipart);

            // Dispatch email sending in background thread
            new Thread(() -> {
                try {
                    Transport.send(message);
                    System.out.println("SUCCESS: Multi-part OTP Email delivered to " + toEmail);
                } catch (Exception ex) {
                    System.err.println("SMTP SEND FAILURE for " + toEmail + ": " + ex.getMessage());
                    ex.printStackTrace();
                }
            }).start();

            return true;

        } catch (Exception e) {
            System.err.println("Failed to build OTP email for " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public static boolean sendWelcomeEmail(String toEmail, String name, String password) {
        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SMTP_USER, SMTP_PASS);
            }
        });

        try {
            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SMTP_USER, "Smart Loan Management"));
            message.setReplyTo(new Address[]{ new InternetAddress(SMTP_USER) });
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject("Welcome to Smart Loan Management");

            String htmlBody = "<div style='font-family:Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;'>"
                    + "<h2 style='color:#0d6efd;'>Welcome to Smart Loan Management</h2>"
                    + "<p>Hello " + name + ",</p>"
                    + "<p>Your account credentials have been configured.</p>"
                    + "<ul>"
                    + "<li><b>Email:</b> " + toEmail + "</li>"
                    + "<li><b>Password:</b> " + password + "</li>"
                    + "</ul>"
                    + "</div>";

            message.setContent(htmlBody, "text/html; charset=utf-8");

            new Thread(() -> {
                try {
                    Transport.send(message);
                    System.out.println("Welcome email sent to " + toEmail);
                } catch (Exception ex) {
                    System.err.println("SMTP Send Warning: " + ex.getMessage());
                }
            }).start();

            return true;

        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
            return false;
        }
    }

    public static void sendLoanApprovalEmailAsync(String toEmail, String customerName, double amount, String loanType) {
        new Thread(() -> {
            try {
                System.out.println("Loan Approval Notification for " + customerName + " (" + toEmail + ") - " + loanType + " Amount: Rs. " + amount);
            } catch (Exception e) {
                System.err.println("Error sending loan approval notification: " + e.getMessage());
            }
        }).start();
    }
}
