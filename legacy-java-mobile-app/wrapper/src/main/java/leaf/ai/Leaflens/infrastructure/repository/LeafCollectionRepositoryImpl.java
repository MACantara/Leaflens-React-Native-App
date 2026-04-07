package leaf.ai.Leaflens.infrastructure.repository;

import leaf.ai.Leaflens.JpaRepository.LeafCollectionJpaRepository;
import leaf.ai.Leaflens.JpaRepository.LeafJpaRepository;
import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafCollection;
import leaf.ai.Leaflens.domain.LeafCollectionMapper;
import leaf.ai.Leaflens.domain.LeafMapper;
import leaf.ai.Leaflens.domain.repository.LeafCollectionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public class LeafCollectionRepositoryImpl implements LeafCollectionRepository {

    private final LeafCollectionJpaRepository jpaRepository;
    private final LeafCollectionMapper mapper;
    private final LeafJpaRepository leafJpaRepository;
    private final LeafMapper leafMapper;

    public LeafCollectionRepositoryImpl(LeafCollectionJpaRepository jpaRepository,
                                        LeafCollectionMapper mapper,
                                        LeafJpaRepository leafJpaRepository,
                                        LeafMapper leafMapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.leafJpaRepository = leafJpaRepository;
        this.leafMapper = leafMapper;
    }

    @Override
    public Optional<LeafCollection> findByUserId(Long userId) {
        return jpaRepository.findByUserUserId(userId)
                .map(mapper::toDomain);
    }

    @Override
    public LeafCollection save(LeafCollection leafCollection) {
        var entity = mapper.toEntity(leafCollection);
        var savedEntity = jpaRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public long countByUserId(Long userId) {
        return jpaRepository.countByUserUserId(userId);

    }

    @Override
    public List<Leaf> searchLeavesByUserIdAndName(Long userId, String name) {
        return leafJpaRepository.searchByUserIdAndName(userId,name)
                .stream().map(leafMapper::toDomain).toList();
    }

    @Override
    public List<Leaf> searchLeavesWithFilters(Long userId, String name, Boolean isGrownInCavite) {
        return leafJpaRepository.searchWithFilters(userId,name,isGrownInCavite)
                .stream().map(leafMapper::toDomain).toList();
    }


}
