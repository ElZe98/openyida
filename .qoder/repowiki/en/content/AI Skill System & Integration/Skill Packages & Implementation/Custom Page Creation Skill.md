# Custom Page Creation Skill

<cite>
**Referenced Files in This Document**
- [SKILL.md](file://yida-skills/skills/yida-custom-page/SKILL.md)
- [babel-transform/index.js](file://lib/core/babel-transform/index.js)
- [publish.js](file://lib/app/publish.js)
- [yida.js](file://bin/yida.js)
- [utils.js](file://lib/core/utils.js)
- [weather-dashboard.js](file://project/pages/src/weather-dashboard.js)
- [jinko-dashboard.js](file://project/pages/src/jinko-dashboard.js)
- [cdn-config.js](file://lib/cdn/cdn-config.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the yida-custom-page skill package for developing interactive dashboards and custom interfaces on the Alibaba Yida low-code platform. It covers the JSX-based page development workflow, component integration patterns, publishing pipeline, and operational aspects such as parameter requirements, access control, and CDN asset management. The skill enables developers to build rich, reactive pages that integrate with Yida's runtime APIs, state management, and deployment mechanisms.

## Project Structure
The yida-custom-page skill is part of the broader openyida toolkit. Key areas relevant to custom page creation include:
- Skill documentation and design guidelines
- Build-time compilation and publishing pipeline
- Example custom pages demonstrating best practices
- Utility modules for authentication, CSRF handling, and HTTP requests
- CDN configuration for asset management

```mermaid
graph TB
subgraph "Skill Package"
A["yida-skills/skills/yida-custom-page/SKILL.md"]
end
subgraph "Build & Publish Pipeline"
B["lib/core/babel-transform/index.js"]
C["lib/app/publish.js"]
D["bin/yida.js"]
E["lib/core/utils.js"]
end
subgraph "Example Pages"
F["project/pages/src/weather-dashboard.js"]
G["project/pages/src/jinko-dashboard.js"]
end
subgraph "CDN Integration"
H["lib/cdn/cdn-config.js"]
end
A --> B
B --> C
D --> C
E --> C
F --> C
G --> C
H --> C
```

**Diagram sources**
- [SKILL.md:1-1100](file://yida-skills/skills/yida-custom-page/SKILL.md#L1-L1100)
- [babel-transform/index.js:1-244](file://lib/core/babel-transform/index.js#L1-L244)
- [publish.js:1-630](file://lib/app/publish.js#L1-L630)
- [yida.js:1-521](file://bin/yida.js#L1-L521)
- [utils.js:1-463](file://lib/core/utils.js#L1-L463)
- [weather-dashboard.js:1-374](file://project/pages/src/weather-dashboard.js#L1-L374)
- [jinko-dashboard.js:1-661](file://project/pages/src/jinko-dashboard.js#L1-L661)
- [cdn-config.js:1-173](file://lib/cdn/cdn-config.js#L1-L173)

**Section sources**
- [SKILL.md:1-1100](file://yida-skills/skills/yida-custom-page/SKILL.md#L1-L1100)
- [yida.js:24-50](file://bin/yida.js#L24-L50)

## Core Components
- JSX rendering and state management: Custom pages define a renderJsx function and manage state via getCustomState/setCustomState/forceUpdate, with lifecycle hooks didMount/didUnmount.
- Compilation engine: Babel transforms JSX to ES5-compatible code and compresses it for deployment.
- Publishing pipeline: The CLI orchestrates compilation, schema generation, authentication, and API calls to persist the page to Yida.
- Runtime utilities: Helpers for login state, CSRF token detection, and HTTP requests streamline the publish flow.
- Example pages: Real-world dashboards demonstrate responsive layouts, charts, and interactivity patterns.

**Section sources**
- [SKILL.md:550-800](file://yida-skills/skills/yida-custom-page/SKILL.md#L550-L800)
- [babel-transform/index.js:89-244](file://lib/core/babel-transform/index.js#L89-L244)
- [publish.js:59-123](file://lib/app/publish.js#L59-L123)
- [utils.js:170-264](file://lib/core/utils.js#L170-L264)
- [weather-dashboard.js:85-124](file://project/pages/src/weather-dashboard.js#L85-L124)
- [jinko-dashboard.js:1-661](file://project/pages/src/jinko-dashboard.js#L1-L661)

## Architecture Overview
The custom page creation workflow integrates authoring, compilation, schema generation, authentication, and publishing into a cohesive pipeline.

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant CLI as "CLI (yida)"
participant Comp as "Babel Transform"
participant Min as "UglifyJS"
participant Pub as "Publish Script"
participant Util as "Auth Utils"
participant Yida as "Yida API"
Dev->>CLI : "openyida publish <src> <appType> <formUuid>"
CLI->>Pub : "Invoke publish with args"
Pub->>Comp : "Compile JSX to ES5"
Comp-->>Pub : "Compiled code"
Pub->>Min : "Minify compiled code"
Min-->>Pub : "Minified code"
Pub->>Util : "Load cookies, resolve base_url"
Util-->>Pub : "csrf_token, cookies, base_url"
Pub->>Yida : "saveFormSchema (with actions.module)"
Yida-->>Pub : "Success/Failure"
Pub->>Yida : "updateFormConfig (MINI_RESOURCE)"
Yida-->>Pub : "Success/Failure"
Pub-->>Dev : "Publish result"
```

**Diagram sources**
- [yida.js:268-280](file://bin/yida.js#L268-L280)
- [publish.js:509-624](file://lib/app/publish.js#L509-L624)
- [utils.js:170-264](file://lib/core/utils.js#L170-L264)
- [babel-transform/index.js:89-130](file://lib/core/babel-transform/index.js#L89-L130)

## Detailed Component Analysis

### JSX Rendering and State Management
Custom pages must define:
- _customState: Initial state object
- getCustomState/setCustomState/forceUpdate: State management helpers
- didMount/didUnmount: Lifecycle hooks
- renderJsx: The JSX rendering function that returns the page UI

```mermaid
flowchart TD
Start(["Page Load"]) --> DidMount["didMount() initializes data and timers"]
DidMount --> Render["renderJsx() builds UI with state"]
Render --> Events{"User Interacts?"}
Events --> |Click/Change| Handler["Event handler updates _customState"]
Handler --> SetState["setCustomState(newState) triggers re-render"]
SetState --> Force["forceUpdate() optional"]
Force --> Render
Events --> |Unmount| DidUnmount["didUnmount() clears timers/resources"]
DidUnmount --> End(["Page Unloaded"])
```

**Diagram sources**
- [SKILL.md:585-670](file://yida-skills/skills/yida-custom-page/SKILL.md#L585-L670)
- [weather-dashboard.js:85-124](file://project/pages/src/weather-dashboard.js#L85-L124)
- [jinko-dashboard.js:1-661](file://project/pages/src/jinko-dashboard.js#L1-L661)

**Section sources**
- [SKILL.md:570-700](file://yida-skills/skills/yida-custom-page/SKILL.md#L570-L700)
- [weather-dashboard.js:85-124](file://project/pages/src/weather-dashboard.js#L85-L124)
- [jinko-dashboard.js:1-661](file://project/pages/src/jinko-dashboard.js#L1-L661)

### Compilation and Minification
The build pipeline compiles JSX to ES5 and minifies the output for deployment.

```mermaid
flowchart TD
Src["Source .js"] --> Babel["@babel/standalone transform"]
Babel --> AST["AST traversal and component discovery"]
AST --> ES5["ES5-compatible JS"]
ES5 --> Uglify["UglifyJS minify"]
Uglify --> Dist["Minified .js"]
```

**Diagram sources**
- [babel-transform/index.js:89-244](file://lib/core/babel-transform/index.js#L89-L244)
- [publish.js:59-123](file://lib/app/publish.js#L59-L123)

**Section sources**
- [babel-transform/index.js:89-244](file://lib/core/babel-transform/index.js#L89-L244)
- [publish.js:59-123](file://lib/app/publish.js#L59-L123)

### Publishing Workflow
The publish script performs:
- Compile source code
- Build schema JSON embedding compiled actions
- Authenticate and refresh CSRF tokens if needed
- Save schema and update form configuration

```mermaid
sequenceDiagram
participant Pub as "publish.js"
participant Utils as "utils.js"
participant API as "Yida API"
Pub->>Pub : "compileSource()"
Pub->>Pub : "buildSchemaContent()"
Pub->>Utils : "loadCookieData()"
Utils-->>Pub : "csrf_token, cookies, base_url"
Pub->>API : "saveFormSchema"
API-->>Pub : "response"
alt CSRF expired
Pub->>Utils : "refreshCsrfToken()"
Utils-->>Pub : "new csrf_token"
Pub->>API : "retry saveFormSchema"
end
Pub->>API : "updateFormConfig (MINI_RESOURCE)"
API-->>Pub : "response"
```

**Diagram sources**
- [publish.js:509-624](file://lib/app/publish.js#L509-L624)
- [utils.js:170-264](file://lib/core/utils.js#L170-L264)

**Section sources**
- [publish.js:509-624](file://lib/app/publish.js#L509-L624)
- [utils.js:232-251](file://lib/core/utils.js#L232-L251)

### Access Control and Sharing Configuration
The CLI supports saving share configuration and retrieving page configuration, enabling controlled public access and permissions.

```mermaid
sequenceDiagram
participant CLI as "CLI"
participant Share as "save-share-config"
participant GetCfg as "get-page-config"
participant API as "Yida API"
CLI->>Share : "save-share-config <appType> <formUuid> <url> <isOpen> [openAuth]"
Share->>API : "Update share config"
API-->>Share : "Result"
CLI->>GetCfg : "get-page-config <appType> <formUuid>"
GetCfg->>API : "Fetch page config"
API-->>GetCfg : "Config details"
```

**Diagram sources**
- [yida.js:26-28](file://bin/yida.js#L26-L28)
- [yida.js:293-313](file://bin/yida.js#L293-L313)

**Section sources**
- [yida.js:26-28](file://bin/yida.js#L26-L28)
- [yida.js:293-313](file://bin/yida.js#L293-L313)

### CDN Integration for Asset Management
CDN configuration supports secure asset uploads and endpoint management for images and static resources.

```mermaid
flowchart TD
Init["Init CDN Config"] --> Load["loadCdnConfig()"]
Load --> Validate["validateCdnConfig()"]
Validate --> |Valid| Ready["Ready for uploads"]
Validate --> |Invalid| Prompt["Prompt for missing fields"]
Ready --> Upload["Upload assets to OSS/CND"]
Upload --> Refresh["Optional cache refresh"]
```

**Diagram sources**
- [cdn-config.js:1-173](file://lib/cdn/cdn-config.js#L1-L173)

**Section sources**
- [cdn-config.js:27-173](file://lib/cdn/cdn-config.js#L27-L173)

## Dependency Analysis
The custom page skill depends on several internal modules and follows a clear separation of concerns:
- Babel transform handles JSX compilation and AST analysis
- Publish script coordinates compilation, schema building, and API calls
- CLI routes commands to appropriate modules
- Utilities manage authentication and HTTP interactions
- Example pages demonstrate best practices for state and rendering

```mermaid
graph LR
CLI["bin/yida.js"] --> Publish["lib/app/publish.js"]
Publish --> Babel["@babel/standalone"]
Publish --> Utils["lib/core/utils.js"]
Publish --> Actions["actions.module (compiled)"]
Utils --> Cookies[".cache/cookies.json"]
Actions --> Schema["Schema JSON"]
Schema --> Yida["Yida API"]
```

**Diagram sources**
- [yida.js:268-280](file://bin/yida.js#L268-L280)
- [publish.js:59-123](file://lib/app/publish.js#L59-L123)
- [utils.js:170-264](file://lib/core/utils.js#L170-L264)

**Section sources**
- [yida.js:268-280](file://bin/yida.js#L268-L280)
- [publish.js:59-123](file://lib/app/publish.js#L59-L123)
- [utils.js:170-264](file://lib/core/utils.js#L170-L264)

## Performance Considerations
- Keep JSX minimal and avoid heavy computations inside renderJsx to maintain smooth interactions.
- Use non-controlled inputs for text fields to prevent unnecessary re-renders during typing.
- Limit pageSize for paginated queries to the documented maximum to avoid API errors.
- Prefer inline styles and avoid external CSS to reduce complexity under Yida's constraints.
- Use forceUpdate judiciously; excessive re-renders can degrade performance.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- JSX compilation errors: Verify syntax against the skill's prohibited constructs and event binding rules.
- Login or CSRF token expiration: The publish flow automatically detects and refreshes tokens or triggers re-login.
- Missing or invalid parameters: Ensure appType, formUuid, and source file path are correct when invoking the CLI.

**Section sources**
- [publish.js:80-104](file://lib/app/publish.js#L80-L104)
- [utils.js:232-251](file://lib/core/utils.js#L232-L251)
- [yida.js:268-280](file://bin/yida.js#L268-L280)

## Conclusion
The yida-custom-page skill provides a complete framework for building interactive dashboards and custom interfaces on Yida. By adhering to the design guidelines, leveraging the compilation and publishing pipeline, and integrating with access control and CDN capabilities, teams can efficiently develop, iterate, and deploy custom pages that deliver rich user experiences within the Yida ecosystem.