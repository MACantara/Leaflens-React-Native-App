package leaf.ai.Leaflens.infrastructure.repository;

import leaf.ai.Leaflens.JpaRepository.LeafJpaRepository;
import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafMapper;
import leaf.ai.Leaflens.domain.JpaEntities.LeafEntity;
import leaf.ai.Leaflens.domain.JpaEntities.TagEntity;
import leaf.ai.Leaflens.domain.repository.LeafRepository;
import leaf.ai.Leaflens.domain.repository.TagRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class LeafRepositoryImpl implements LeafRepository {

    private final LeafJpaRepository jpaRepository;
    private final LeafMapper mapper;
    private final TagRepository tagRepository;

    public LeafRepositoryImpl(LeafJpaRepository jpaRepository, LeafMapper mapper, TagRepository tagRepository) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.tagRepository = tagRepository;
    }

    @Override
    public Optional<Leaf> findById(Long leafId) {
        return jpaRepository.findById(leafId)
                .map(mapper::toDomain);
    }

    @Override
    public Optional<Leaf> findByCommonName(String commonName) {
        return Optional.ofNullable(jpaRepository.findByCommonName(commonName))
                .map(mapper::toDomain);
    }

    @Override
    public Leaf save(Leaf leaf) {
        var entity = mapper.toEntity(leaf);

        List<TagEntity> tagEntities = leaf.getTags().stream()
                .map(name -> tagRepository.findByNameIgnoreCase(name)
                        .orElseGet(() -> tagRepository.save(new TagEntity(name))))
                .toList();
        entity.setTags(tagEntities);

        var savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public void delete(Leaf leaf) {
      var entity = mapper.toEntity(leaf);
      jpaRepository.delete(entity);
    }

    @Override
    public List<Leaf> explore(String keyword) {
        return jpaRepository.exploreLeaves(keyword)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<Leaf> search(Long userId, String keyword, List<String> tags) {
        List<LeafEntity> results;
        if (tags == null || tags.isEmpty()) {
            results = jpaRepository.searchLeaves(userId, keyword);
        } else {
            List<String> lowercasedTags = tags.stream().map(String::toLowerCase).toList();
            results = jpaRepository.searchLeavesWithTags(userId, keyword, lowercasedTags);
        }
        return results.stream().map(mapper::toDomain).toList();
    }
}
