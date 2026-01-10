# Workspace Hierarchy Redesign

## Problem Statement

The current workspace model has limitations:

1. **No personal space** - Users must explicitly create a workspace to do anything
2. **No default home** - New users face a "create workspace" barrier before they can start
3. **Flat navigation** - "Workspaces" is a nav button alongside Topics/Ideas/Documents, but it's a different concept (container vs content)
4. **Settings buried** - Gear icon is hidden inside avatar dropdown

Users should have a personal workspace that:
- Exists automatically (no setup required)
- Is always private (can't be shared)
- Serves as their default home
- Stores personal schemas, templates, and preferences

## Goals

1. **Personal workspace** - Every user has one, auto-created, private
2. **Clear hierarchy** - Personal vs Team workspaces are distinct concepts
3. **Intuitive switching** - Easy to move between personal and team workspaces
4. **Content portability** - Copy schemas/templates from personal to team workspaces
5. **Cleaner navigation** - Remove workspace as a "tab", make it a context switcher

## Design

### Workspace Types

| Type | Created | Sharing | Deletion | Purpose |
|------|---------|---------|----------|---------|
| **Personal** | Auto (on first sign-in) | Never shareable | Cannot delete | Private work, personal schemas/templates |
| **Team** | Explicit (user creates) | Via share link | Owner can delete | Collaboration, shared content |

### Personal Workspace Characteristics

- **ID**: `personal-{userId}` (deterministic, predictable)
- **Name**: "Personal" (not editable)
- **Owner**: The user (always)
- **Members**: None (always empty, can't add)
- **Share token**: Never generated (sharing disabled)
- **Default**: User lands here on sign-in if no workspace selected

### Data Model Changes

```typescript
interface WorkspaceMetadata {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;

  // NEW
  type: 'personal' | 'team';  // Distinguish workspace types
}
```

**Constraints enforced by API:**
- `type: 'personal'` workspaces:
  - Cannot update `name` (always "Personal")
  - Cannot update `memberIds` (always empty)
  - Cannot generate share token
  - Cannot delete
- Only one personal workspace per user

### Navigation Redesign

#### Current Header Layout
```
+-------------------------------------------------------------+
| [Logo]  [Topics] [Ideas] [Documents] [Workspaces]    [sun] [avatar] |
+-------------------------------------------------------------+
```

#### Proposed Header Layout
```
+-------------------------------------------------------------+
| [Logo]  [Workspace v]  [Topics] [Ideas] [Documents]   [gear v] [avatar] |
+-------------------------------------------------------------+
```

**Changes:**
1. **Remove** "Workspaces" nav button
2. **Add** Workspace switcher dropdown after logo (left side)
3. **Move** gear icon out of avatar dropdown, place next to avatar
4. **Simplify** avatar to just show user (no dropdown, or minimal dropdown)

### Workspace Switcher Dropdown

Located after logo, shows current workspace name with dropdown arrow.

```
+--------------------------+
| check Personal           |  <-- Current selection (checkmark)
+--------------------------+
|   Team Alpha             |  <-- Team workspaces
|   Project Beta           |
|   Client X               |
+--------------------------+
| + Create workspace...    |  <-- Creates new team workspace
+--------------------------+
```

**Behavior:**
- Shows "Personal" at top (always first, with home icon?)
- Lists team workspaces below (alphabetical or recent)
- Checkmark on current selection
- "Create workspace" at bottom
- Clicking switches workspace context immediately

### Settings Dropdown (Gear Icon)

New gear icon dropdown next to avatar:

```
+--------------------------+
| User Settings            |  -> /settings (profile, preferences)
+--------------------------+
| Manage Workspaces        |  -> /workspaces (list, create, delete)
+--------------------------+
```

**Rationale:**
- "User Settings" = personal preferences, profile, appearance
- "Manage Workspaces" = CRUD operations on workspaces (vs switcher which is quick selection)

### Avatar Behavior

Two options:

**Option A: Avatar is not clickable (simplest)**
- Just displays user identity
- All actions via gear dropdown

**Option B: Avatar has minimal dropdown**
```
+--------------------------+
| Signed in as David       |
+--------------------------+
| Sign Out                 |
+--------------------------+
```

**Recommendation**: Option B - keeps sign out accessible without going to settings

### URL Structure

Current:
- `/workspaces` - Workspace list
- `/workspace/{id}` - Specific workspace (but what content?)
- `/topics`, `/ideas`, `/documents` - Content pages (implicitly within current workspace)

Proposed:
- `/settings` - User settings (unchanged)
- `/workspaces` - Manage workspaces (list, create, edit, delete)
- `/topics`, `/ideas`, `/documents` - Content pages (workspace from context/state)
- No `/workspace/{id}` needed - switching workspace changes context, not URL

**Note**: The workspace context is stored in state (e.g., localStorage or React context), not in the URL path. This keeps URLs clean and matches how users think ("I'm looking at my Topics" vs "I'm looking at Topics in workspace X").

### Content Copying Flow

When user wants to copy a schema from personal to team workspace:

1. User is in **Personal** workspace, viewing schemas
2. User clicks "Copy to workspace" on a schema
3. Modal shows list of team workspaces
4. User selects target workspace
5. Schema is duplicated into target workspace
6. Success toast: "Schema copied to Team Alpha"

```
+-----------------------------------------+
| Copy "Package" schema to...             |
+-----------------------------------------+
| o Team Alpha                            |
| o Project Beta                          |
| o Client X                              |
+-----------------------------------------+
|                      [Cancel] [Copy]    |
+-----------------------------------------+
```

**Behavior:**
- Creates independent copy (no sync/reference)
- If schema with same `targetType` exists in destination, show warning
- Option to overwrite or rename

## Implementation Phases

### Phase 1: Data Model & API

**Files to modify:**
- `server/src/types/workspace.ts` - Add `type` field
- `server/src/services/WorkspaceService.ts` - Personal workspace logic
- `server/src/routes/workspaces.ts` - Enforce personal workspace constraints

**Tasks:**
1. Add `type: 'personal' | 'team'` to `WorkspaceMetadata`
2. Create personal workspace on first API call if doesn't exist
3. Enforce constraints (no sharing, no delete, no rename for personal)
4. Add `GET /api/workspaces/personal` endpoint for convenience
5. Migrate existing workspaces to `type: 'team'`

### Phase 2: Navigation Redesign

**Files to modify:**
- `client/src/components/AppLayout/AppLayout.tsx` - Header restructure
- `client/src/components/WorkspaceSwitcher/` - New component
- `client/src/components/SettingsDropdown/` - New component
- `client/src/contexts/WorkspaceContext.tsx` - Current workspace state

**Tasks:**
1. Create `WorkspaceSwitcher` component
2. Create `SettingsDropdown` component
3. Update `AppLayout` header structure
4. Remove "Workspaces" from main nav buttons
5. Update avatar dropdown (simplify to just sign out)
6. Store current workspace selection in localStorage
7. Default to personal workspace if none selected

### Phase 3: Workspace Management Page

**Files to modify:**
- `client/src/pages/Workspaces.tsx` - Update to management focus

**Tasks:**
1. Rename/refocus page as "Manage Workspaces"
2. Show personal workspace at top (non-deletable, no share option)
3. List team workspaces with full CRUD
4. Add workspace type badges
5. Link from gear dropdown

### Phase 4: Content Copying

**Files to modify:**
- `client/src/components/CopyToWorkspaceModal/` - New component
- `server/src/services/TopicService.ts` - Copy operation
- `server/src/routes/topics.ts` - Copy endpoint

**Tasks:**
1. Create `CopyToWorkspaceModal` component
2. Add "Copy to workspace" action to schema list items
3. Implement `POST /api/topics/{id}/copy` endpoint
4. Handle duplicate `targetType` scenarios
5. Add success/error toasts

## Migration Strategy

### Existing Users

When an existing user signs in after this change:

1. **Check for personal workspace**: `personal-{userId}`
2. **If not exists**: Create it automatically
3. **If exists**: No action needed (shouldn't happen, but handle gracefully)
4. **Existing workspaces**: Set `type: 'team'` on all existing workspaces

### New Users

On first sign-in:
1. Create personal workspace automatically
2. Land user in personal workspace
3. Show onboarding hint: "This is your personal workspace. Create a team workspace to collaborate."

### Data Migration Script

```typescript
async function migrateWorkspaces() {
  const workspaces = await getAllWorkspaces();

  for (const ws of workspaces) {
    if (!ws.type) {
      // Existing workspace without type = team
      await updateWorkspace(ws.id, { type: 'team' });
    }
  }

  // Create personal workspaces for all existing users
  const users = await getAllUsers();
  for (const user of users) {
    const personalId = `personal-${user.id}`;
    const exists = await workspaceExists(personalId);
    if (!exists) {
      await createWorkspace({
        id: personalId,
        name: 'Personal',
        type: 'personal',
        ownerId: user.id,
        memberIds: [],
      });
    }
  }
}
```

## Open Questions

### 1. Personal workspace content scope
**Question**: Should ALL content types live in personal workspace, or just schemas/templates?

**Recommendation**: All content types. Personal workspace is a full workspace, just private. Users can:
- Create Topics, Ideas, Documents in personal space
- Copy any of them to team workspaces when ready to share

### 2. Workspace-specific settings
**Question**: Should workspaces have their own settings (beyond schemas)?

**Recommendation**: Defer. Start with schemas only. If needed, add workspace settings later:
- Default document template
- Notification preferences
- Agent behavior settings

### 3. Personal workspace naming
**Question**: Should it be called "Personal", "My Workspace", "Home", or something else?

**Recommendation**: "Personal" - clear, concise, distinguishes from team spaces.

### 4. Workspace switcher location
**Question**: Left side (after logo) vs right side (near avatar)?

**Recommendation**: Left side. The workspace context affects what content you see (Topics, Ideas, Documents), so it belongs near the content navigation, not near user actions.

## Success Criteria

- [ ] Personal workspace auto-created on first sign-in
- [ ] Personal workspace cannot be shared, renamed, or deleted
- [ ] Workspace switcher in header allows quick switching
- [ ] Gear dropdown provides access to settings and workspace management
- [ ] "Workspaces" removed from main nav buttons
- [ ] Schemas can be copied from personal to team workspaces
- [ ] Existing users see their workspaces migrated to "team" type
- [ ] New users land in personal workspace by default

## Relationship to Other Plans

This plan is a **prerequisite** for the Topic Type Schemas feature ([03-topic-type-schemas.md](./03-topic-type-schemas.md)). Specifically:

- **Personal schemas**: Users create schemas in personal workspace
- **Copy to team**: Schemas copied to team workspaces for collaboration
- **Default schemas**: Created in personal workspace on first sign-in

**Plan sequence:**
1. [01-things-to-topics-rename.md](./01-things-to-topics-rename.md) - Rename Things to Topics first
2. This plan (02) - Workspace hierarchy
3. [03-topic-type-schemas.md](./03-topic-type-schemas.md) - Topic schemas (depends on this plan)
