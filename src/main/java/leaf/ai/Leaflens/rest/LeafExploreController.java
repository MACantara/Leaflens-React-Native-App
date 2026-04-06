package leaf.ai.Leaflens.rest;

import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafSavingService;
import leaf.ai.Leaflens.domain.LeafSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/leaves")
@CrossOrigin(origins = "*")
public class LeafExploreController {

    private final LeafSearchService leafSearchService;
    private final LeafSavingService leafSavingService;

    public LeafExploreController(LeafSearchService leafSearchService, LeafSavingService leafSavingService) {
        this.leafSearchService = leafSearchService;
        this.leafSavingService = leafSavingService;
    }

    @GetMapping("/explore")
    public ResponseEntity<?> explore(
            @RequestParam(required = false) String keyword,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            List<Leaf> results = leafSearchService.explore(keyword);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error exploring leaves: " + e.getMessage());
        }
    }

    @PostMapping("/explore/{leafId}/save/{userId}")
    public ResponseEntity<?> saveExploreLeafToCollection(
            @PathVariable Long leafId,
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            leafSavingService.saveToCollection(userId, leafId);
            return ResponseEntity.ok("Leaf saved to collection");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error saving leaf: " + e.getMessage());
        }
    }
}
