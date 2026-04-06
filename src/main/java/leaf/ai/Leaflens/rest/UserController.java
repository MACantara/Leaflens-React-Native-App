package leaf.ai.Leaflens.rest;

import leaf.ai.Leaflens.domain.User;
import leaf.ai.Leaflens.domain.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("api/v1/user")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService){
        this.userService = userService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUser(@PathVariable Long userId){

        try {
            return userService.findById(userId).map(user ->ResponseEntity.ok(Map.of(
                    "userId", user.getUserId(),
                    "userName", user.getUserName(),
                    "email", user.getEmail()
            ))).orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException illegalArgumentException){
            return ResponseEntity.badRequest().body(Map.of("error",illegalArgumentException.getMessage()));
        }
        catch (Exception e){
            return ResponseEntity.internalServerError().body(Map.of("error",e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody UpdateUserRequest updateUserRequest) {

        try {
            User updatedUser = userService.updateUser(
                    userId,
                    updateUserRequest.getUserName(),
                    updateUserRequest.getEmail());
            return ResponseEntity.ok(Map.of(
                    "message", "User updated successfully",
                    "userId", updatedUser.getUserId(),
                    "userName", updatedUser.getUserName(),
                    "email", updatedUser.getEmail()
            ));
        } catch (IllegalArgumentException illegalArgumentException) {
            return ResponseEntity.badRequest().body(Map.of("error",illegalArgumentException.getMessage()));
        } catch (RuntimeException runtimeException){
            if (runtimeException.getMessage().contains("User not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error",runtimeException.getMessage()));
        } catch (Exception e){
            return ResponseEntity.internalServerError().body(Map.of("error","Failed to update user"+ e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId){
        try {
            userService.delete(userId);
            return ResponseEntity.ok(Map.of(
                    "message", "User deleted",
                    "userId", userId
            ));
        } catch (RuntimeException runtimeException){
            if (runtimeException.getMessage().contains("User not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("error",runtimeException.getMessage()));

        } catch(Exception e){
            return ResponseEntity.internalServerError().body(Map.of("error","Failed to delete user"+ e.getMessage()));
        }
    }

}
