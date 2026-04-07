package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.domain.JpaEntities.UserEntity;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toDomain(UserEntity entity){
        if (entity == null) return null;

        return new User(
                entity.getUserId(),
                entity.getUserName(),
                entity.getEmail(),
                entity.getPassword()
        );
    }

    public UserEntity toEntity(User domain) {
        if (domain == null) return null;

        UserEntity entity = new UserEntity();
        entity.setUserId(domain.getUserId());
        entity.setUserName(domain.getUserName());
        entity.setEmail(domain.getEmail());
        entity.setPassword(domain.getPassword());

        return entity;
    }
}
