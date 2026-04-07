package leaf.ai.Leaflens.rest;

import leaf.ai.Leaflens.domain.JpaEntities.LeafReferenceEntity;
import leaf.ai.Leaflens.domain.LeafReferenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/leaves/{leafId}/references")
@CrossOrigin(origins = "*")
public class LeafReferenceController {

    private final LeafReferenceService leafReferenceService;

    public LeafReferenceController(LeafReferenceService leafReferenceService) {
        this.leafReferenceService = leafReferenceService;
    }

    @GetMapping
    public ResponseEntity<?> getReferences(
            @PathVariable Long leafId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            List<LeafReferenceEntity> references = leafReferenceService.getReferences(leafId);
            return ResponseEntity.ok(references);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving references: " + e.getMessage());
        }
    }
}
