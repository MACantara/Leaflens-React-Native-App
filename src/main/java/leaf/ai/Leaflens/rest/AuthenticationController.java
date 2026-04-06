package leaf.ai.Leaflens.rest;

import io.micrometer.core.ipc.http.HttpSender;
import leaf.ai.Leaflens.security.AuthenticationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    public AuthenticationController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request){

        try {
            AuthenticationResponse authenticationResponse = authenticationService.register(
                    request.getUserName(),
                    request.getEmail(),
                    request.getPassword()
            );

            return ResponseEntity.ok(Map.of(
                    "token", authenticationResponse.getToken(),
                    "userId", authenticationResponse.getUserId(),
                    "userName", authenticationResponse.getUserName(),
                    "email", authenticationResponse.getEmail(),
                    "message", authenticationResponse.getMessage()
            ));
        } catch (IllegalArgumentException illegalArgumentException) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", illegalArgumentException.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthenticationResponse response = authenticationService.login(
                    request.getEmail(),
                    request.getPassword()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "token", response.getToken(),
                            "userId", response.getUserId(),
                            "userName", response.getUserName(),
                            "email", response.getEmail(),
                            "message", response.getMessage()
            ));
        } catch(IllegalArgumentException illegalArgumentException){
            return ResponseEntity.badRequest()
                    .body(Map.of("error", illegalArgumentException.getMessage()));
        } catch(Exception e) {
            return ResponseEntity.internalServerError().body(
                    Map.of("error","Login failed: " + e.getMessage())
            );
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authorization) {
        try{
            if(authorization == null || !authorization.startsWith("Bearer ")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error","Invalid authorization header"));
            }

            String token = authorization.substring(7);
            String email = authenticationService.getEmailFromToken(token);
            Long userId = authenticationService.getUserIdFromToken(token);

            boolean isValid = authenticationService.validateToken(token,email);

            if (isValid) {
                return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "userId", userId,
                        "email", email
                ));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("valid", false, "error", "Token is invalid or expired"));
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "error", "Token validation failed"));
        }
    }
}
