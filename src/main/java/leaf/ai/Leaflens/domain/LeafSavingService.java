package leaf.ai.Leaflens.domain;

import leaf.ai.Leaflens.domain.repository.LeafCollectionRepository;
import leaf.ai.Leaflens.domain.repository.LeafRepository;
import leaf.ai.Leaflens.rest.LeafAnalysisResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;


@Service
public class LeafSavingService {

    private final LeafRepository leafRepository;
    private final LeafCollectionRepository leafCollectionRepository;
    private final UserService userService;
    private final LeafReferenceService leafReferenceService;

    public LeafSavingService(LeafRepository leafRepository,
                             LeafCollectionRepository leafCollectionRepository,
                             UserService userService,
                             LeafReferenceService leafReferenceService) {
        this.leafRepository = leafRepository;
        this.leafCollectionRepository = leafCollectionRepository;
        this.userService = userService;
        this.leafReferenceService = leafReferenceService;
    }
    @Transactional
    public void saveAnalysisToCollection(LeafAnalysisResponse analysisResponse, Long userId, MultipartFile imageFile) {

        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID:" + userId));

                Leaf leaf = new Leaf(analysisResponse, imageFile);

                if (!leaf.isValidLeaf()) {
                    throw new RuntimeException("Invalid leaf data");
                }
                Leaf savedLeaf = leafRepository.save(leaf);

                analysisResponse.getReferences().forEach(ref ->
                        leafReferenceService.addReference(savedLeaf.getLeafId(), ref.getUrl(), ref.getTitle()));

                Optional<LeafCollection> existingCollections = leafCollectionRepository.findByUserId(userId);

                if (existingCollections.isEmpty()){
                    LeafCollection newCollection = new LeafCollection(user,List.of(savedLeaf));
                    leafCollectionRepository.save(newCollection);
                } else {
                    LeafCollection existingCollection = existingCollections.get();
                    List<Leaf> updatedLeafList = new ArrayList<>(existingCollection.getLeafList());
                    updatedLeafList.add(savedLeaf);

                    LeafCollection updatedCollection = new LeafCollection(
                            existingCollection.getCollectionId(),
                            user,
                            updatedLeafList,
                            existingCollection.getCreatedAt()
                    );
                    leafCollectionRepository.save(updatedCollection);
                }

            } catch(Exception e){
                throw new RuntimeException("Error saving analysis to history: " + e.getMessage(), e);
            }


        }

    @Transactional(readOnly = true)
    public Optional<LeafCollection> getUserHistory(Long userId) {
        return leafCollectionRepository.findByUserId(userId);
    }

    public Leaf getLeafById(Long leafId) {
        return leafRepository.findById(leafId).orElse(null);
    }

    public long getLeafCount(Long userId){
        return leafCollectionRepository.countByUserId(userId);
    }

    @Transactional
    public void saveToCollection(Long userId, Long leafId) {
        try {
            User user = userService.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            Leaf leaf = leafRepository.findById(leafId)
                    .orElseThrow(() -> new RuntimeException("Leaf not found with ID: " + leafId));

            Optional<LeafCollection> existingCollection = leafCollectionRepository.findByUserId(userId);

            if (existingCollection.isEmpty()) {
                leafCollectionRepository.save(new LeafCollection(user, List.of(leaf)));
            } else {
                LeafCollection collection = existingCollection.get();
                boolean alreadySaved = collection.getLeafList().stream()
                        .anyMatch(l -> l.getLeafId().equals(leafId));
                if (alreadySaved) return;

                List<Leaf> updatedLeafList = new ArrayList<>(collection.getLeafList());
                updatedLeafList.add(leaf);
                leafCollectionRepository.save(new LeafCollection(
                        collection.getCollectionId(),
                        user,
                        updatedLeafList,
                        collection.getCreatedAt()
                ));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error saving leaf to collection: " + e.getMessage(), e);
        }
    }

    public void delete(Long leafId){
        try {
            Leaf leaf = leafRepository.findById(leafId).orElse(null);
            if (leaf==null) {
                throw new RuntimeException("Leaf not found with ID: " + leafId);
            }
            leafRepository.delete(getLeafById(leafId));
        } catch (Exception e) {
            throw new RuntimeException("Error deleting leaf:" + e.getMessage(), e);
        }
    }

}
