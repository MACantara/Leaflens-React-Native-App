package leaf.ai.Leaflens.infrastructure.repository;

import leaf.ai.Leaflens.JpaRepository.UserJpaRepository;
import leaf.ai.Leaflens.domain.User;
import leaf.ai.Leaflens.domain.UserMapper;
import leaf.ai.Leaflens.domain.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository jpaRepository;
    private final UserMapper mapper;

    public UserRepositoryImpl(UserJpaRepository jpaRepository, UserMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<User> findById(Long userId) {
        return jpaRepository.findById(userId)
                .map(mapper::toDomain);

    }

    @Override
    public Optional<User> findByEmail(String email) {
        return Optional.ofNullable(jpaRepository.findByEmail(email))
                .map(mapper::toDomain);
    }

    @Override
    public User save(User user) {
        var entity = mapper.toEntity(user);
        var savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();

    }

    @Override
    public void delete(User existingUser) {
        if(existingUser.getUserId() != null){
            jpaRepository.deleteById(existingUser.getUserId());
        }
    }


}
