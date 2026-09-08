import java.util.Properties;
import jakarta.mail.*;
import jakarta.mail.internet.*;

public class TestEmail {
    public static void main(String[] args) {
        String SMTP_USER = "karthigamaharajan637@gmail.com";
        String SMTP_PASS = "okdhgqunwvwptrwm";
        
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
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse("rajanmaha492@gmail.com"));
            message.setSubject("Test Email");
            message.setText("This is a test email.");

            Transport.send(message);
            System.out.println("Test email sent successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
