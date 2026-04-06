package leaf.ai.Leaflens.domain.JpaEntities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "leaf_collection")
public class LeafCollectionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "collection_id")
    private Long collectionId;

    @OneToOne(fetch = FetchType.LAZY,optional = false)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id",nullable = false,unique = true)
    private UserEntity user;

    @ManyToMany
    @JoinTable(
            name = "collection_leaf",
            joinColumns = @JoinColumn(name = "collection_id"),
            inverseJoinColumns = @JoinColumn(name = "leaf_id")
    )
    private List<LeafEntity> leafEntityList;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public LeafCollectionEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public LeafCollectionEntity(UserEntity user){
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }

    public Long getCollectionId() {
        return collectionId;
    }

    public void setCollectionId(Long collectionId) {
        this.collectionId = collectionId;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity userEntity) {
        this.user = userEntity;
    }

    public List<LeafEntity> getLeafList() {
        return leafEntityList;
    }

    public void setLeafList(List<LeafEntity> leafEntityList) {
        this.leafEntityList = leafEntityList;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
