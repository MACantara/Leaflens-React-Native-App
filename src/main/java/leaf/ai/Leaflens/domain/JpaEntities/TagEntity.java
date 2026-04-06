package leaf.ai.Leaflens.domain.JpaEntities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tag")
public class TagEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tag_id")
    private Long tagId;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @ManyToMany(mappedBy = "tags")
    private List<LeafEntity> leaves = new ArrayList<>();

    public TagEntity() {}

    public TagEntity(String name) {
        this.name = name;
    }

    // getters and setters
    public Long getTagId() { return tagId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<LeafEntity> getLeaves() { return leaves; }
}
