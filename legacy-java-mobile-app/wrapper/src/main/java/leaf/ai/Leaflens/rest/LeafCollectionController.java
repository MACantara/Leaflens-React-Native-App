package leaf.ai.Leaflens.rest;

import leaf.ai.Leaflens.domain.Leaf;
import leaf.ai.Leaflens.domain.LeafSavingService;
import leaf.ai.Leaflens.domain.LeafSearchService;
import leaf.ai.Leaflens.rest.dto.LeafCollectionResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/v1/leaf-history")
@CrossOrigin(origins = "*")
public class LeafCollectionController {

    private final LeafSavingService leafSavingService;
    private final LeafSearchService leafSearchService;

    public LeafCollectionController(LeafSavingService leafSavingService, LeafSearchService leafSearchService) {
        this.leafSavingService = leafSavingService;
        this.leafSearchService = leafSearchService;
    }

    @PostMapping("save/{userId}")
    public ResponseEntity<?> saveLeafAnalysis(
            @PathVariable Long userId,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam("commonName") String commonName,
            @RequestParam("scientificName") String scientificName,
            @RequestParam("origin") String origin,
            @RequestParam("uses") String uses,
            @RequestParam("habitat") String habitat,
            @RequestParam("isGrownInCavite") boolean isGrownInCavite,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Image file required");
            }
            LeafAnalysisResponse analysisResponse = new LeafAnalysisResponse(commonName,scientificName,origin,uses,habitat,isGrownInCavite);
            leafSavingService.saveAnalysisToCollection(analysisResponse,userId,imageFile);
            return ResponseEntity.ok().body("Leaf analysis saved successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error saving leaf analysis" + e.getMessage());
        }
    }


    @GetMapping("user/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserHistory(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            return leafSavingService.getUserHistory(userId)
                    .map(LeafCollectionResponse::from)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(()->ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error getting user history: " + e.getMessage());
        }
    }

    @GetMapping("/leaf/{leafId}")
    public ResponseEntity<?> getLeafDetails(
            @PathVariable Long leafId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            Leaf leaf = leafSavingService.getLeafById(leafId);
            if (leaf == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(leaf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error retrieving leaf details: " + e.getMessage());
        }
    }

    @GetMapping("/leaf/{leafId}/image")
    public ResponseEntity<byte[]> getLeafImage(
            @PathVariable Long  leafId,
            @RequestHeader(value = "Authorization", required = false) String authorization
       ) {
        try {
            Leaf leaf = leafSavingService.getLeafById(leafId);
            if (leaf == null || !leaf.hasImage()) {
                return ResponseEntity.notFound().build();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentLength(leaf.getImageSize());
            headers.setContentDispositionFormData("inline", leaf.getImageFilename());

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(leaf.getImageData());

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/leaf/{leafId}")
    public ResponseEntity<?> deleteLeaf(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization",required = false) String authorization) {
        try
        {
            leafSavingService.delete(id);
            return ResponseEntity.ok().body("Leaf deleted");
        } catch (Exception e){
            return ResponseEntity.internalServerError().body("Error deleting leaf:" + e.getMessage());
        }

    }

    @GetMapping("user/{userId}/count")
    public ResponseEntity<?> getUserLeafCount(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization",required = false) String authorization
    ){
        try {
            long count = leafSavingService.getLeafCount(userId);
            return ResponseEntity.ok().body(count);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("user/{userId}/search")
    public ResponseEntity<?> searchLeaves(
            @PathVariable Long userId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<String> tag,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        try {
            List<Leaf> results = leafSearchService.search(userId, keyword, tag);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error searching leaves: " + e.getMessage());
        }
    }

}
