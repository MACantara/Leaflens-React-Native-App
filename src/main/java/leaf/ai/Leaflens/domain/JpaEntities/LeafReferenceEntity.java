package leaf.ai.Leaflens.domain.JpaEntities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leaf_reference")
public class LeafReferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reference_id")
    private Long referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leaf_id", nullable = false)
    private LeafEntity leaf;

    @Column(name = "url", nullable = false, length = 2048)
    private String url;

    @Column(name = "title")
    private String title;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public LeafReferenceEntity() {}

    public LeafReferenceEntity(LeafEntity leaf, String url, String title) {
        this.leaf = leaf;
        this.url = url;
        this.title = title;
        this.createdAt = LocalDateTime.now();
    }

    public Long getReferenceId() { return referenceId; }
    public LeafEntity getLeaf() { return leaf; }
    public String getUrl() { return url; }
    public String getTitle() { return title; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
