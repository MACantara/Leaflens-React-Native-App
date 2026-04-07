package leaf.ai.Leaflens.domain;

import java.io.IOException;

public interface PlantLocationService {

    void loadPlantData() throws IOException;
    void parseContent(String content);

    boolean canBeGrownInLocation(String scientificName, String commonName);
    String getLocationName();

}
