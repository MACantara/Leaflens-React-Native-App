package leaf.ai.Leaflens.domain.JpaEntities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leaf")
public class LeafEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "leaf_id")
    private Long leafId;

    @Column(name = "common_name",nullable = false)
    private String commonName;

    @Column(name = "scientific_name")
    private String scientificName;

    @Column(columnDefinition = "TEXT")
    private String origin;

    @Column(name = "usage" , columnDefinition = "TEXT")
    private String usage;

    @Column(columnDefinition = "TEXT")
    private String habitat;

    // for image
    @Column(name = "image_data", columnDefinition = "BYTEA")
    private byte[] imageData;

    @Column(name = "image_filename")
    private String imageFilename;

    @Column(name = "image_content_type")
    private String imageContentType;

    @Column(name = "image_size")
    private Long imageSize;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "leaf_tag",
            joinColumns = @JoinColumn(name = "leaf_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<TagEntity> tags = new ArrayList<>();

    @OneToMany(mappedBy = "leaf", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LeafReferenceEntity> references = new ArrayList<>();


    public LeafEntity() {
    }

    public LeafEntity(String commonName, String scientificName, String origin, String usage, String habitat) {
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.origin = origin;
        this.usage = usage;
        this.habitat = habitat;
    }

    public LeafEntity(String commonName, String scientificName, String origin, String usage, String habitat, byte[] imageData, String imageFilename, String imageContentType, Long imageSize) {
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.origin = origin;
        this.usage = usage;
        this.habitat = habitat;
        this.imageData = imageData;
        this.imageFilename = imageFilename;
        this.imageContentType = imageContentType;
        this.imageSize = imageSize;
    }

    public LeafEntity(Long leafId, String commonName, String scientificName, String origin, String usage, String habitat, byte[] imageData, String imageFilename, String imageContentType, Long imageSize) {
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
    }


    public void setLeafId(Long leafId) {
        this.leafId = leafId;
    }

    public Long getLeafId() {
        return leafId;
    }

    public String getCommonName() {
        return commonName;
    }

    public void setCommonName(String commonName) {
        this.commonName = commonName;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getScientificName() {
        return scientificName;
    }

    public void setScientificName(String scientificName) {
        this.scientificName = scientificName;
    }

    public String getUsage() {
        return usage;
    }

    public void setUsage(String usage) { this.usage = usage; }

    public String getHabitat() {
        return habitat;
    }

    public void setHabitat(String habitat) {
        this.habitat = habitat;
    }

    public byte[] getImageData() {
        return imageData;
    }

    public void setImageData(byte[] imageData) {
        this.imageData = imageData;
    }

    public String getImageFilename() {
        return imageFilename;
    }

    public void setImageFilename(String imageFilename) { this.imageFilename = imageFilename; }

    public String getImageContentType() { return imageContentType; }

    public void setImageContentType(String imageContentType) { this.imageContentType = imageContentType; }

    public Long getImageSize() {
        return imageSize;
    }

    public void setImageSize(Long imageSize) {
        this.imageSize = imageSize;
    }

    public List<TagEntity> getTags() { return tags; }

    public void setTags(List<TagEntity> tags) { this.tags = tags; }

    public List<LeafReferenceEntity> getReferences() { return references; }

    public void setReferences(List<LeafReferenceEntity> references) { this.references = references; }

}
