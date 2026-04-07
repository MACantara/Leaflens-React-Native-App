package leaf.ai.Leaflens.domain;

import jakarta.transaction.Transactional;
import leaf.ai.Leaflens.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Transactional
public class UserServiceImpl implements UserService{

    UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    @Override
    public User createUser(String userName, String email, String password) {

        if(userRepository.existsByEmail(email)){
            throw new IllegalArgumentException("Email Already Used" + email);
        }

        User user = new User(null, userName, email, password);
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findById(Long userId) {

        if(userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return userRepository.findById(userId);

    }

    @Override
    public Optional<User> findByEmail(String email) {
        if(email == null){
            throw new IllegalArgumentException("Email not given");
        }
        return userRepository.findByEmail(email);
    }

    @Override
    public User updateUser(Long userId, String userName, String email) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User does not exist" + userId));
        User updatedUser = new User(userId, userName,email, existingUser.getPassword());
        return userRepository.save(updatedUser);
    }

    @Override
    public void delete(Long userId) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User does not exist" + userId));
        userRepository.delete(existingUser);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
