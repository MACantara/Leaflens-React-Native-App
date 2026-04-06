package leaf.ai.Leaflens.domain;

import org.springframework.web.multipart.MultipartFile;

public interface LeafAnalysis {
    String identifyLeaf(MultipartFile imageFile, String prompt) throws Exception;


}
