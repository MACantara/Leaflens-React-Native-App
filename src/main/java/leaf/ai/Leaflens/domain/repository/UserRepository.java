package leaf.ai.Leaflens.domain.repository;

import leaf.ai.Leaflens.domain.User;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findById(Long userId);
    Optional<User> findByEmail(String email);
    User save(User user);
    boolean existsByEmail(String email);
    void delete(User existingUser);
}
