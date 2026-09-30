package com.smartloan;

public class TestSMTP {
    public static void main(String[] args) {
        try {
            System.out.println("Testing SMTP email dispatch directly...");
            java.util.Properties props = new java.util.Properties();
            props.put("mail.smtp.host", "smtp.gmail.com");
            props.put("mail.smtp.port", "587");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
            props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");

            jakarta.mail.Session session = jakarta.mail.Session.getInstance(props, new jakarta.mail.Authenticator() {
                protected jakarta.mail.PasswordAuthentication getPasswordAuthentication() {
                    return new jakarta.mail.PasswordAuthentication("smartloanmanagement@gmail.com", "vzrczefqzqkmmgcl");
                }
            });

            jakarta.mail.Message message = new jakarta.mail.internet.MimeMessage(session);
            message.setFrom(new jakarta.mail.internet.InternetAddress("smartloanmanagement@gmail.com", "Smart Loan Management"));
            message.setRecipients(jakarta.mail.Message.RecipientType.TO, jakarta.mail.internet.InternetAddress.parse("karthigamaharajan637@gmail.com"));
            message.setSubject("Test Verification OTP Code");
            message.setText("Your OTP code is 1234");

            System.out.println("Connecting to Gmail SMTP server...");
            jakarta.mail.Transport.send(message);
            System.out.println("SUCCESS! Email sent successfully to karthigamaharajan637@gmail.com");

        } catch (Exception e) {
            System.err.println("SMTP EXCEPTION OCCURRED:");
            e.printStackTrace();
        }
    }
}
