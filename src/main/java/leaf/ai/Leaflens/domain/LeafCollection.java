package leaf.ai.Leaflens.domain;

import java.time.LocalDateTime;
import java.util.List;

public class LeafCollection {

    private final Long collectionId;
    private final User user;
    private final List<Leaf> leafList;
    private final LocalDateTime createdAt;

    public LeafCollection(Long collectionId, User user, List<Leaf> leafList, LocalDateTime createdAt){
        this.collectionId = collectionId;
        this.user = user;
        this.leafList = leafList;
        this.createdAt = createdAt;
    }

    public LeafCollection(User user, List<Leaf> leafList) {
        this(null, user, leafList,LocalDateTime.now());
    }

    public boolean canAddLeaf(Leaf leaf) {
        return leaf != null && leaf.isValidLeaf() && user.canSaveLeafAnalysis();
    }

    public int getLeafCount() {
        return leafList != null ? leafList.size(): 0;
    }

    public boolean isEmpty() {
        return leafList == null || leafList.isEmpty();
    }

    public boolean belongsToUser(Long userId) {
        return user != null && user.getUserId().equals(userId);
    }

    public Long getCollectionId() {
        return collectionId;
    }

    public User getUser() {
        return user;
    }

    public List<Leaf> getLeafList() {
        return leafList;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
