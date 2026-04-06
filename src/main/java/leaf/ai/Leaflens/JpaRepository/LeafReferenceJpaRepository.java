package leaf.ai.Leaflens.JpaRepository;

import leaf.ai.Leaflens.domain.JpaEntities.LeafReferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeafReferenceJpaRepository extends JpaRepository<LeafReferenceEntity, Long> {
    List<LeafReferenceEntity> findByLeaf_LeafId(Long leafId);
}
