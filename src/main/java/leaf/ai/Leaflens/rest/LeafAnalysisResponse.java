package leaf.ai.Leaflens.rest;


import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Collections;
import java.util.List;



public class LeafAnalysisResponse {

    public static class Reference {
        @JsonProperty("url")
        private String url;
        @JsonProperty("title")
        private String title;

        public Reference() {}
        public String getUrl() { return url; }
        public String getTitle() { return title; }
        public void setUrl(String url) { this.url = url; }
        public void setTitle(String title) { this.title = title; }
    }


    @JsonProperty("commonName")
    private String commonName;

    @JsonProperty("scientificName")
    private String scientificName;

    @JsonProperty("origin")
    private String origin;

    @JsonProperty("uses")
    private String uses;

    @JsonProperty("habitat")
    private String habitat;

    @JsonProperty("isGrownInCavite")
    private boolean isGrownInCavite;

    @JsonProperty("tags")
    private List<String> tags;

    @JsonProperty("references")
    private List<Reference> references;

    public LeafAnalysisResponse() {}

    public LeafAnalysisResponse(String commonName, String scientificName, String origin, String uses, String habitat, boolean isGrownInCavite) {
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.origin = origin;
        this.uses = uses;
        this.habitat = habitat;
        this.isGrownInCavite = isGrownInCavite;
    }


    public String getScientificName() {
        return scientificName;
    }

    public String getOrigin() {
        return origin;
    }

    public String getCommonName() { return commonName; }

    public String getUses() { return uses;}

    public String getHabitat() { return habitat; }

    public void setCommonName(String commonName) {
        this.commonName = commonName;
    }

    public void setScientificName(String scientificName) {
        this.scientificName = scientificName;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public void setUses(String uses) {
        this.uses = uses;
    }

    public void setHabitat(String habitat) {
        this.habitat = habitat;
    }

    @JsonProperty("isGrownInCavite")
    public boolean isGrownInCavite() {
        return isGrownInCavite;
    }

    @JsonProperty("isGrownInCavite")
    public void setIsGrownInCavite(boolean isGrownInCavite) {
        this.isGrownInCavite = isGrownInCavite;
    }

    public List<String> getTags() {
        return tags != null ? tags : Collections.emptyList();
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<Reference> getReferences() {
        return references != null ? references : Collections.emptyList();
    }

    public void setReferences(List<Reference> references) {
        this.references = references;
    }

    @Override
    public String toString() {
        return "LeafAnalysisResponse{" +
                "commonName='" + commonName + '\'' +
                ", scientificName='" + scientificName + '\'' +
                ", origin='" + origin + '\'' +
                ", uses='" + uses + '\'' +
                ", habitat='" + habitat + '\'' +
                ", isGrownInCavite='" + isGrownInCavite + '\'' +
                '}';
    }

}
