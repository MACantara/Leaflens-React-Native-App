package leaf.ai.Leaflens.domain;


import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PlantLocationRegistry {

    private final Map<String,PlantLocationService> locationServices;

    public PlantLocationRegistry(List<PlantLocationService> services) {
        this.locationServices = services.stream()
                .collect(Collectors.toMap(PlantLocationService::getLocationName,
                       service-> service));
    }

    public boolean canBeGrownIn(String location, String scientificName, String commonName) {
        PlantLocationService service = locationServices.get(location);
        if(service == null){
            return false;
        }
        return service.canBeGrownInLocation(scientificName,commonName);
    }

    public List<String> getAvailableLocations(){
        return List.copyOf(locationServices.keySet());
    }

    public Map<String, Boolean> getLocationAvailability(String scientificName, String commonName) {
        return locationServices.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,entry->entry.getValue().canBeGrownInLocation(scientificName,commonName)
                ));
    }
}
