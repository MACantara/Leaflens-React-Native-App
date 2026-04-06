package leaf.ai.Leaflens.domain.repository;

import leaf.ai.Leaflens.domain.Leaf;

import java.util.List;
import java.util.Optional;

public interface LeafRepository {
    Optional<Leaf> findById(Long leafId);
    Optional<Leaf> findByCommonName(String commonName);
    Leaf save(Leaf leaf);
    void delete(Leaf leaf);
    List<Leaf> search(Long userId, String keyword, List<String> tags);
    List<Leaf> explore(String keyword);
}
