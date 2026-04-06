package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.domain.repository.LeafRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeafSearchService {

    private final LeafRepository leafRepository;

    public LeafSearchService(LeafRepository leafRepository) {
        this.leafRepository = leafRepository;
    }

    @Transactional(readOnly = true)
    public List<Leaf> explore(String keyword) {
        String trimmedKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return leafRepository.explore(trimmedKeyword);
    }

    @Transactional(readOnly = true)
    public List<Leaf> search(Long userId, String keyword, List<String> tags) {
        String trimmedKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        List<String> trimmedTags = (tags != null)
                ? tags.stream().filter(t -> t != null && !t.isBlank()).map(String::trim).toList()
                : List.of();
        return leafRepository.search(userId, trimmedKeyword, trimmedTags);
    }
}
