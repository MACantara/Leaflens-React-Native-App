package leaf.ai.Leaflens.rest;

public class AuthenticationResponse {

    private final String token;
    private final Long userId;
    private final String userName;
    private final String email;
    private final String message;

    public AuthenticationResponse(String token, Long userId, String userName, String email, String message) {
        this.token = token;
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }
}
