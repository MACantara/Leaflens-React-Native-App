package leaf.ai.Leaflens.AiImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import leaf.ai.Leaflens.domain.LeafAnalysis;
import leaf.ai.Leaflens.domain.PlantLocationRegistry;
import leaf.ai.Leaflens.domain.PlantLocationService;
import leaf.ai.Leaflens.domain.utils.JsonResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.content.Media;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;
@Service
public class GeminiAnalyzerService implements LeafAnalysis {

    private static final Logger log = LoggerFactory.getLogger(GeminiAnalyzerService.class);

    private final ChatClient chatClient;
    private final PlantLocationRegistry locationRegistry;
    private final ObjectMapper objectMapper;


    public GeminiAnalyzerService(ChatClient.Builder builder,
                                 PlantLocationRegistry plantLocationRegistry,
                                 ObjectMapper objectMapper
                                 ) {
        this.chatClient = builder.build();
        this.locationRegistry = plantLocationRegistry;
        this.objectMapper = objectMapper;
    }
    @Override
    public String identifyLeaf(MultipartFile imageFile, String prompt) throws Exception {
        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Invalid image file type: " + contentType);
        }

        var media = new Media(MimeTypeUtils.parseMimeType(contentType),imageFile.getResource());

        String aiResponse = chatClient.prompt()
                .user(userSpec -> userSpec
                        .text(prompt)
                        .media(media))
                .call()
                .content();
        
        String cleanedResponse = JsonResponseUtil.extractAnalysisFromResponse(aiResponse, objectMapper);
        ObjectNode jsonResponse = (ObjectNode) objectMapper.readTree(cleanedResponse);

        String scientificName = jsonResponse.get("scientificName").asText();
        String commonName = jsonResponse.get("commonName").asText();

        boolean isGrownInCavite = locationRegistry.canBeGrownIn("Cavite", scientificName, commonName);
        jsonResponse.put("isGrownInCavite", isGrownInCavite);

        return objectMapper.writeValueAsString(jsonResponse);

    }
}
