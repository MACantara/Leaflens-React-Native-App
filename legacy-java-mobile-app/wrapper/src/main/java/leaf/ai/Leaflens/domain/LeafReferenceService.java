package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.JpaRepository.LeafReferenceJpaRepository;
import leaf.ai.Leaflens.domain.JpaEntities.LeafEntity;
import leaf.ai.Leaflens.domain.JpaEntities.LeafReferenceEntity;
import leaf.ai.Leaflens.JpaRepository.LeafJpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeafReferenceService {

    private final LeafReferenceJpaRepository referenceRepository;
    private final LeafJpaRepository leafJpaRepository;

    public LeafReferenceService(LeafReferenceJpaRepository referenceRepository,
                                LeafJpaRepository leafJpaRepository) {
        this.referenceRepository = referenceRepository;
        this.leafJpaRepository = leafJpaRepository;
    }

    @Transactional
    public LeafReferenceEntity addReference(Long leafId, String url, String title) {
        LeafEntity leaf = leafJpaRepository.findById(leafId)
                .orElseThrow(() -> new RuntimeException("Leaf not found with ID: " + leafId));
        return referenceRepository.save(new LeafReferenceEntity(leaf, url, title));
    }

    @Transactional(readOnly = true)
    public List<LeafReferenceEntity> getReferences(Long leafId) {
        return referenceRepository.findByLeaf_LeafId(leafId);
    }
}
