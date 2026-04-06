package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.rest.LeafAnalysisResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

public class Leaf {
    private final Long leafId;
    private final String commonName;
    private final String scientificName;
    private final String origin;
    private final String usage;
    private final String habitat;
    private final byte[] imageData;
    private final String imageFilename;
    private final String imageContentType;
    private final Long imageSize;
    private final List tags;

    public Leaf(LeafAnalysisResponse analysisResponse, MultipartFile imageFile) throws Exception {
        this(null,
                analysisResponse.getCommonName(),
                analysisResponse.getScientificName(),
                analysisResponse.getOrigin(),
                analysisResponse.getUses(),
                analysisResponse.getHabitat(),
                imageFile.getBytes(),
                imageFile.getOriginalFilename(),
                imageFile.getContentType(),
                imageFile.getSize(),
                analysisResponse.getTags());
    }

    public Leaf(Long leafId, String commonName, String scientificName, String origin,
                String usage, String habitat, byte[] imageData, String imageFilename, String imageContentType,
                Long imageSize, List<String> tags) {
        this.leafId = leafId;
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.origin = origin;
        this.usage = usage;
        this.habitat = habitat;
        this.imageData = imageData;
        this.imageFilename = imageFilename;
        this.imageContentType = imageContentType;
        this.imageSize = imageSize;
        this.tags = tags != null ? tags : new ArrayList<>();

    }

    public boolean isValidLeaf() {
        return commonName != null && !commonName.trim().isEmpty() &&
                scientificName != null && !scientificName.trim().isEmpty();
    }

    public boolean hasImage() {
        return imageSize != null && imageSize > 0 && imageData != null && imageData.length > 0;
    }

    public boolean isImageSizeValid(long maxSizeInBytes){
        return imageSize != null && imageSize <= maxSizeInBytes;
    }

    public boolean isValidImageType() {
        if (imageContentType == null) return false;
        return imageContentType.startsWith("image/") &&
                (imageContentType.equals("image/jpeg") ||
                        imageContentType.equals("image/png") ||
                        imageContentType.equals("image/gif") ||
                        imageContentType.equals("image/webp"));
    }


    public Long getLeafId() {
        return leafId;
    }

    public String getCommonName() {
        return commonName;
    }

    public String getScientificName() {
        return scientificName;
    }

    public String getOrigin() {
        return origin;
    }

    public String getUsage() {
        return usage;
    }

    public String getHabitat() {
        return habitat;
    }

    public byte[] getImageData() {
        return imageData;
    }

    public String getImageFilename() {
        return imageFilename;
    }


    public String getImageContentType() {
        return imageContentType;
    }

    public Long getImageSize() {
        return imageSize;
    }

    public List<String> getTags() { return tags; }
}
