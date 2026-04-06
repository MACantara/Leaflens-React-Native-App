package leaf.ai.Leaflens.domain;

import java.util.Optional;

public interface UserService {

    User createUser(String userName, String email, String password);
    Optional<User> findById(Long userId);
    Optional<User> findByEmail(String email);
    User updateUser(Long userId, String userName, String email);
    void delete(Long userId);
    boolean existsByEmail(String email);
}
