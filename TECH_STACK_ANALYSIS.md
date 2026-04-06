# Leaflens Tech Stack Analysis

Date: 2026-04-06

## 1) Executive Summary
Leaflens is a Java 21 backend application built with Spring Boot 3.5.4. It exposes a REST API for leaf identification and collection management, integrates an LLM through Spring AI using an OpenAI-compatible interface (configured for Gemini-style usage), persists data in PostgreSQL via Spring Data JPA, manages schema evolution with Flyway SQL migrations, secures endpoints with Spring Security + JWT, and supports containerized deployment with Docker and Docker Compose.

There is no frontend code in this repository; this is an API-focused backend service.

## 2) Core Stack Matrix
| Layer | Technology | Version / Variant | Evidence |
|---|---|---|---|
| Language | Java | 21 | [pom.xml](pom.xml) |
| Build Tool | Maven + Maven Wrapper | spring-boot-starter-parent 3.5.4 | [pom.xml](pom.xml), [mvnw](mvnw), [mvnw.cmd](mvnw.cmd) |
| Framework | Spring Boot | 3.5.4 | [pom.xml](pom.xml) |
| Web/API | Spring Web MVC | via spring-boot-starter-web | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java](src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java) |
| Security | Spring Security | via spring-boot-starter-security | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java](src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java) |
| Auth Tokens | JJWT | 0.13.0 | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/security/JwtService.java](src/main/java/leaf/ai/Leaflens/security/JwtService.java) |
| AI Integration | Spring AI OpenAI Starter | spring-ai.version 1.0.1 | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/LeaflensApplication.java](src/main/java/leaf/ai/Leaflens/LeaflensApplication.java) |
| Database | PostgreSQL | 15-alpine container image | [docker-compose.yml](docker-compose.yml), [postgres-prod.yml](postgres-prod.yml) |
| Persistence | Spring Data JPA + Jakarta Persistence | JPA repositories/entities | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java](src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java) |
| Migration | Flyway | flyway plugin 9.22.3 | [pom.xml](pom.xml), [src/main/resources/db/migration/V1__create_all_tables.sql](src/main/resources/db/migration/V1__create_all_tables.sql) |
| JSON | Jackson + JavaTimeModule | jackson-databind, jsr310 | [pom.xml](pom.xml), [src/main/java/leaf/ai/Leaflens/config/JacksonConfig.java](src/main/java/leaf/ai/Leaflens/config/JacksonConfig.java) |
| Containerization | Docker multi-stage build | Temurin 21 + Maven 3.9 | [Dockerfile](Dockerfile) |
| Orchestration | Docker Compose | version 3.8 specs | [docker-compose.yml](docker-compose.yml), [docker-compose-leaflens.yml](docker-compose-leaflens.yml), [postgres-prod.yml](postgres-prod.yml) |
| Testing | JUnit 5 + Spring Boot Test | minimal context load test | [src/test/java/leaf/ai/Leaflens/LeaflensApplicationTests.java](src/test/java/leaf/ai/Leaflens/LeaflensApplicationTests.java) |

## 3) Application Architecture
The project follows a layered style that resembles Hexagonal/Clean Architecture conventions:

- API layer (controllers): [src/main/java/leaf/ai/Leaflens/rest](src/main/java/leaf/ai/Leaflens/rest)
- Domain services and interfaces: [src/main/java/leaf/ai/Leaflens/domain](src/main/java/leaf/ai/Leaflens/domain)
- Domain repository ports: [src/main/java/leaf/ai/Leaflens/domain/repository](src/main/java/leaf/ai/Leaflens/domain/repository)
- Infrastructure adapters: [src/main/java/leaf/ai/Leaflens/infrastructure/repository](src/main/java/leaf/ai/Leaflens/infrastructure/repository)
- JPA repositories (Spring Data adapters): [src/main/java/leaf/ai/Leaflens/JpaRepository](src/main/java/leaf/ai/Leaflens/JpaRepository)
- Persistence entities: [src/main/java/leaf/ai/Leaflens/domain/JpaEntities](src/main/java/leaf/ai/Leaflens/domain/JpaEntities)

Notable architectural implementation:
- Entry point wires a ChatClient builder from OpenAiChatModel: [src/main/java/leaf/ai/Leaflens/LeaflensApplication.java](src/main/java/leaf/ai/Leaflens/LeaflensApplication.java)
- Domain-level orchestration for analyze + save: [src/main/java/leaf/ai/Leaflens/domain/LeafAnalysisAndSaveService.java](src/main/java/leaf/ai/Leaflens/domain/LeafAnalysisAndSaveService.java)
- Domain-to-entity mapping strategy exists through mapper classes (manual mapping): [src/main/java/leaf/ai/Leaflens/domain/LeafMapper.java](src/main/java/leaf/ai/Leaflens/domain/LeafMapper.java), [src/main/java/leaf/ai/Leaflens/domain/UserMapper.java](src/main/java/leaf/ai/Leaflens/domain/UserMapper.java)

## 4) API and Protocol Surface
Transport/protocol:
- HTTP JSON REST with multipart upload support for images.

Representative endpoint groups:
- Auth: [src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java](src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java)
- Leaf analysis: [src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java](src/main/java/leaf/ai/Leaflens/rest/LeafAnalyzerController.java)
- User history/collection: [src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java](src/main/java/leaf/ai/Leaflens/rest/LeafCollectionController.java)
- Explore and save existing leaves: [src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java](src/main/java/leaf/ai/Leaflens/rest/LeafExploreController.java)
- Tags: [src/main/java/leaf/ai/Leaflens/rest/TagController.java](src/main/java/leaf/ai/Leaflens/rest/TagController.java)
- User profile operations: [src/main/java/leaf/ai/Leaflens/rest/UserController.java](src/main/java/leaf/ai/Leaflens/rest/UserController.java)
- Leaf references: [src/main/java/leaf/ai/Leaflens/rest/LeafReferenceController.java](src/main/java/leaf/ai/Leaflens/rest/LeafReferenceController.java)

CORS:
- Controllers use permissive CORS configuration (`@CrossOrigin(origins = "*")`) in several classes.

## 5) AI/LLM Integration Details
AI integration pattern:
- Uses Spring AI ChatClient with OpenAI-compatible model abstraction.
- The runtime bean depends on OpenAiChatModel: [src/main/java/leaf/ai/Leaflens/LeaflensApplication.java](src/main/java/leaf/ai/Leaflens/LeaflensApplication.java)
- Analyzer implementation is named GeminiAnalyzerService and sends image + prompt to ChatClient: [src/main/java/leaf/ai/Leaflens/AiImpl/GeminiAnalyzerService.java](src/main/java/leaf/ai/Leaflens/AiImpl/GeminiAnalyzerService.java)

Prompting and output handling:
- Prompt template defined as constant requiring strict JSON output and references/tags: [src/main/java/leaf/ai/Leaflens/domain/constants/PromptConstants.java](src/main/java/leaf/ai/Leaflens/domain/constants/PromptConstants.java)
- AI response is cleaned and parsed through utility sanitization logic: [src/main/java/leaf/ai/Leaflens/domain/utils/JsonResponseUtil.java](src/main/java/leaf/ai/Leaflens/domain/utils/JsonResponseUtil.java)
- Analysis is enriched with location suitability in Cavite via registry/services:
  - [src/main/java/leaf/ai/Leaflens/domain/PlantLocationRegistry.java](src/main/java/leaf/ai/Leaflens/domain/PlantLocationRegistry.java)
  - [src/main/java/leaf/ai/Leaflens/domain/CavitePlantLocationService.java](src/main/java/leaf/ai/Leaflens/domain/CavitePlantLocationService.java)
  - [src/main/resources/cavite-plants.txt](src/main/resources/cavite-plants.txt)

Configuration keys for AI endpoint/model/key are environment-driven in sample env:
- [sample.env](sample.env)

## 6) Security and Identity
Security framework:
- Spring Security with stateless session policy and JWT filter-before-username-password filter.
- Config: [src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java](src/main/java/leaf/ai/Leaflens/security/SecurityConfig.java)

Token handling:
- JWT generation/validation using HS256 from JJWT and secret/expiration properties: [src/main/java/leaf/ai/Leaflens/security/JwtService.java](src/main/java/leaf/ai/Leaflens/security/JwtService.java)
- Bearer token extraction and principal injection via OncePerRequestFilter: [src/main/java/leaf/ai/Leaflens/security/JwtAuthenticationFilter.java](src/main/java/leaf/ai/Leaflens/security/JwtAuthenticationFilter.java)

Authentication flow:
- Register/login logic with BCrypt password hashing in service: [src/main/java/leaf/ai/Leaflens/security/AuthenticationService.java](src/main/java/leaf/ai/Leaflens/security/AuthenticationService.java)
- Controller endpoints for register/login/validate: [src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java](src/main/java/leaf/ai/Leaflens/rest/AuthenticationController.java)

## 7) Data Layer and Schema
Database:
- PostgreSQL is the target database.

ORM + repositories:
- JPA entities: [src/main/java/leaf/ai/Leaflens/domain/JpaEntities](src/main/java/leaf/ai/Leaflens/domain/JpaEntities)
- Spring Data repositories: [src/main/java/leaf/ai/Leaflens/JpaRepository](src/main/java/leaf/ai/Leaflens/JpaRepository)
- Domain repository interfaces and infrastructure implementations separate domain from persistence details:
  - [src/main/java/leaf/ai/Leaflens/domain/repository](src/main/java/leaf/ai/Leaflens/domain/repository)
  - [src/main/java/leaf/ai/Leaflens/infrastructure/repository](src/main/java/leaf/ai/Leaflens/infrastructure/repository)

Schema characteristics:
- Core tables: users, leaf, leaf_collection, collection_leaf
- Additional tables: tag, leaf_tag, leaf_reference
- Binary image storage in DB (`BYTEA`) for leaf images
- Flyway SQL migrations V1-V6 in: [src/main/resources/db/migration](src/main/resources/db/migration)

Query strategy:
- Mix of JPQL and native SQL for search/explore/tag filtering.
- Relevant definitions: [src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java](src/main/java/leaf/ai/Leaflens/JpaRepository/LeafJpaRepository.java), [src/main/java/leaf/ai/Leaflens/domain/repository/TagRepository.java](src/main/java/leaf/ai/Leaflens/domain/repository/TagRepository.java)

## 8) Configuration and Environment Model
Configuration style:
- Environment-variable first setup documented in sample env template.
- Sample config: [sample.env](sample.env)

Important configured areas:
- Spring datasource credentials
- Spring AI OpenAI-compatible base URL/completion path/model/API key
- JWT secret/expiration
- Flyway migration behavior
- JPA dialect and ddl validation
- Active profile defaulted to prod in sample file

Observation:
- No application.properties or application.yml file was found in source resources; env-driven configuration appears primary.

## 9) Deployment and Runtime
Container build:
- Multi-stage Docker build compiles with Maven + Java 21, runs on Temurin 21 JRE Alpine.
- [Dockerfile](Dockerfile)

Compose topology:
- Local DB compose for PostgreSQL service: [docker-compose.yml](docker-compose.yml)
- App compose expects prebuilt app image and env file pattern (`${ENV:-prod}.env`): [docker-compose-leaflens.yml](docker-compose-leaflens.yml)
- Production-style PostgreSQL compose with externalized credentials: [postgres-prod.yml](postgres-prod.yml)

## 10) Testing, Quality, and Tooling
Testing:
- Spring Boot context load test only.
- [src/test/java/leaf/ai/Leaflens/LeaflensApplicationTests.java](src/test/java/leaf/ai/Leaflens/LeaflensApplicationTests.java)

Tooling and conventions:
- Maven wrapper scripts committed.
- SQL migration scripts versioned.
- No frontend build toolchain detected.
- No CI workflow files detected in the scanned tree.

## 11) Notable Technical Characteristics
- Backend-only API project with multipart image upload and AI-based classification.
- Explicit domain/infrastructure separation with repository ports and adapters.
- Uses both JPQL and native SQL to support richer search patterns.
- Stores media (image bytes) directly in PostgreSQL.
- Enriches AI output with local domain intelligence (Cavite growability dataset).

## 12) Potential Improvement Areas (Stack-Adjacent)
- Add broader automated tests (service/repository/controller/integration).
- Consider API documentation tooling (for example OpenAPI/Swagger).
- Evaluate object storage for images if data volume grows significantly.
- Tighten CORS and endpoint authorization policy for production hardening.
- Add CI pipelines for build, test, and migration validation.

## 13) Source Inventory Used for This Analysis
- [pom.xml](pom.xml)
- [README.md](README.md)
- [Dockerfile](Dockerfile)
- [docker-compose.yml](docker-compose.yml)
- [docker-compose-leaflens.yml](docker-compose-leaflens.yml)
- [postgres-prod.yml](postgres-prod.yml)
- [sample.env](sample.env)
- [src/main/java/leaf/ai/Leaflens](src/main/java/leaf/ai/Leaflens)
- [src/main/resources/db/migration](src/main/resources/db/migration)
- [src/test/java/leaf/ai/Leaflens](src/test/java/leaf/ai/Leaflens)
