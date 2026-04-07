package leaf.ai.Leaflens.security;

import leaf.ai.Leaflens.domain.User;
import leaf.ai.Leaflens.domain.UserService;
import leaf.ai.Leaflens.rest.AuthenticationResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthenticationService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthenticationService(UserService userService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthenticationResponse register(String userName, String email, String password){

        if(userService.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already used");
        }

        String hashedPassword = passwordEncoder.encode(password);
        User user = userService.createUser(userName,email,hashedPassword);

        String token = jwtService.generateToken(user.getUserId(),user.getEmail());

        return new AuthenticationResponse(
                token,
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                "User registered successfully"
        );
    }

    public AuthenticationResponse login(String email, String password){
        Optional<User> userOptional = userService.findByEmail(email);
        if(userOptional.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        User user = userOptional.get();

        if(!passwordEncoder.matches(password,user.getPassword())){
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getUserId(),user.getEmail());

        return new AuthenticationResponse(
                token,
                user.getUserId(),
                user.getUserName(),
                user.getEmail(),
                "Login successfully"
        );
    }

    public Long getUserIdFromToken(String token){
        return jwtService.extractUserId(token);
    }

    public String getEmailFromToken(String token){
        return jwtService.extractEmail(token);
    }

    public boolean validateToken(String token, String email){
        return jwtService.isTokenValid(token, email);
    }
}
