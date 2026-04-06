package leaf.ai.Leaflens.JpaRepository;

import leaf.ai.Leaflens.domain.JpaEntities.LeafCollectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeafCollectionJpaRepository extends JpaRepository<LeafCollectionEntity, Long> {
  Optional<LeafCollectionEntity> findByUserUserId(Long userId);
  long countByUserUserId(Long userId);
}
