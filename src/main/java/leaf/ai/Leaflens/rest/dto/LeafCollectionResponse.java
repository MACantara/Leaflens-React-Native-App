package leaf.ai.Leaflens.rest.dto;

import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafCollection;

import java.time.LocalDateTime;
import java.util.List;

public record LeafCollectionResponse(
        List<Leaf> leafList,
        LocalDateTime createdAt,
        boolean empty,
        int leafCount
) {
   public static LeafCollectionResponse from(LeafCollection leafCollection){
       return new LeafCollectionResponse(leafCollection.getLeafList(),leafCollection.getCreatedAt(),leafCollection.isEmpty(),leafCollection.getLeafCount());
   }

}
