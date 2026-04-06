package leaf.ai.Leaflens.rest.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record LeafDataWrapper(
        @JsonProperty("Leaf-data") List<LeafCollectionResponse> leafData
) {
}
