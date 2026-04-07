package leaf.ai.Leaflens.domain.repository;

import leaf.ai.Leaflens.domain.JpaEntities.TagEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<TagEntity,Long> {
    Optional<TagEntity> findByNameIgnoreCase(String name);

    @Query(value =
            "SELECT DISTINCT t.* FROM tag t " +
            "JOIN leaf_tag lt ON t.tag_id = lt.tag_id " +
            "JOIN collection_leaf cl ON cl.leaf_id = lt.leaf_id " +
            "JOIN leaf_collection lc ON lc.collection_id = cl.collection_id " +
            "WHERE lc.user_id = :userId " +
            "ORDER BY t.name",
            nativeQuery = true)
    List<TagEntity> findTagsByUserId(@Param("userId") Long userId);
}
