# Renaming "Things" to "Topics"

## Problem Statement

The term "Things" is semantically ambiguous and creates friction in natural conversation with the Facilitator. When users chat about their work, "Things" doesn't map to how people naturally describe what they're organizing.

### Current Problems

1. **Ambiguous terminology** - "I made a Thing" tells the user nothing meaningful
2. **Unnatural conversation** - Users don't think "I need to create a Thing for my book report"
3. **Poor discoverability** - The concept of "Things" requires explanation; "Topics" is self-evident
4. **Agent communication friction** - When the Facilitator says "I created a Thing called X", users must mentally translate

### Natural Language Examples

**Current (awkward):**
```
User: "I'm working on a book report for To Kill a Mockingbird"
Facilitator: "I created a Thing called 'Book Report: To Kill a Mockingbird'"
```

**Proposed (natural):**
```
User: "I'm working on a book report for To Kill a Mockingbird"
Facilitator: "I'm now tracking that as a Topic: 'Book Report: To Kill a Mockingbird'"
```

The phrase "tracking a Topic" maps to how people naturally think about organizing their work, interests, and projects.

## Goals

1. **Rename "Things" to "Topics"** throughout the codebase
2. **Natural language understanding** - Facilitator infers Topics from conversation without explicit commands
3. **Intelligent organization** - Facilitator suggests hierarchical structure (e.g., "Book Reports" collection containing specific reports)
4. **User-approved structure** - Facilitator suggests organizational patterns but waits for approval before applying
5. **Behavioral learning** - Facilitator observes user patterns and suggests organizational improvements over time

## Scope of Rename

Based on codebase analysis, the following must be renamed:

### File Renames (22 files)

| Current Path | New Path |
|--------------|----------|
| `client/src/types/thing.ts` | `client/src/types/topic.ts` |
| `client/src/hooks/useThingIdeas.ts` | `client/src/hooks/useTopicIdeas.ts` |
| `client/src/contexts/ThingsContext.tsx` | `client/src/contexts/TopicsContext.tsx` |
| `client/src/components/Things/ThingsTree.tsx` | `client/src/components/Topics/TopicsTree.tsx` |
| `client/src/components/Things/ThingsEmptyState.tsx` | `client/src/components/Topics/TopicsEmptyState.tsx` |
| `client/src/components/Things/ThingDetail.tsx` | `client/src/components/Topics/TopicDetail.tsx` |
| `client/src/components/Things/ThingIdeas.tsx` | `client/src/components/Topics/TopicIdeas.tsx` |
| `client/src/components/Things/ThingLinks.tsx` | `client/src/components/Topics/TopicLinks.tsx` |
| `client/src/components/Things/ThingProperties.tsx` | `client/src/components/Topics/TopicProperties.tsx` |
| `client/src/components/Things/ThingDocuments.tsx` | `client/src/components/Topics/TopicDocuments.tsx` |
| `client/src/components/Things/ThingStylePicker.tsx` | `client/src/components/Topics/TopicStylePicker.tsx` |
| `client/src/components/Things/InlineThingEditor.tsx` | `client/src/components/Topics/InlineTopicEditor.tsx` |
| `client/src/components/Things/NewThingDialog.tsx` | `client/src/components/Topics/NewTopicDialog.tsx` |
| `client/src/components/Things/ImportDialog.tsx` | `client/src/components/Topics/ImportDialog.tsx` |
| `client/src/components/Things/IconPicker.tsx` | `client/src/components/Topics/IconPicker.tsx` |
| `client/src/components/Things/ColorPicker.tsx` | `client/src/components/Topics/ColorPicker.tsx` |
| `server/src/services/ThingService.ts` | `server/src/services/TopicService.ts` |
| `server/src/services/AgentThingsService.ts` | `server/src/services/AgentTopicsService.ts` |
| `server/src/routes/things.ts` | `server/src/routes/topics.ts` |
| `server/src/shared/thingToolsMcp.ts` | `server/src/shared/topicToolsMcp.ts` |
| `client/e2e/things-crud.spec.ts` | `client/e2e/topics-crud.spec.ts` |
| `docs/plans/thing-type-schemas.md` | `docs/plans/topic-type-schemas.md` |

### Type Renames

| Current | New |
|---------|-----|
| `Thing` | `Topic` |
| `ThingMetadata` | `TopicMetadata` |
| `ThingTypeSchema` | `TopicTypeSchema` |
| `ThingAttachment` | `TopicAttachment` |
| `ThingIdeaCounts` | `TopicIdeaCounts` |
| `ThingLink` | `TopicLink` |
| `ThingDocument` | `TopicDocument` |
| `ThingTreeNode` | `TopicTreeNode` |
| `ThingReference` | `TopicReference` |
| `CreateThingInput` | `CreateTopicInput` |
| `UpdateThingInput` | `UpdateTopicInput` |
| `ThingFilter` | `TopicFilter` |
| `ThingType` | `TopicType` |
| `ThingIcon` | `TopicIcon` |
| `ThingColor` | `TopicColor` |
| `ThingLinkType` | `TopicLinkType` |
| `ThingService` | `TopicService` |
| `ThingsContext` | `TopicsContext` |
| `ThingsContextValue` | `TopicsContextValue` |
| `SchemaThing` | `SchemaTopic` |

### Constant Renames

| Current | New |
|---------|-----|
| `THING_TYPE_SCHEMAS` | `TOPIC_TYPE_SCHEMAS` |
| `PREDEFINED_THING_TYPES` | `PREDEFINED_TOPIC_TYPES` |
| `RESERVED_FIELD_NAMES` | (no change - not thing-specific) |

### API Endpoint Renames

| Current | New |
|---------|-----|
| `GET /api/things` | `GET /api/topics` |
| `GET /api/things/graph` | `GET /api/topics/graph` |
| `GET /api/things/recent` | `GET /api/topics/recent` |
| `GET /api/things/:id` | `GET /api/topics/:id` |
| `POST /api/things` | `POST /api/topics` |
| `PUT /api/things/:id` | `PUT /api/topics/:id` |
| `DELETE /api/things/:id` | `DELETE /api/topics/:id` |
| `POST /api/things/:id/links` | `POST /api/topics/:id/links` |
| `DELETE /api/things/:id/links/:linkId` | `DELETE /api/topics/:id/links/:linkId` |
| `POST /api/things/:id/documents` | `POST /api/topics/:id/documents` |
| `DELETE /api/things/:id/documents/:docId` | `DELETE /api/topics/:id/documents/:docId` |
| `GET /api/ideas/by-thing/:thingId` | `GET /api/ideas/by-topic/:topicId` |

### MCP Tool Renames

| Current | New |
|---------|-----|
| `thing_search` | `topic_search` |
| `thing_get` | `topic_get` |
| `thing_list` | `topic_list` |
| `thing_read_linked_files` | `topic_read_linked_files` |
| `thing_create` | `topic_create` |
| `thing_update` | `topic_update` |
| `thing_delete` | `topic_delete` |
| `thing_move` | `topic_move` |
| `thing_add_link` | `topic_add_link` |
| `thing_remove_link` | `topic_remove_link` |
| `thing_get_schema` | `topic_get_schema` |
| `thing_list_schemas` | `topic_list_schemas` |
| `thing_create_schema` | `topic_create_schema` |
| `thing_update_schema` | `topic_update_schema` |
| `thing_delete_schema` | `topic_delete_schema` |
| `thing_apply_schema` | `topic_apply_schema` |
| `thing_validate_properties` | `topic_validate_properties` |

### Function/Method Renames

| Current | New |
|---------|-----|
| `fetchThings()` | `fetchTopics()` |
| `fetchThingsGraph()` | `fetchTopicsGraph()` |
| `fetchRecentThings()` | `fetchRecentTopics()` |
| `searchThings()` | `searchTopics()` |
| `createThing()` | `createTopic()` |
| `getThing()` | `getTopic()` |
| `updateThing()` | `updateTopic()` |
| `deleteThing()` | `deleteTopic()` |
| `createThingsBulk()` | `createTopicsBulk()` |
| `deleteThingsBulk()` | `deleteTopicsBulk()` |
| `getThingReferences()` | `getTopicReferences()` |
| `setActiveThingId()` | `setActiveTopicId()` |
| `useThingIdeas()` | `useTopicIdeas()` |
| `thingIdeasPath()` | `topicIdeasPath()` |

### Variable/Property Renames

| Current | New |
|---------|-----|
| `things` | `topics` |
| `thingId` | `topicId` |
| `thingIds` | `topicIds` |
| `activeThingId` | `activeTopicId` |
| `filteredThings` | `filteredTopics` |
| `rootThings` | `rootTopics` |
| `parentThingId` | `parentTopicId` |
| `contextThingId` | `contextTopicId` |
| `contextThingName` | `contextTopicName` |
| `repoThingId` | `repoTopicId` |
| `packageThingId` | `packageTopicId` |
| `relatedProject` (thing-ref) | (no change - already generic) |

### WebSocket Event Renames

| Current | New |
|---------|-----|
| `notifyResourceCreated(..., 'thing')` | `notifyResourceCreated(..., 'topic')` |
| `notifyResourceUpdated(..., 'thing')` | `notifyResourceUpdated(..., 'topic')` |
| `notifyResourceDeleted(..., 'thing')` | `notifyResourceDeleted(..., 'topic')` |

### UI Text Updates

| Current | New |
|---------|-----|
| "New thing" | "New topic" |
| "Thing not found" | "Topic not found" |
| "Select a thing" | "Select a topic" |
| "Things" (nav button) | "Topics" |
| "Create a Thing" | "Create a topic" / "Track a topic" |
| "I created a Thing" | "I'm tracking a topic" / "Added topic" |

### Data Storage Changes

| Current | New |
|---------|-----|
| `~/Ideate/things/` | `~/Ideate/topics/` |
| `~/Ideate/things/attachments/` | `~/Ideate/topics/attachments/` |
| `{thingId}.meta.json` | `{topicId}.meta.json` |
| `_schemas` folder (for Things) | `_schemas` folder (for Topics) |

---

## Facilitator Behavioral Changes

Beyond the rename, the Facilitator needs enhanced behavior to make Topics feel natural.

### Natural Language Topic Inference

The Facilitator should recognize when users are describing work that warrants a Topic, without requiring explicit commands.

**Triggers for Topic inference:**
- "I'm working on..." / "I'm building..."
- "I need to..." / "I want to..."
- "Help me with..." / "Can you help me organize..."
- "I started..." / "I've been thinking about..."
- Repeated mentions of a named concept across messages

**Example conversation:**

```
User: "I'm working on a feature for caching API responses"

Facilitator: "I see you're working on API response caching. Would you like me
to track this as a topic? I could create:

  📁 Topic: 'API Response Caching'

This helps me remember context about this work across our conversations."

User: "Sure"

Facilitator: "Created topic 'API Response Caching'. As you work on this, I'll
associate relevant ideas, notes, and links with it. Just mention it naturally
and I'll keep everything organized."
```

### Intelligent Hierarchical Organization

When the Facilitator detects patterns, it should suggest organizational structures.

**Pattern detection examples:**

1. **Collection inference:**
   ```
   User mentions "book report for To Kill a Mockingbird"
   Later mentions "book report for 1984"

   Facilitator: "I notice you're working on multiple book reports. Would you
   like me to organize them under a 'Book Reports' collection topic? This would
   group:

     📁 Book Reports
       └─ To Kill a Mockingbird
       └─ 1984

   I can do this now, or you can organize them yourself later."
   ```

2. **Feature grouping for developers:**
   ```
   User frequently mentions features for "^app" (a caret-reference to an app topic)

   Facilitator: "I've noticed you often work on features for @claude-flow.
   Would you like me to create a 'Features' collection under that project?
   Current features I'm tracking:

     📁 @claude-flow
       └─ 📁 Features
           └─ API Response Caching
           └─ WebSocket Reconnection
           └─ Batch Import

   This keeps feature work organized separately from bugs, docs, etc."
   ```

### User Pattern Notes

The Facilitator should maintain notes about user organizational preferences.

**Stored observations (in user/workspace context):**

```typescript
interface UserOrganizationPreferences {
  // Observed patterns
  patterns: Array<{
    observation: string;        // "User creates features frequently"
    suggestedStructure?: string; // "Features collection per project"
    userApproved?: boolean;     // Did user accept this suggestion?
    timestamp: string;
  }>;

  // Explicit preferences
  preferences: {
    autoCreateCollections: boolean;  // Default: false (ask first)
    suggestHierarchy: boolean;       // Default: true
    namingConvention?: string;       // e.g., "kebab-case", "Title Case"
  };
}
```

**Facilitator prompt additions:**

```markdown
## Topic Organization Intelligence

You observe user behavior to suggest helpful organizational structures. Key principles:

1. **Never auto-organize without permission** - Always ask before creating
   collection topics or restructuring hierarchy.

2. **Detect patterns** - Note when users create similar topics repeatedly:
   - Multiple "book reports" → suggest "Book Reports" collection
   - Multiple "features" for a project → suggest "Features" folder
   - Multiple "bugs" → suggest "Bugs" or "Issues" collection

3. **Suggest, don't assume** - Present your suggestion clearly with:
   - What pattern you observed
   - What structure you'd create
   - Ask for approval before proceeding

4. **Remember preferences** - If user accepts/rejects a pattern once, remember:
   - "User prefers flat structure for features"
   - "User likes collection topics for assignments"

5. **Natural topic extraction** - When users describe work naturally:
   - "I'm working on X" → Offer to track X as a topic
   - Don't require explicit "create a topic" commands
   - Use language like "track this topic" not "create a Thing"
```

### Communication Style

**Avoid:**
- "I created a Thing called..."
- "Would you like to add a Thing?"
- "This Thing has..."

**Prefer:**
- "I'm tracking this as a topic: [name]"
- "Would you like me to track this as a topic?"
- "This topic includes..."
- "Added to your topics: [name]"
- "Organizing under topic: [name]"

---

## Implementation Phases

### Phase 1: Core Rename (Files & Types)

**Estimated scope:** ~50 files

**Tasks:**

1. **Rename type definition files:**
   - `thing.ts` → `topic.ts`
   - Update all type names within

2. **Rename component files:**
   - Rename `Things/` directory to `Topics/`
   - Rename all component files inside
   - Update component names and exports

3. **Rename context file:**
   - `ThingsContext.tsx` → `TopicsContext.tsx`
   - Update context name and all usages

4. **Rename hooks:**
   - `useThingIdeas.ts` → `useTopicIdeas.ts`
   - Update hook name and internal references

5. **Rename server files:**
   - `ThingService.ts` → `TopicService.ts`
   - `AgentThingsService.ts` → `AgentTopicsService.ts`
   - `things.ts` (routes) → `topics.ts`
   - `thingToolsMcp.ts` → `topicToolsMcp.ts`

6. **Update all imports across codebase**

7. **Rename E2E test file:**
   - `things-crud.spec.ts` → `topics-crud.spec.ts`

### Phase 2: API & MCP Tools Rename

**Tasks:**

1. **Update route registration:**
   - Change `/api/things` to `/api/topics` in router

2. **Update MCP tool names:**
   - Rename all `thing_*` tools to `topic_*`
   - Update tool descriptions to use "topic" terminology

3. **Update client API calls:**
   - Search/replace API endpoint URLs
   - Update fetch calls and error messages

4. **Update WebSocket events:**
   - Change resource type from `'thing'` to `'topic'`

5. **Update dataBus resource paths:**
   - `thingIdeasPath` → `topicIdeasPath`
   - Path array: `['things', id, 'ideas']` → `['topics', id, 'ideas']`

### Phase 3: Data Migration

**Tasks:**

1. **Create migration script:**
   ```typescript
   async function migrateThingsToTopics() {
     // Rename storage directory
     // ~/Ideate/things/ → ~/Ideate/topics/

     // Update any internal references in stored data
     // (thingId fields → topicId if stored in JSON)
   }
   ```

2. **Handle backwards compatibility (optional):**
   - Symlink `things/` → `topics/` for transition period
   - Or: clean break with migration required

3. **Update documentation:**
   - Rename `thing-type-schemas.md` → `topic-type-schemas.md`
   - Update all references in docs

### Phase 4: UI Text & UX Updates

**Tasks:**

1. **Update navigation:**
   - "Things" tab → "Topics" tab

2. **Update dialog text:**
   - "New thing" → "New topic"
   - "Create a Thing" → "Create a topic"
   - Error messages

3. **Update empty states:**
   - "No things yet" → "No topics yet"
   - Instructional text

4. **Update placeholder text:**
   - Input placeholders
   - Search placeholders

### Phase 5: Facilitator Intelligence

**Tasks:**

1. **Update Facilitator prompts:**
   - Replace all "Thing" references with "Topic"
   - Add natural language inference instructions
   - Add pattern detection guidance

2. **Add user preference storage:**
   - Store organizational pattern observations
   - Remember approved/rejected suggestions

3. **Implement suggestion flow:**
   - Detect repeated similar topic creation
   - Generate hierarchy suggestions
   - Ask for approval before restructuring

4. **Update agent communication style:**
   - "I created a Thing" → "I'm tracking this topic"
   - "Add a Thing" → "Track a topic"

### Phase 6: Testing & Validation

**Tasks:**

1. **Update E2E tests:**
   - Rename test file
   - Update selectors and assertions

2. **Manual testing checklist:**
   - [ ] Create topic via UI
   - [ ] Create topic via Facilitator chat
   - [ ] Topic hierarchy works
   - [ ] Topic detail view loads
   - [ ] Ideas linked to topics
   - [ ] Search finds topics
   - [ ] WebSocket sync works

3. **Verify no "Thing" references remain:**
   ```bash
   grep -r "Thing" apps/ideate/client/src --include="*.ts" --include="*.tsx"
   grep -r "thing" apps/ideate/server/src --include="*.ts"
   ```

---

## Conversation Examples

### Example 1: Natural Topic Creation

```
User: "I'm working on a feature for ^claude-flow that adds batch import
functionality"

Facilitator: "I see you're working on batch import for claude-flow. Would you
like me to track this as a topic?

  📁 Topic: 'Batch Import'
  └─ Parent: @claude-flow

This helps me remember context about this feature across our conversations."

User: "Yes please"

Facilitator: "Done! I'm now tracking 'Batch Import' under @claude-flow. As you
work on this, I'll associate relevant ideas and notes with it."
```

### Example 2: Collection Suggestion

```
User: "I need to write a book report on 1984"

Facilitator: "I'm tracking a new topic: 'Book Report: 1984'

I notice you also have 'Book Report: To Kill a Mockingbird'. Would you like
me to organize these under a 'Book Reports' collection?

  📁 Book Reports
    └─ To Kill a Mockingbird
    └─ 1984

This keeps all your book reports grouped together."

User: "That would be great"

Facilitator: "Done! Created 'Book Reports' collection and organized both
reports inside it. Future book reports can go here too."
```

### Example 3: Pattern Learning

```
[After user has created several features for different projects]

Facilitator: "I've noticed a pattern in how you organize work: you frequently
create feature topics for your projects. Would you like me to automatically
suggest a 'Features' folder when you start working on features for a project?

Options:
1. Yes, always suggest organizing features
2. No, I prefer to organize manually
3. Ask me each time"

User: "Option 1"

Facilitator: "Got it! From now on, when you create feature topics, I'll
suggest organizing them under a 'Features' folder in the relevant project."
```

---

## Success Criteria

### Phase 1-4 (Rename)
- [ ] No files contain "Thing" in filename (except historical docs if preserved)
- [ ] No types named `Thing*` or `*Thing*`
- [ ] No API endpoints use `/things`
- [ ] No MCP tools named `thing_*`
- [ ] All UI text uses "topic" terminology
- [ ] Data migration completes without data loss
- [ ] All tests pass with renamed entities

### Phase 5 (Facilitator Intelligence)
- [ ] Facilitator infers topics from natural conversation
- [ ] Facilitator suggests collections when patterns emerge
- [ ] Facilitator asks for approval before organizing
- [ ] User preferences are stored and respected
- [ ] Communication uses natural "topic" language, not "Thing"

### Overall UX
- [ ] Users never need to say "create a topic" - natural language works
- [ ] Organizational suggestions feel helpful, not intrusive
- [ ] The concept of "Topics" is immediately understandable to new users

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration fails | High - data loss | Backup before migration; test on copy first |
| Missed renames cause runtime errors | Medium - broken features | Comprehensive grep search; full test suite |
| API changes break clients | Medium - integration issues | Version API if needed; coordinate deploy |
| User confusion during transition | Low - UX friction | Clear messaging if any deprecation period |
| Facilitator over-suggests | Medium - annoying UX | Default to ask permission; respect "no" |

---

## Related Documents

- [Workspace Hierarchy](./02-workspace-hierarchy.md) - Personal workspace for schema library (do this second)
- [Topic Type Schemas](./03-topic-type-schemas.md) - Schema system using Topic terminology (do this third)

---

## Appendix: Grep Commands for Verification

After completion, run these to verify no "Thing" references remain:

```bash
# Check for Thing in TypeScript files
grep -rn "Thing" apps/ideate/client/src --include="*.ts" --include="*.tsx" | grep -v "// Thing" | grep -v "Something"

# Check for thing_ MCP tools
grep -rn "thing_" apps/ideate/server/src --include="*.ts"

# Check for /things API routes
grep -rn "/things" apps/ideate --include="*.ts" --include="*.tsx"

# Check for thing in file names
find apps/ideate -name "*thing*" -o -name "*Thing*"
```
