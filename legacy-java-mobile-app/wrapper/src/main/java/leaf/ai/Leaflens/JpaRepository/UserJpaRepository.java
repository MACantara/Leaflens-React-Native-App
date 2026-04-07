package leaf.ai.Leaflens.JpaRepository;

import leaf.ai.Leaflens.domain.JpaEntities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {
    UserEntity findByEmail(String email);
}
