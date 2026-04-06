package leaf.ai.Leaflens.domain.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JsonResponseUtil {

    private static final Logger log = LoggerFactory.getLogger(JsonResponseUtil.class);

    public static String cleanJsonResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            return "{}";
        }

        String cleaned = response.trim();
        cleaned = cleaned.replaceAll("^```(?:json)?\\s*\\n?", "");
        cleaned = cleaned.replaceAll("\\n?```\\s*$", "");

        cleaned = cleaned.replaceAll("^`+", "").replaceAll("`+$", "");
        cleaned = cleaned.trim();


        int startIndex = cleaned.indexOf('{');
        int endIndex = cleaned.lastIndexOf('}');

        if (startIndex != -1 && endIndex != -1 && endIndex > startIndex) {
            cleaned = cleaned.substring(startIndex,endIndex + 1);
        }

        if(!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
            log.warn("Response doesn't look like valid JSON after cleaning: {}", cleaned.substring(0, Math.min(100, cleaned.length())));
            return "{}";
        }

        return cleaned;
    }

    public static String extractAnalysisFromResponse(String response, ObjectMapper objectMapper) {

        try {
            String cleaned = cleanJsonResponse(response);
            JsonNode rootNode;

            try {
                rootNode = objectMapper.readTree(cleaned);
            } catch (Exception e) {
                log.error("Failed to parse JSON after cleaning. Original response: {}", response);
                log.error("Cleaned response: {}", cleaned);
                log.error("Parse error: {}", e.getMessage());

                // Return error JSON instead of throwing
                return String.format("""
                    {
                        "scientificName": "Error",
                        "commonName": "Error",
                        "origin": "Error processing image",
                        "uses": "N/A",
                        "habitat": "N/A"
                    }
                    """);
            }

            if (rootNode.has("analysis")) {
                JsonNode analysisNode = rootNode.get("analysis");
                return objectMapper.writeValueAsString(analysisNode);
            }
            return cleaned;
        }
         catch (Exception e) {
            log.debug("Failed to extract analysis from AI response {}", e.getMessage());
            return cleanJsonResponse(response);
        }

    }

}
