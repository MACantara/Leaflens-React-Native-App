package leaf.ai.Leaflens.JpaRepository;

import leaf.ai.Leaflens.domain.JpaEntities.LeafEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeafJpaRepository extends JpaRepository<LeafEntity, Long> {
    LeafEntity findByCommonName(String commonName);

    @Query("SELECT DISTINCT l FROM LeafCollectionEntity c " +
            "JOIN c.leafEntityList l " +
            "WHERE c.user.userId = :userId AND " +
            "(LOWER(l.scientificName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(l.commonName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<LeafEntity> searchByUserIdAndName(
            @Param("userId") Long userId,
            @Param("searchTerm") String searchTerm
    );


    // for future purpose
    @Query("SELECT DISTINCT l FROM LeafCollectionEntity c " +
            "JOIN c.leafEntityList l " +
            "WHERE c.user.userId = :userId AND " +
            "(:searchTerm IS NULL OR " +
            "LOWER(l.scientificName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(l.commonName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(l.origin) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(l.habitat) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<LeafEntity> searchWithFilters(
            @Param("userId") Long userId,
            @Param("searchTerm") String searchTerm,
            @Param("isGrownInCavite") Boolean isGrownInCavite
    );

    @Query(value =
            "SELECT DISTINCT l.* FROM leaf_collection lc " +
            "JOIN collection_leaf cl ON lc.collection_id = cl.collection_id " +
            "JOIN leaf l ON l.leaf_id = cl.leaf_id " +
            "WHERE lc.user_id = :userId " +
            "AND (CAST(:keyword AS TEXT) IS NULL OR " +
            "lower(l.common_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.scientific_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.origin) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.usage) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.habitat) LIKE lower('%' || CAST(:keyword AS TEXT) || '%'))",
            nativeQuery = true)
    List<LeafEntity> searchLeaves(
            @Param("userId") Long userId,
            @Param("keyword") String keyword
    );

    @Query(value =
            "SELECT DISTINCT l.* FROM leaf_collection lc " +
            "JOIN collection_leaf cl ON lc.collection_id = cl.collection_id " +
            "JOIN leaf l ON l.leaf_id = cl.leaf_id " +
            "WHERE lc.user_id = :userId " +
            "AND (CAST(:keyword AS TEXT) IS NULL OR " +
            "lower(l.common_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.scientific_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.origin) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.usage) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.habitat) LIKE lower('%' || CAST(:keyword AS TEXT) || '%')) " +
            "AND EXISTS (SELECT 1 FROM leaf_tag lt " +
            "JOIN tag t ON t.tag_id = lt.tag_id " +
            "WHERE lower(t.name) IN (:tags) AND l.leaf_id = lt.leaf_id)",
            nativeQuery = true)
    List<LeafEntity> searchLeavesWithTags(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            @Param("tags") List<String> tags
    );

    @Query(value =
            "SELECT l.* FROM leaf l " +
            "WHERE (CAST(:keyword AS TEXT) IS NULL OR " +
            "lower(l.common_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.scientific_name) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.origin) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.usage) LIKE lower('%' || CAST(:keyword AS TEXT) || '%') OR " +
            "lower(l.habitat) LIKE lower('%' || CAST(:keyword AS TEXT) || '%'))",
            nativeQuery = true)
    List<LeafEntity> exploreLeaves(@Param("keyword") String keyword);
}
