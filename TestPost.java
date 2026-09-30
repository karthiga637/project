import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestPost {
    public static void main(String[] args) {
        try {
            String json = "{\"role\":\"BankManager\",\"firstName\":\"test\",\"lastName\":\"test\",\"email\":\"test12345@gmail.com\",\"mobile\":\"9123456789\",\"password\":\"pass123\",\"bank_id\":\"1\"}";
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:8080/customers"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Status: " + response.statusCode());
            System.out.println("Body: " + response.body());
        } catch(Exception e) {
            e.printStackTrace();
        }
    }
}
