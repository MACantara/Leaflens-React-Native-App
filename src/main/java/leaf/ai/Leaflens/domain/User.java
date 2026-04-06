package leaf.ai.Leaflens.domain;

public class User {
    private final Long userId;
    private final String userName;
    private final String email;
    private final String password;

    public User(Long userId, String userName, String email, String password) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.password = password;
    }

    public boolean canSaveLeafAnalysis() {
        return userId != null && userName != null && !userName.trim().isEmpty();
    }

    public boolean isValidUser() {
        return email != null && !email.trim().isEmpty() &&
                password != null && !password.trim().isEmpty();
    }

    public Long getUserId() {return userId;}
    public String getUserName() {return userName;}
    public String getEmail() {return email;}
    public String getPassword() {return password;}
}
