package leaf.ai.Leaflens.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import leaf.ai.Leaflens.domain.LeafAnalysis;
import leaf.ai.Leaflens.domain.LeafAnalysisAndSaveService;
import leaf.ai.Leaflens.domain.User;
import leaf.ai.Leaflens.domain.utils.JsonResponseUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("api/v1/leaf-analyzer")
public class LeafAnalyzerController {

    private final LeafAnalysis leafAnalysis;
    private final ObjectMapper objectMapper;
    private final LeafAnalysisAndSaveService leafAnalysisAndSaveService;

    public LeafAnalyzerController(LeafAnalysis leafAnalysis, ObjectMapper objectMapper, LeafAnalysisAndSaveService leafAnalysisAndSaveService) {
        this.leafAnalysis = leafAnalysis;
        this.objectMapper = objectMapper;
        this.leafAnalysisAndSaveService = leafAnalysisAndSaveService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<LeafAnalysisResponse> identifyLeaf(@RequestParam("image") MultipartFile imageFile) {
        try {
            if (imageFile.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            LeafAnalysisResponse analysisResponse = leafAnalysisAndSaveService.analyzeLeafOnly(imageFile);

            return ResponseEntity.ok(analysisResponse);

        } catch (Exception e) {
           LeafAnalysisResponse errorResponse = new LeafAnalysisResponse(
                   "Error",
                   "Error processing image",
                   "Error: " + e.getMessage(),
                   "N/A",
                   "N/A",
                   false
           );
           return ResponseEntity.internalServerError().body(errorResponse);
        }

    }

    @PostMapping("/analyze-save/{userId}")
    public ResponseEntity<?> analyzeAndSaveLeaf(
            @PathVariable Long userId,
            @RequestParam("leaf-image") MultipartFile imageFile,
            Authentication authentication
    ) {
       try {

           User authenticatedUser = (User) authentication.getPrincipal();

           if (!authenticatedUser.getUserId().equals(userId)) {
               return ResponseEntity.status(403)
                       .body(Map.of("error", "You can only save to your own collection"));
           }

           if(imageFile.isEmpty()) {
               return ResponseEntity.badRequest()
                       .body(Map.of("error", "Image file is required"));
           }
           LeafAnalysisResponse analysisResponse = leafAnalysisAndSaveService.analyzeLeaf(imageFile,userId);

           return ResponseEntity.ok(Map.of(
                   "message","Leaf analyzed and saved successfully",
                   "analysis",analysisResponse,
                   "userId",userId
           ));
       } catch (Exception e) {
           return ResponseEntity.internalServerError()
                   .body(Map.of(
                           "error","Error analyzing leaf",
                           "details", e.getMessage()
                   ));
       }
    }


}

