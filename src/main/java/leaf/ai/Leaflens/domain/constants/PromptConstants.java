package leaf.ai.Leaflens.domain.constants;

public final class PromptConstants {

    private PromptConstants() {
    }

    public static final String LEAF_ANALYSIS_PROMPT =
            """
            Analyze this leaf image and provide the information in the following JSON format.
            IMPORTANT: Return ONLY the raw JSON object. Do NOT include markdown code blocks, backticks, or any explanation text.
            Required format:
            {
             "scientificName": "scientific name here",
             "commonName": "common name here",
             "origin": "origin information here",
             "uses": "uses and benefits here",
             "habitat": "where it usually grows with specific location details",
             "tags": ["Tag1", "Tag2", "Tag3"],
             "references": [
               {"url": "https://...", "title": "Source title here"},
               {"url": "https://...", "title": "Source title here"}
             ]
            }
            For "tags", generate 2–5 short category labels that describe this plant's primary uses.
            Examples: "Medicinal", "Culinary", "Anti-inflammatory", "Immune Booster", "Skin Care",
            "Aromatic", "Anti-diabetic", "Ornamental". Use your own judgment based on the plant.
            For "references", provide 2–3 real, publicly accessible URLs from reputable sources such as
            Wikipedia, USDA Plants Database, Kew Gardens, or academic databases. Each must have a "url" and a "title".
            Return only valid JSON with these exact 7 fields, nothing else.
            """;
}
