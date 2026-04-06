package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.domain.JpaEntities.LeafEntity;
import leaf.ai.Leaflens.domain.JpaEntities.TagEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LeafMapper {

    public Leaf toDomain(LeafEntity entity) {
        List<String> tags = entity.getTags().stream()
                .map(TagEntity::getName)
                .toList();

        return new Leaf(
                entity.getLeafId(),
                entity.getCommonName(),
                entity.getScientificName(),
                entity.getOrigin(),
                entity.getUsage(),
                entity.getHabitat(),
                entity.getImageData(),
                entity.getImageFilename(),
                entity.getImageContentType(),
                entity.getImageSize(),
                tags
        );
    }

    public LeafEntity toEntity(Leaf domain) {
        if (domain == null) return null;

        LeafEntity entity = new LeafEntity();
        entity.setLeafId(domain.getLeafId());
        entity.setCommonName(domain.getCommonName());
        entity.setScientificName(domain.getScientificName());
        entity.setOrigin(domain.getOrigin());
        entity.setUsage(domain.getUsage());
        entity.setHabitat(domain.getHabitat());
        entity.setImageData(domain.getImageData());
        entity.setImageContentType(domain.getImageContentType());
        entity.setImageFilename(domain.getImageFilename());
        entity.setImageSize(domain.getImageSize());

        return entity;
    }
}
