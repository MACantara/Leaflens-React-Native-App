
package leaf.ai.Leaflens.domain;

import jakarta.persistence.EntityManager;
import leaf.ai.Leaflens.domain.JpaEntities.LeafCollectionEntity;
import leaf.ai.Leaflens.domain.JpaEntities.LeafEntity;
import leaf.ai.Leaflens.domain.JpaEntities.UserEntity;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
public class LeafCollectionMapper {

    private final UserMapper userMapper;
    private final LeafMapper leafMapper;
    private final EntityManager entityManager;

    public LeafCollectionMapper(UserMapper userMapper, LeafMapper leafMapper, EntityManager entityManager){
        this.userMapper = userMapper;
        this.leafMapper = leafMapper;
        this.entityManager = entityManager;
    }

    public LeafCollection toDomain(LeafCollectionEntity entity) {
        if (entity == null) return null;

        return new LeafCollection(
                entity.getCollectionId(),
                userMapper.toDomain(entity.getUser()),
                entity.getLeafList() != null ? entity.getLeafList().stream()
                        .map(leafMapper::toDomain)
                        .collect(Collectors.toList()): null,
                entity.getCreatedAt()
        );
    }

    public LeafCollectionEntity toEntity(LeafCollection domain) {
        if (domain == null) return null;

        LeafCollectionEntity entity = new LeafCollectionEntity();

        if(domain.getCollectionId() != null){
            entity.setCollectionId(domain.getCollectionId());
        }
        entity.setUser(entityManager.getReference(UserEntity.class,domain.getUser().getUserId()));
        entity.setLeafList(
                domain.getLeafList()!= null ? domain.getLeafList().stream()
                        .map(leaf -> entityManager.getReference(LeafEntity.class,leaf.getLeafId()))
                        .collect(Collectors.toList()) : Collections.emptyList()
        );
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
