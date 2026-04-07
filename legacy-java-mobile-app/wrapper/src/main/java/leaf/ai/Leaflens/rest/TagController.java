package leaf.ai.Leaflens.rest;

import leaf.ai.Leaflens.domain.repository.TagRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/tags")
@CrossOrigin(origins = "*")
public class TagController {

    private final TagRepository tagRepository;

    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @GetMapping("user/{userId}")
    public ResponseEntity<List<String>> getTagsByUser(
            @PathVariable Long userId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        List<String> tags = tagRepository.findTagsByUserId(userId)
                .stream()
                .map(tag -> tag.getName())
                .toList();
        return ResponseEntity.ok(tags);
    }
}
