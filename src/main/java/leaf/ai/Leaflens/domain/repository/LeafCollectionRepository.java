package leaf.ai.Leaflens.domain.repository;

import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafCollection;

import java.util.List;
import java.util.Optional;

public interface LeafCollectionRepository {
   Optional<LeafCollection> findByUserId(Long userId);
   LeafCollection save(LeafCollection leafCollection);
   long countByUserId(Long userId);
   List<Leaf> searchLeavesByUserIdAndName(Long userId, String name);
   List<Leaf> searchLeavesWithFilters(Long userId, String name, Boolean isGrownInCavite);

}
