package leaf.ai.Leaflens.domain;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;



@Service
public class CavitePlantLocationService implements PlantLocationService{

    private static final Logger log = LoggerFactory.getLogger(CavitePlantLocationService.class);
    private Set<String> scientificNames;
    private Set<String> commonNames;
    private static final String LOCATION = "Cavite";

    @PostConstruct
    @Override
    public void loadPlantData() throws IOException {

        try {
            scientificNames = new HashSet<>();
            commonNames = new HashSet<>();

            var resource = getClass().getClassLoader().getResourceAsStream("cavite-plants.txt");

            if(resource == null){
                log.error("Could not find cavite-plants.txt in classpath");
                return;
            }

            String content = new String(resource.readAllBytes());
            parseContent(content);

            log.info("Loaded {} scientific names and {} common names from file",
                    scientificNames.size(), commonNames.size());
            log.debug("Scientific names: {}", scientificNames);
            log.debug("Common names: {}", commonNames);


        } catch (Exception e) {
            log.error("Error loading Cavite plant data",e);
            scientificNames = new HashSet<>();
            commonNames = new HashSet<>();
        }

    }



    @Override
    public void parseContent(String content) {

        Pattern scientificPattern = Pattern.compile("Scientific name:\\s*(.+?)\\n");
        Matcher scientificMatcher = scientificPattern.matcher(content);
        while (scientificMatcher.find()) {
            String name = scientificMatcher.group(1).trim().toLowerCase();
            scientificNames.add(name);
            log.debug("Added scientific name: {}", name);
        }

        Pattern commonPattern = Pattern.compile("\\d+\\.\\s+(.+?)\\n");
        Matcher commonMatcher = commonPattern.matcher(content);
        while (commonMatcher.find()) {
            String name = commonMatcher.group(1).trim().toLowerCase();
            commonNames.add(name);
            log.debug("Added common name: {}", name);
        }

    }

    @Override
    public boolean canBeGrownInLocation(String scientificName, String commonName) {
        if(scientificNames == null || commonNames == null){
            log.warn("Plant data not loaded properly");
            return false;
        }

        String sciNameLower = scientificName.trim().toLowerCase();
        String commonNameLower = commonName.trim().toLowerCase();

        if(scientificNames.contains(sciNameLower) || commonNames.contains(commonNameLower)){
            return true;
        }
        for (String storedSciName :scientificNames){
            if(sciNameLower.startsWith(storedSciName) || storedSciName.startsWith(sciNameLower)) {
                log.debug("Matched {} with {} (partial scientific name)", scientificName, storedSciName);
                return true;
            }
        }

        String[] commonNameParts = commonNameLower.split(",");
        for (String part:commonNameParts){
            String trimmedPart = part.trim();
            if(commonNames.contains(trimmedPart)) {
                log.debug("Matched {} with stored common name", trimmedPart);
                return true;
            }
        }
        for (String storedCommonName:commonNames) {
            if(commonNameLower.contains(storedCommonName)) {
                log.debug("Matched {} contains stored name {}", commonName, storedCommonName);
                return true;
            }
        }
        log.debug("No match found for {} / {}", scientificName, commonName);
        return false;
    }

    @Override
    public String getLocationName() {
        return LOCATION;
    }


}
