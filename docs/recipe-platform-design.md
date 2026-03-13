# Home Smart Chef - Daily Content + Local AI Design

## Current State

The app is offline and static today:

- Recipes are bundled in [src/data/recipes.ts](/home/akolyakov/.openclaw/workspace/apps/home-smart-chef/src/data/recipes.ts)
- Personal state is local-only in [src/utils/storage.ts](/home/akolyakov/.openclaw/workspace/apps/home-smart-chef/src/utils/storage.ts)
- Recommendations are placeholder filtering in [src/services/ai.ts](/home/akolyakov/.openclaw/workspace/apps/home-smart-chef/src/services/ai.ts)
- The home screen reads local data and renders meal tabs in [app/(tabs)/home.tsx](/home/akolyakov/.openclaw/workspace/apps/home-smart-chef/app/(tabs)/home.tsx)

That is a fine MVP, but it cannot grow daily, learn from users, or support a serious cooking assistant.

## Product Decisions

### 1. Separate code repo and content repo

Do not keep adding recipes directly into the app repo forever.

Recommended setup:

- `home-smart-chef-app` -> Expo mobile app
- `home-smart-chef-content` -> recipe catalog, curation pipeline, manifests, popularity scores

Why:

- app releases and recipe publishing should move independently
- recipe editors should not touch mobile code
- daily automation is cleaner in a content repo
- the app can sync content without shipping a new APK every day

### 2. Offline-first app, online content sync

The APK should ship with a seed pack of recipes so the app works with no network.

After install, the app should:

- check a remote `manifest.json`
- download newer recipe packs
- cache them locally
- fall back to bundled seed data when offline

### 3. Do not bundle a full LLM inside the APK initially

Bundling a real generative model into the APK is the wrong first move:

- APK size becomes large fast
- many Android devices will not have enough RAM
- Expo Go cannot run custom native AI modules anyway
- on-device LLM integration requires native modules and a custom build

Recommended approach:

- v1: local recommendation engine, no generative model needed
- v2: native inference runtime added to the app
- v3: optional small model downloaded after install, not baked into the APK

This gives you a useful product earlier and keeps installs sane.

## Target Architecture

```text
content editors / AI curation job
        |
        v
home-smart-chef-content repo
  - recipes
  - manifests
  - popularity scores
  - daily menu packs
        |
        v
static hosting / CDN
  - manifest.json
  - recipes/*.json
  - packs/*.json
        |
        v
Expo app
  - bundled seed recipes
  - local cache
  - feedback queue
  - recommendation engine
  - optional on-device assistant
        |
        v
analytics / feedback API
  - likes
  - dislikes
  - cooked
  - saved
  - ingredient match events
```

## Content Repo Design

Suggested structure:

```text
home-smart-chef-content/
  recipes/
    he/
      shakshuka-classic.json
      chicken-soup.json
    en/
      shakshuka-classic.json
      chicken-soup.json
  packs/
    seed-he-v1.json
    seed-en-v1.json
    daily-2026-03-13.json
  generated/
    manifest.json
    popularity.json
    recommendations.json
  schemas/
    recipe.schema.json
  scripts/
    validate.ts
    build-packs.ts
    score-recipes.ts
  .github/workflows/
    daily-content.yml
```

### Recipe shape

Each recipe should be standalone JSON, not hardcoded TypeScript.

Suggested fields:

- `id`
- `slug`
- `locale`
- `title`
- `description`
- `mealType`
- `cuisineType`
- `dietaryTags`
- `prepTimeMinutes`
- `cookTimeMinutes`
- `servings`
- `ingredients`
- `steps`
- `equipment`
- `difficulty`
- `seasonality`
- `image`
- `sourceType`
- `sourceUrl`
- `license`
- `searchTerms`
- `embeddingText`
- `publishedAt`
- `updatedAt`
- `qualityScore`
- `popularityScore`

### Important rule

Do not scrape copyrighted recipe sites blindly.

Only publish:

- recipes you wrote
- licensed/public-domain content
- partner content you have permission to use
- AI-assisted recipes that are reviewed by a human

## Daily Schedule

Use a scheduled GitHub Action in the content repo.

Recommended daily pipeline:

1. `00:30 UTC` pull feedback aggregates from the analytics store.
2. `00:35 UTC` score recipes using freshness, popularity, completion rate, and like rate.
3. `00:40 UTC` generate a `daily` pack for each locale and meal segment.
4. `00:45 UTC` validate all recipe JSON against schema.
5. `00:50 UTC` build `manifest.json` with new pack hashes and versions.
6. `00:55 UTC` publish static files to CDN.

The app should not assume one universal timezone for food suggestions. The device local date should decide which daily pack to show.

## How the App Should Change

### Replace static recipes with a repository layer

Add a content repository abstraction:

- `BundledRecipeSource`
- `CachedRecipeSource`
- `RemoteRecipeSource`
- `RecipeRepository`

Responsibilities:

- load bundled seed pack first
- fetch remote manifest if online
- compare versions or hashes
- download updated packs
- save locally
- return merged recipes to the UI

### Keep AsyncStorage only for user state

Current AsyncStorage is fine for:

- profile
- pantry ingredients
- likes/dislikes
- daily usage counts

For recipe catalogs and large manifests, move to a file-based cache or SQLite later. AsyncStorage is acceptable for very small packs only.

### Add sync metadata

New local state should include:

- `contentVersion`
- `lastSuccessfulSyncAt`
- `pendingFeedbackEvents`
- `downloadedModelVersion`
- `dailyPackDate`

## Learning From What People Liked

You need explicit event collection. Likes alone are not enough.

Track these events:

- recipe viewed
- recipe opened
- recipe liked
- recipe disliked
- recipe cooked
- recipe saved
- ingredient coverage percentage at recommendation time
- recommendation clicked
- recommendation ignored

Recommended scoring formula:

```text
finalScore =
  0.35 * popularityScore +
  0.25 * ingredientFitScore +
  0.20 * personalPreferenceScore +
  0.10 * freshnessScore +
  0.10 * diversityPenaltyAdjustment
```

Definitions:

- `popularityScore`: based on all users
- `ingredientFitScore`: how much of the recipe matches pantry items
- `personalPreferenceScore`: cuisine + diet + likes/dislikes
- `freshnessScore`: boosts newer or seasonally relevant content
- `diversityPenaltyAdjustment`: stops the same dish style from dominating daily suggestions

## AI Assistant Design

### What the assistant should answer

The assistant does not need to be a general chatbot.

It should focus on:

- "What should I cook tonight?"
- "I have tomatoes, eggs, and onion. What can I make?"
- "Give me a 20-minute dinner."
- "Suggest something kosher and vegetarian."
- "What can I cook for 4 people?"

### Recommended rollout

#### Phase A: deterministic assistant

Ship this first.

Use:

- pantry matching
- filters
- ranking
- a tiny intent parser
- template-based answer generation

This already solves the main product need without model complexity.

#### Phase B: on-device model runtime

If you want genuine local generation, move from Expo Go to a custom native build.

Relevant upstream docs:

- Expo documents that custom native code requires development builds / prebuild, not Expo Go.
- `llama.rn` exposes an Expo plugin for native integration with GGUF models.
- `react-native-executorch` supports on-device LLM loading and warns that lower-end devices may not fit the model in memory.

#### Phase C: optional downloadable local model

Recommended model class:

- small instruct model
- roughly `0.5B` to `1.5B`
- quantized
- downloaded on demand after install

Why not inside the APK:

- large APK
- slower install
- worse store conversion
- harder updates
- device RAM failures

### Runtime strategy

Use the local model only for wording and lightweight reasoning.

Do not ask it to invent recipes from scratch without constraints.

The model should receive:

- available pantry items
- user preferences
- 10-20 candidate recipes from the deterministic ranker
- response format rules

Then it produces:

- best 3 picks
- short explanation
- optional substitution tips

This is safer and far more stable than letting the model answer from nothing.

## Recommendation Engine Design

The real intelligence should come from retrieval and ranking, not raw generation.

Pipeline:

1. filter recipes by locale, diet, meal type, and time budget
2. score by pantry overlap
3. downrank disliked recipes
4. boost liked cuisines and similar successful recipes
5. add diversity logic
6. optionally let local LLM summarize the top results

This means the app stays useful even when:

- the model is not downloaded
- the model crashes
- the user is offline
- low-end devices cannot run generation

## Recommended Data Flow In App

### On app launch

1. load profile and pantry
2. load bundled seed recipes
3. check remote manifest
4. download new daily pack if available
5. recompute home feed

### On recommendation request

1. build candidate list from local data
2. compute ranking
3. if local model is available, ask it to summarize top choices
4. if not, render deterministic recommendation cards

### On feedback

1. save event locally immediately
2. queue for sync
3. upload when network is available
4. include in next daily scoring job

## Suggested Near-Term Repo Changes

### In the app repo

1. move bundled recipes out of TypeScript and into a seed JSON pack
2. add `RecipeRepository`
3. add `ContentSyncService`
4. add `FeedbackQueueService`
5. refactor `src/services/ai.ts` into:
   - `rankRecipes.ts`
   - `assistant.ts`
   - `localModel.ts`

### In the content repo

1. create JSON schema for recipes
2. add validation script
3. add daily workflow
4. generate manifest and packs
5. publish packs to static hosting

## Rollout Plan

### Phase 1 - make content dynamic

Goal:

- daily recipe additions without app release

Deliver:

- content repo
- schema
- manifest
- app sync
- local cache

### Phase 2 - make recommendations smart

Goal:

- personalized recipe ranking

Deliver:

- event collection
- popularity scoring
- better ranking engine

### Phase 3 - add local AI assistant

Goal:

- "what should I cook?" conversational flow

Deliver:

- native AI runtime
- model download manager
- candidate summarization

## Recommendation

Build this in this order:

1. content repo + daily publishing
2. app sync + local cache
3. feedback collection + ranking
4. optional on-device model

If you start with "LLM inside APK" before the content system exists, you will spend effort on the hardest layer while the product still has stale recipes.

## Sources

- Expo custom native code: https://docs.expo.dev/workflow/customizing/
- Expo prebuild / CNG: https://docs.expo.dev/workflow/prebuild
- llama.rn Expo integration: https://github.com/mybigday/llama.rn
- React Native ExecuTorch LLM docs: https://docs.swmansion.com/react-native-executorch/docs/0.6.x/hooks/natural-language-processing/useLLM
