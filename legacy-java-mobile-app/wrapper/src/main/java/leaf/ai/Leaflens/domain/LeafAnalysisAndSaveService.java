package leaf.ai.Leaflens.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import leaf.ai.Leaflens.domain.constants.PromptConstants;
import leaf.ai.Leaflens.domain.utils.JsonResponseUtil;
import leaf.ai.Leaflens.rest.LeafAnalysisResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LeafAnalysisAndSaveService {

    private static final Logger log = LoggerFactory.getLogger(LeafAnalysisAndSaveService.class);
    private final LeafAnalysis leafAnalysis;
    private final LeafSavingService leafSavingService;
    private final ObjectMapper objectMapper;


    public LeafAnalysisAndSaveService(LeafAnalysis leafAnalysis, LeafSavingService leafSavingService, ObjectMapper objectMapper) {
        this.leafAnalysis = leafAnalysis;
        this.leafSavingService = leafSavingService;
        this.objectMapper = objectMapper;
    }

    public LeafAnalysisResponse analyzeLeaf(MultipartFile imageFile, Long userId, boolean autoSave) {
        try {
            if (imageFile.isEmpty()) {
                throw new IllegalArgumentException("Image is empty");
            }

            LeafAnalysisResponse leafAnalysisResponse = performAnalysis(imageFile);
            if (autoSave && userId != null) {
                try {
                leafSavingService.saveAnalysisToCollection(leafAnalysisResponse,userId,imageFile);
            } catch (Exception e) {
                    log.error("Failed to auto-save leaf analysis for user " + userId + ": " + e.getMessage());
                }
            }
            return leafAnalysisResponse;
        } catch (Exception e) {
            return new LeafAnalysisResponse(
                    "Error",
                    "Error processing image",
                    "Error: " + e.getMessage(),
                    "N/A",
                    "N/A",
                    false
            );
        }
    }

    // with save
    public LeafAnalysisResponse analyzeLeaf(MultipartFile imageFile, Long userId) {
        return analyzeLeaf(imageFile, userId,true);
    }

    //without save
    public LeafAnalysisResponse analyzeLeafOnly(MultipartFile imageFile) {
        return analyzeLeaf(imageFile, null, false);
    }


    private LeafAnalysisResponse performAnalysis(MultipartFile imageFile) throws Exception {

        String analysisJson = leafAnalysis.identifyLeaf(imageFile,PromptConstants.LEAF_ANALYSIS_PROMPT);
        log.debug("JSON received from GeminiAnalyzerService: {}", analysisJson);

        try {
            LeafAnalysisResponse response = objectMapper.readValue(analysisJson, LeafAnalysisResponse.class);
            log.debug("Parsed LeafAnalysisResponse: {}", response);
            return response;
        } catch (Exception e){
            log.error("Failed to parse extracted JSON: {}", e.getMessage());
            log.error("JSON that failed to parse: {}", analysisJson);
            throw new RuntimeException("Failed to parse analysis response", e);
        }

    }
}
