# Leaflens Core Functionality List

Date: 2026-04-06

## 1. Authentication and Identity
- User registration with unique email validation and JWT issuance.
- User login with credential verification and JWT issuance.
- Token validation endpoint to verify active session state.
- Password hashing with BCrypt for credential storage safety.
- JWT-based user context extraction for protected operations.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java](src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java)
- [src/main/java/leaf/ai/Leaflens/security/AuthenticationService.java](src/main/java/leaf/ai/Leaflens/security/AuthenticationService.java)
- [src/main/java/leaf/ai/Leaflens/security/JwtService.java](src/main/java/leaf/ai/Leaflens/security/JwtService.java)
- [src/main/java/leaf/ai/Leaflens/security/JwtAuthenticationFilter.java](src/main/java/leaf/ai/Leaflens/security/JwtAuthenticationFilter.java)
- [src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java](src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java)

## 2. User Profile Management
- Get user profile by user ID.
- Update username and email.
- Delete user account.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/UserController.java](src/main/java/leaf/ai/Leaflens/rest/UserController.java)
- [src/main/java/leaf/ai/Leaflens/domain/UserService.java](src/main/java/leaf/ai/Leaflens/domain/UserService.java)
- [src/main/java/leaf/ai/Leaflens/domain/UserServiceImpl.java](src/main/java/leaf/ai/Leaflens/domain/UserServiceImpl.java)

## 3. AI-Powered Leaf Analysis
- Analyze uploaded leaf images and return structured plant data.
- Enforce image MIME-type validation before AI processing.
- Use prompt-driven LLM output with a strict JSON response contract.
- Clean and normalize AI output when it includes markdown wrappers or malformed formatting.
- Produce enriched analysis fields including tags and references payload support.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java](src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java)
- [src/main/java/leaf/ai/Leaflens/domain/LeafAnalysisAndSaveService.java](src/main/java/leaf/ai/Leaflens/domain/LeafAnalysisAndSaveService.java)
- [src/main/java/leaf/ai/Leaflens/AiImpl/GeminiAnalyzerService.java](src/main/java/leaf/ai/Leaflens/AiImpl/GeminiAnalyzerService.java)
- [src/main/java/leaf/ai/Leaflens/domain/constants/PromptConstants.java](src/main/java/leaf/ai/Leaflens/domain/constants/PromptConstants.java)
- [src/main/java/leaf/ai/Leaflens/domain/utils/JsonResponseUtil.java](src/main/java/leaf/ai/Leaflens/domain/utils/JsonResponseUtil.java)

## 4. Leaf Collection and History Management
- Analyze-and-save flow that adds AI output directly into a user collection.
- Manual save flow for leaf analysis payloads into user history.
- Retrieve full user leaf history and collection metadata.
- Retrieve single leaf details from stored history.
- Retrieve stored leaf image bytes for rendering.
- Delete stored leaves from collection/history.
- Get per-user leaf count.
- Save explored/public leaf entries into a user collection.
- Ownership guard so users can only save to their own collection in protected flow.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java](src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java)
- [src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java](src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java)
- [src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java](src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java)
- [src/main/java/leaf/ai/Leaflens/domain/LeafSavingService.java](src/main/java/leaf/ai/Leaflens/domain/LeafSavingService.java)
- [src/main/java/leaf/ai/Leaflens/domain/LeafCollection.java](src/main/java/leaf/ai/Leaflens/domain/LeafCollection.java)

## 5. Search, Explore, and Filtering
- Global leaf exploration endpoint with optional keyword search.
- User collection search by keyword across core plant fields.
- User collection filtering by tags.
- Tag discovery for a specific user based on collection content.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java](src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java)
- [src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java](src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java)
- [src/main/java/leaf/ai/Leaflens/rest/TagController.java](src/main/java/leaf/ai/Leaflens/rest/TagController.java)
- [src/main/java/leaf/ai/Leaflens/domain/LeafSearchService.java](src/main/java/leaf/ai/Leaflens/domain/LeafSearchService.java)
- [src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java](src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java)
- [src/main/java/leaf/ai/Leaflens/domain/repository/TagRepository.java](src/main/java/leaf/ai/Leaflens/domain/repository/TagRepository.java)

## 6. References and Knowledge Sources
- Persist references associated with analyzed leaves.
- Retrieve references for a specific leaf.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/rest/LeafReferenceController.java](src/main/java/leaf/ai/Leaflens/rest/LeafReferenceController.java)
- [src/main/java/leaf/ai/Leaflens/domain/LeafReferenceService.java](src/main/java/leaf/ai/Leaflens/domain/LeafReferenceService.java)
- [src/main/java/leaf/ai/Leaflens/JpaRepository/LeafReferenceJpaRepository.java](src/main/java/leaf/ai/Leaflens/JpaRepository/LeafReferenceJpaRepository.java)

## 7. Location-Based Suitability Enrichment
- Registry pattern for pluggable plant-location services.
- Cavite-specific plant suitability lookup from bundled dataset.
- Automatic isGrownInCavite enrichment in analysis output.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/domain/PlantLocationRegistry.java](src/main/java/leaf/ai/Leaflens/domain/PlantLocationRegistry.java)
- [src/main/java/leaf/ai/Leaflens/domain/PlantLocationService.java](src/main/java/leaf/ai/Leaflens/domain/PlantLocationService.java)
- [src/main/java/leaf/ai/Leaflens/domain/CavitePlantLocationService.java](src/main/java/leaf/ai/Leaflens/domain/CavitePlantLocationService.java)
- [src/main/resources/cavite-plants.txt](src/main/resources/cavite-plants.txt)

## 8. Persistence and Data Lifecycle Capabilities
- Domain-to-entity mapping for users, leaves, collections, tags, and references.
- Repository abstraction with domain ports and infrastructure adapters.
- Relational data model supporting many-to-many collection-leaf and leaf-tag relationships.
- SQL migration-driven schema evolution with versioned Flyway scripts.

Implemented in:
- [src/main/java/leaf/ai/Leaflens/domain/JpaEntities](src/main/java/leaf/ai/Leaflens/domain/JpaEntities)
- [src/main/java/leaf/ai/Leaflens/domain/repository](src/main/java/leaf/ai/Leaflens/domain/repository)
- [src/main/java/leaf/ai/Leaflens/infrastructure/repository](src/main/java/leaf/ai/Leaflens/infrastructure/repository)
- [src/main/java/leaf/ai/Leaflens/JpaRepository](src/main/java/leaf/ai/Leaflens/JpaRepository)
- [src/main/resources/db/migration](src/main/resources/db/migration)
