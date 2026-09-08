import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

public class TestDirectEmail {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication("karthigamaharajan637@gmail.com", "okdhgqunwvwptrwm");
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("karthigamaharajan637@gmail.com", "Smart Loan Management"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse("24ucs24@tcarts.in"));
            message.setSubject("Test Email from Server");
            message.setText("This is a direct test from the server to verify email delivery. Your password would be here.");
            Transport.send(message);
            System.out.println("TEST EMAIL SENT SUCCESSFULLY to 24ucs24@tcarts.in");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
