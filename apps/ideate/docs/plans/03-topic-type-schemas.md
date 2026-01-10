# Topic Type Schemas

> **Dependency**: This plan depends on [Workspace Hierarchy Redesign](./02-workspace-hierarchy.md) for personal workspace support. Default schemas will be created in the user's personal workspace and can be copied to team workspaces.

> **Prerequisite**: The [Topics Rename](./01-things-to-topics-rename.md) should be completed first so all code uses "Topic" terminology.

## Problem Statement

Topics currently lack type-specific metadata. When a user creates a "Package" Topic, there's no structured way to store:
- Disk path
- Repository URL
- Version
- Package manager

Similarly, an "Assignment" Topic has no fields for:
- Subject
- Due date
- Course

This causes several issues:
1. **Lost context** - Important metadata isn't captured at creation time
2. **Agent inefficiency** - Agents must re-discover information that could be cached
3. **Poor discoverability** - Users can't see key info at a glance (like folder paths)
4. **Inconsistent data** - No guidance on what fields matter per type

## Goals

1. **Type-specific schemas** - Define what fields matter for each Topic type
2. **User-customizable** - Users can create/edit schemas for their needs
3. **Agent-aware** - Facilitator and other agents populate metadata at creation time
4. **Prominent display** - Key fields shown at top of Topic view (like folder paths)
5. **Dynamic schema creation** - Facilitator can suggest new schemas for unknown types

## Design

### Schema Storage: Schema Topics

Schemas are stored as Topics with `type: "schema"`. This approach:
- Uses existing infrastructure (no new storage system)
- Agents can manage schemas with existing tools
- Schemas are workspace-scoped and syncable
- Users can organize schemas in folders

#### Schema Topic Structure

```typescript
interface SchemaFieldDefinition {
  name: string;           // Property key, e.g., "path", "dueDate"
  label: string;          // Display label, e.g., "Path", "Due Date"
  type: FieldType;        // Data type for validation/display
  required?: boolean;     // Must be populated on creation
  description?: string;   // Help text for agents/users
  defaultValue?: unknown; // Default value when creating a Topic
  multiple?: boolean;     // Allow array of values (e.g., multiple tags)

  // Type-specific options
  options?: string[];           // For 'select' and 'multiselect' types
  allowedTypes?: string[];      // For 'topic-ref': restrict to specific Topic types
  min?: number;                 // For 'number': minimum value
  max?: number;                 // For 'number': maximum value
  pattern?: string;             // For 'string': regex validation pattern
}

type FieldType =
  | 'string'      // Free text
  | 'text'        // Multi-line text (textarea)
  | 'path'        // File/folder path (shows path picker)
  | 'url'         // URL (validates, shows as link)
  | 'date'        // Date (shows date picker)
  | 'datetime'    // Date + time
  | 'number'      // Numeric value
  | 'version'     // Semver-style version (validates X.Y.Z format)
  | 'email'       // Email address (validates format)
  | 'select'      // Dropdown (requires `options` array)
  | 'multiselect' // Multiple selection (requires `options` array)
  | 'topic-ref'   // Reference to another Topic (optionally scoped by `allowedTypes`)
  | 'tags'        // Array of free-form strings (rendered as chips)

// Reserved field names that cannot be used in schemas
const RESERVED_FIELD_NAMES = ['id', 'type', 'name', 'description', 'createdAt', 'updatedAt', 'parentId'];

interface SchemaTopic {
  id: string;
  type: 'schema';
  name: string;           // e.g., "Package", "Assignment"
  description?: string;   // What this type is for
  properties: {
    targetType: string;   // The type this schema applies to, e.g., "package"
    keyFields: SchemaFieldDefinition[];      // Shown prominently at top
    optionalFields: SchemaFieldDefinition[]; // Available but not prominent
    validationMode: 'strict' | 'warn' | 'none'; // How to handle invalid data
  };
}
```

#### Field Type Validation Rules

| Type | Validation | Example Valid Value |
|------|------------|---------------------|
| `string` | Any text, optional `pattern` regex | `"Hello world"` |
| `text` | Any text, supports newlines | `"Line 1\nLine 2"` |
| `path` | Non-empty string, stored as-is (absolute or relative) | `"/Users/foo/project"` |
| `url` | Must be valid URL with protocol (http/https/file) | `"https://github.com/..."` |
| `date` | ISO 8601 date (YYYY-MM-DD) | `"2024-01-15"` |
| `datetime` | ISO 8601 datetime | `"2024-01-15T14:30:00Z"` |
| `number` | Numeric, optional `min`/`max` bounds | `42` or `3.14` |
| `version` | Semver format (X.Y.Z with optional prerelease) | `"1.2.3"` or `"2.0.0-beta.1"` |
| `email` | RFC 5322 email format | `"user@example.com"` |
| `select` | Must match one of `options` | `"npm"` |
| `multiselect` | Array of values from `options` | `["npm", "yarn"]` |
| `topic-ref` | Valid Topic ID (optionally matching `allowedTypes`) | `"topic-abc123"` |
| `tags` | Array of non-empty strings | `["frontend", "react", "ui"]` |

#### Schema Storage and Protection

Schemas are stored as Topics but require special handling:

1. **System folder**: Schemas are stored in a hidden `_schemas` folder at workspace root
   - Not visible in normal Topic browsing
   - Accessible via Workspace Settings > Topic Types
   - Prevents accidental deletion

2. **Unique targetType constraint**: Only one schema can exist per `targetType` in a workspace
   - `topic_create_schema` returns error if schema for type already exists
   - Use `topic_update_schema` to modify existing schemas

3. **Deletion protection**: Schemas cannot be deleted if Topics of that type exist
   - `topic_delete_schema` checks for existing Topics first
   - Returns count of affected Topics and requires `force: true` to proceed
   - With `force: true`, existing Topics retain their properties but lose schema association

#### Example: Package Schema

```json
{
  "id": "schema-package",
  "type": "schema",
  "name": "Package",
  "description": "Schema for software packages (npm, pip, etc.)",
  "properties": {
    "targetType": "package",
    "validationMode": "warn",
    "keyFields": [
      { "name": "path", "label": "Path", "type": "path", "required": true },
      { "name": "version", "label": "Version", "type": "version" },
      { "name": "repository", "label": "Repository", "type": "url" }
    ],
    "optionalFields": [
      { "name": "packageManager", "label": "Package Manager", "type": "select", "options": ["npm", "pnpm", "yarn", "pip", "cargo"] },
      { "name": "license", "label": "License", "type": "string" },
      { "name": "homepage", "label": "Homepage", "type": "url" },
      { "name": "tags", "label": "Tags", "type": "tags" }
    ]
  }
}
```

#### Example: Assignment Schema

```json
{
  "id": "schema-assignment",
  "type": "schema",
  "name": "Assignment",
  "description": "Schema for homework, projects, and other assignments",
  "properties": {
    "targetType": "assignment",
    "validationMode": "warn",
    "keyFields": [
      { "name": "subject", "label": "Subject", "type": "string", "required": true },
      { "name": "dueDate", "label": "Due Date", "type": "datetime" }
    ],
    "optionalFields": [
      { "name": "course", "label": "Course", "type": "string" },
      { "name": "points", "label": "Points", "type": "number", "min": 0 },
      { "name": "status", "label": "Status", "type": "select", "options": ["Not Started", "In Progress", "Completed", "Submitted"], "defaultValue": "Not Started" },
      { "name": "tags", "label": "Tags", "type": "tags" }
    ]
  }
}
```

#### Example: Meeting Schema (with topic-ref)

```json
{
  "id": "schema-meeting",
  "type": "schema",
  "name": "Meeting",
  "description": "Schema for meetings and appointments",
  "properties": {
    "targetType": "meeting",
    "validationMode": "warn",
    "keyFields": [
      { "name": "date", "label": "Date & Time", "type": "datetime", "required": true },
      { "name": "attendees", "label": "Attendees", "type": "topic-ref", "allowedTypes": ["person"], "multiple": true }
    ],
    "optionalFields": [
      { "name": "location", "label": "Location", "type": "string" },
      { "name": "agenda", "label": "Agenda", "type": "text" },
      { "name": "notes", "label": "Notes", "type": "text" },
      { "name": "relatedProject", "label": "Related Project", "type": "topic-ref", "allowedTypes": ["project"] }
    ]
  }
}
```

### Default Schemas

Created automatically when a workspace is initialized (all with `validationMode: "warn"`):

| Type | Key Fields | Optional Fields |
|------|------------|-----------------|
| `folder` | path (path, required) | tags (tags) |
| `package` | path (path, required), version (version), repository (url) | packageManager (select), license (string), homepage (url), tags (tags) |
| `project` | path (path, required), repository (url), status (select) | startDate (date), endDate (date), tags (tags) |
| `app` | path (path, required), version (version), repository (url) | platform (select), bundler (select), tags (tags) |
| `assignment` | subject (string, required), dueDate (datetime) | course (string), points (number), status (select, default: "Not Started"), tags (tags) |
| `person` | email (email), role (string) | phone (string), organization (string), tags (tags) |
| `meeting` | date (datetime, required), attendees (topic-ref[], allowedTypes: ["person"]) | location (string), agenda (text), notes (text), relatedProject (topic-ref, allowedTypes: ["project"]) |
| `document` | path (path, required) | author (string), lastModified (datetime), tags (tags) |

**Note**: The `topic-ref[]` notation indicates `multiple: true` for the field.

### MCP Tools

#### `topic_get_schema`

Get the schema for a Topic type. Agents call this before creating Topics to know what fields to populate.

```typescript
tool(
  'topic_get_schema',
  'Get the schema definition for a Topic type. Returns key and optional fields that should be populated.',
  {
    type: z.string().describe('The Topic type to get schema for (e.g., "package", "assignment")'),
    workspaceId: z.string().optional().describe('Workspace ID (uses current if not specified)'),
  }
)
// Returns: Schema definition or null if no schema exists for type
```

#### `topic_list_schemas`

List all schemas in a workspace.

```typescript
tool(
  'topic_list_schemas',
  'List all Topic type schemas in the workspace.',
  {
    workspaceId: z.string().optional().describe('Workspace ID (uses current if not specified)'),
  }
)
// Returns: Array of schema summaries (id, name, targetType, fieldCount)
```

#### `topic_create_schema`

Create a new schema for a Topic type.

```typescript
tool(
  'topic_create_schema',
  'Create a new schema for a Topic type. Use when encountering a new type that should have structured metadata.',
  {
    name: z.string().describe('Display name for the schema (e.g., "Recipe")'),
    targetType: z.string().describe('The Topic type this schema applies to (e.g., "recipe")'),
    description: z.string().optional().describe('Description of what this type is for'),
    keyFields: z.array(FieldDefinitionSchema).describe('Fields to show prominently'),
    optionalFields: z.array(FieldDefinitionSchema).optional().describe('Additional optional fields'),
    workspaceId: z.string().optional(),
  }
)
```

#### `topic_update_schema`

Update an existing schema.

```typescript
tool(
  'topic_update_schema',
  'Update an existing Topic type schema.',
  {
    schemaId: z.string().describe('ID of the schema to update'),
    name: z.string().optional(),
    description: z.string().optional(),
    keyFields: z.array(FieldDefinitionSchema).optional(),
    optionalFields: z.array(FieldDefinitionSchema).optional(),
    validationMode: z.enum(['strict', 'warn', 'none']).optional(),
  }
)
```

#### `topic_delete_schema`

Delete a schema. Checks for existing Topics of that type first.

```typescript
tool(
  'topic_delete_schema',
  'Delete a Topic type schema. Will fail if Topics of this type exist unless force=true.',
  {
    schemaId: z.string().describe('ID of the schema to delete'),
    force: z.boolean().optional().describe('Delete even if Topics of this type exist. Those Topics will retain their properties but lose schema association.'),
    workspaceId: z.string().optional(),
  }
)
// Returns: { success: boolean, deletedSchemaId?: string, affectedTopicCount?: number, error?: string }
```

#### `topic_apply_schema`

Apply a schema to existing Topics of a type. Useful when creating a schema for Topics that already exist.

```typescript
tool(
  'topic_apply_schema',
  'Apply schema defaults to existing Topics of a type. Optionally populate missing required fields.',
  {
    targetType: z.string().describe('The Topic type to apply schema to'),
    applyDefaults: z.boolean().optional().describe('Set default values for fields that have them defined'),
    workspaceId: z.string().optional(),
  }
)
// Returns: { appliedCount: number, skippedCount: number, errors: Array<{ topicId: string, error: string }> }
```

#### `topic_validate_properties`

Validate a Topic's properties against its schema without saving.

```typescript
tool(
  'topic_validate_properties',
  'Validate properties against a schema. Useful before creating or updating a Topic.',
  {
    type: z.string().describe('The Topic type'),
    properties: z.record(z.unknown()).describe('Properties to validate'),
    workspaceId: z.string().optional(),
  }
)
// Returns: { valid: boolean, errors: Array<{ field: string, message: string }>, warnings: Array<{ field: string, message: string }> }
```

### API Response Shapes

#### `topic_get_schema` Response

```typescript
interface GetSchemaResponse {
  schema: {
    id: string;
    name: string;
    description?: string;
    targetType: string;
    validationMode: 'strict' | 'warn' | 'none';
    keyFields: SchemaFieldDefinition[];
    optionalFields: SchemaFieldDefinition[];
  } | null;
}
```

#### `topic_list_schemas` Response

```typescript
interface ListSchemasResponse {
  schemas: Array<{
    id: string;
    name: string;
    targetType: string;
    description?: string;
    keyFieldCount: number;
    optionalFieldCount: number;
    topicCount: number;  // How many Topics use this schema
  }>;
}
```

#### `topic_create_schema` Response

```typescript
interface CreateSchemaResponse {
  success: boolean;
  schema?: {
    id: string;
    name: string;
    targetType: string;
  };
  error?: string;  // e.g., "Schema for type 'package' already exists"
}
```

### Reference Integrity

#### topic-ref Deletion Behavior

When a Topic is deleted that is referenced by other Topics via `topic-ref` fields:

1. **Detection**: System identifies all Topics with `topic-ref` fields pointing to the deleted Topic
2. **Nullification**: References are set to `null` (not removed from the properties object)
3. **Notification**: Deletion response includes list of affected Topics

```typescript
// topic_delete response when references exist
interface DeleteTopicResponse {
  success: boolean;
  deletedId: string;
  brokenReferences?: Array<{
    topicId: string;
    topicName: string;
    fieldName: string;
  }>;
}
```

#### Circular Reference Prevention

- `topic-ref` fields cannot create circular references
- When setting a `topic-ref` value, the system checks for cycles
- If A -> B -> C and user tries to set C -> A, the operation fails with an error

#### Enhanced `topic_create` and `topic_update`

Extend existing tools to handle typed properties:

```typescript
// topic_create gains:
properties: z.record(z.unknown()).optional().describe('Typed properties matching the schema for this Topic type')

// topic_update gains:
properties: z.record(z.unknown()).optional().describe('Properties to set/update')
```

### Facilitator Behavior

#### Schema-Aware Creation Flow

When the Facilitator creates or imports a Topic:

1. **Determine type** from user request or inference
2. **Fetch schema** via `topic_get_schema(type)`
3. **If schema exists:**
   - Identify required/key fields
   - Gather values (ask user, infer from context, research)
   - Create Topic with populated properties
4. **If no schema exists:**
   - Suggest creating one based on inferred fields
   - Ask user to confirm
   - Create schema, then create Topic

#### Dynamic Schema Creation

When encountering an unknown type:

```
User: "Create a Recipe for chocolate chip cookies"

Facilitator: "I don't have a schema for 'recipe' yet. Based on common recipe
attributes, I suggest these fields:

Key fields (shown at top):
- servings (number)
- prepTime (string)
- cookTime (string)

Optional fields:
- cuisine (string)
- difficulty (select: Easy, Medium, Hard)
- calories (number)

Should I create this schema? You can customize it later in workspace settings."
```

#### Prompt Updates

Add to Facilitator system prompt:

```markdown
## Topic Schemas

Topics have type-specific schemas that define important metadata fields.

When creating or importing a Topic:
1. Call `topic_get_schema(type)` to check if a schema exists
2. If schema exists:
   - Populate ALL required fields (marked `required: true`)
   - Populate key fields when values are known or discoverable
   - For packages: always determine path, version, repository
   - For folders: always set the path
   - For assignments: always ask for subject and due date
3. If no schema exists for the type:
   - Suggest creating a schema with reasonable fields for that type
   - Ask user to confirm before creating
   - Then create the Topic with the new schema

Use `topic_add_link` to add relevant links (repository URLs, documentation, etc.)
in addition to populating properties.
```

### UI Changes

#### Key Fields Display

In Topic detail view, key fields render prominently at the top:

```
+-----------------------------------------+
| @claude-flow/data-bus                   |
| Package                                 |
+-----------------------------------------+
| Path     ~/git/claude-flow/packages/... |
| Version  1.0.0                          |
| Repo     github.com/anthropics/...      |
+-----------------------------------------+
| Description                             |
| A reactive data synchronization bus...  |
+-----------------------------------------+
```

#### Schema Editor

Workspace Settings > Topic Types:

- List all schemas with edit/delete actions
- Add new schema button
- Per-schema editor:
  - Name, description, target type
  - Key fields list (drag to reorder)
  - Optional fields list
  - Add field button with type selector
  - Toggle required/key status

## Implementation Phases

### Phase 1: Schema Infrastructure

**Files to modify/create:**
- `server/src/types/schema.ts` - TypeScript types for schemas and field definitions
- `server/src/services/TopicService.ts` - Add schema CRUD operations
- `server/src/services/SchemaValidationService.ts` - Field validation logic
- `server/src/services/MCPToolsService.ts` - Add schema tool definitions
- `server/src/services/FacilitatorMcpTools.ts` - Expose schema tools to Facilitator
- `server/src/services/WorkspaceService.ts` - Create default schemas on workspace init

**Tasks:**
1. Define TypeScript types for schemas and field definitions
2. Implement `RESERVED_FIELD_NAMES` validation
3. Add schema CRUD methods to TopicService:
   - `getSchema(targetType)` - Get schema by type
   - `listSchemas()` - List all schemas
   - `createSchema(schema)` - Create with uniqueness check
   - `updateSchema(schemaId, updates)` - Update existing
   - `deleteSchema(schemaId, force?)` - Delete with protection
4. Add field validation service:
   - Validate each field type (semver, email, url, etc.)
   - Support `validationMode` (strict/warn/none)
   - Return structured errors/warnings
5. Add MCP tool definitions:
   - `topic_get_schema`
   - `topic_list_schemas`
   - `topic_create_schema`
   - `topic_update_schema`
   - `topic_delete_schema`
   - `topic_apply_schema`
   - `topic_validate_properties`
6. Extend `topic_create` and `topic_update` with `properties` parameter
7. Create default schemas on workspace creation
8. Add `_schemas` system folder handling

### Phase 2: Reference Integrity

**Files to modify:**
- `server/src/services/TopicService.ts` - Reference tracking
- `server/src/services/ReferenceIntegrityService.ts` - New service

**Tasks:**
1. Build reference index for `topic-ref` fields
2. On Topic deletion, find and nullify references
3. Add `brokenReferences` to delete response
4. Implement circular reference detection
5. Update `topic_delete` response shape

### Phase 3: Agent Intelligence

**Files to modify:**
- `server/src/prompts/facilitator.md` - Add schema awareness
- `server/src/services/FacilitatorService.ts` - Handle schema creation flow

**Tasks:**
1. Update Facilitator system prompt with schema guidance
2. Add instruction to call `topic_get_schema` before creating Topics
3. Add instruction to suggest schema creation for unknown types
4. Add instruction to populate all required/key fields
5. Test schema lookup and Topic creation flow
6. Test dynamic schema suggestion for unknown types
7. Test validation flow (agent asks for correction on invalid data)

### Phase 4: UI - Key Fields Display

**Files to modify/create:**
- `client/src/components/TopicDetail/KeyFieldsSection.tsx` - Key fields display
- `client/src/components/TopicDetail/FieldRenderer.tsx` - Render field by type
- `client/src/hooks/useSchemaForTopic.ts` - Fetch schema for a Topic

**Tasks:**
1. Create hook to fetch schema for a Topic's type
2. Create field renderer for each field type:
   - `string` / `text` - Text display
   - `path` - Path with "open" action
   - `url` - Clickable link
   - `date` / `datetime` - Formatted date
   - `number` - Numeric display
   - `version` - Version badge
   - `email` - Mailto link
   - `select` / `multiselect` - Badge(s)
   - `topic-ref` - Link to Topic
   - `tags` - Chip list
3. Add key fields section to Topic detail view
4. Show validation warnings for invalid/missing fields

### Phase 5: UI - Schema Editor

**Files to modify/create:**
- `client/src/pages/WorkspaceSettings/TopicTypes/` - Schema editor
- `client/src/components/SchemaEditor/SchemaFieldEditor.tsx` - Field editor
- `client/src/components/SchemaEditor/FieldTypeSelector.tsx` - Type dropdown

**Tasks:**
1. Create schema list view in settings
2. Create schema editor component:
   - Name, description, target type inputs
   - Key fields list (drag to reorder)
   - Optional fields list (drag to reorder)
   - Add field button
   - Delete field button
3. Create field editor:
   - Field name, label, description
   - Type selector with type-specific options
   - Required toggle
   - Default value input
4. Add delete schema with confirmation
5. Show Topic count per schema

## Use Cases

### Use Case 1: Import a Package

**User request**: "Add the @claude-flow/data-bus package"

**Facilitator behavior**:

1. **Determine type**: "package" (from user context or inference)

2. **Check schema**: Call `topic_get_schema("package")`
   - Returns: path (required), version, repository, packageManager, license, homepage

3. **Locate package**: Find path via glob or user hint
   - Found: `/Users/dzearing/git/claude-flow/packages/data-bus`

4. **Read package.json**:
   ```json
   {
     "name": "@claude-flow/data-bus",
     "version": "1.0.0",
     "description": "A reactive data synchronization bus...",
     "repository": {
       "type": "git",
       "url": "https://github.com/anthropics/claude-flow"
     },
     "license": "MIT",
     "homepage": "https://github.com/anthropics/claude-flow/tree/main/packages/data-bus"
   }
   ```

5. **Scan for documentation**:
   - Find README.md, CHANGELOG.md, docs/*.md
   - Extract key info from README (description, features, usage)

6. **Create Topic with properties**:
   ```typescript
   topic_create({
     name: "@claude-flow/data-bus",
     type: "package",
     description: "A reactive data synchronization bus for real-time state management",
     properties: {
       path: "/Users/dzearing/git/claude-flow/packages/data-bus",
       version: "1.0.0",
       repository: "https://github.com/anthropics/claude-flow",
       packageManager: "pnpm",
       license: "MIT",
       homepage: "https://github.com/anthropics/claude-flow/tree/main/packages/data-bus"
     }
   })
   ```

7. **Add documentation links**:
   ```typescript
   topic_add_link({ topicId, type: "path", label: "README", target: "packages/data-bus/README.md" })
   topic_add_link({ topicId, type: "path", label: "Changelog", target: "packages/data-bus/CHANGELOG.md" })
   topic_add_link({ topicId, type: "url", label: "npm", target: "https://npmjs.com/package/@claude-flow/data-bus" })
   ```

8. **Create linked documents** (optional, if significant docs exist):
   - Create a Document Topic for the README content
   - Link it to the package Topic

**Result**: Package Topic with all metadata populated, links to docs, ready for browsing.

---

### Use Case 2: Import a Folder

**User request**: "Track my Projects folder"

**Facilitator behavior**:

1. **Determine type**: "folder"
2. **Get schema**: path (required)
3. **Create Topic**:
   ```typescript
   topic_create({
     name: "Projects",
     type: "folder",
     properties: { path: "/Users/dzearing/Projects" }
   })
   ```
4. **Optionally scan contents**: List subdirectories, suggest creating Topics for notable items

---

### Use Case 3: Create an Assignment (Unknown Type)

**User request**: "Create an assignment for my calculus homework due Friday"

**Facilitator behavior**:

1. **Determine type**: "assignment"
2. **Check schema**: Call `topic_get_schema("assignment")` -> null (no schema exists)
3. **Suggest schema creation**:
   ```
   "I don't have a schema for 'assignment' yet. I suggest these fields:

   Key fields:
   - subject (string) - The subject or topic
   - dueDate (datetime) - When it's due

   Optional fields:
   - course (string) - The course name
   - points (number) - Point value
   - status (select: Not Started, In Progress, Completed, Submitted)

   Should I create this schema?"
   ```

4. **User confirms**

5. **Create schema**:
   ```typescript
   topic_create_schema({
     name: "Assignment",
     targetType: "assignment",
     keyFields: [
       { name: "subject", label: "Subject", type: "string", required: true },
       { name: "dueDate", label: "Due Date", type: "datetime" }
     ],
     optionalFields: [
       { name: "course", label: "Course", type: "string" },
       { name: "points", label: "Points", type: "number" },
       { name: "status", label: "Status", type: "select", options: ["Not Started", "In Progress", "Completed", "Submitted"] }
     ]
   })
   ```

6. **Create Topic with properties**:
   ```typescript
   topic_create({
     name: "Calculus Homework",
     type: "assignment",
     properties: {
       subject: "Calculus",
       dueDate: "2024-01-19T23:59:00Z",
       status: "Not Started"
     }
   })
   ```

---

### Use Case 4: Import a Git Repository

**User request**: "Add the claude-flow repo"

**Facilitator behavior**:

1. **Determine type**: "project" (git repositories are projects)
2. **Get schema**: path (required), repository, status, startDate, endDate
3. **Read .git/config** for remote URL
4. **Read package.json** or other manifest for metadata
5. **Scan for documentation**: README.md, CONTRIBUTING.md, docs/
6. **Create Topic**:
   ```typescript
   topic_create({
     name: "claude-flow",
     type: "project",
     description: "Modern project management platform with AI-powered features",
     properties: {
       path: "/Users/dzearing/git/claude-flow",
       repository: "https://github.com/anthropics/claude-flow",
       status: "Active"
     }
   })
   ```
7. **Add links**:
   ```typescript
   topic_add_link({ topicId, type: "url", label: "GitHub", target: "https://github.com/anthropics/claude-flow" })
   topic_add_link({ topicId, type: "path", label: "README", target: "README.md" })
   topic_add_link({ topicId, type: "path", label: "Contributing", target: "CONTRIBUTING.md" })
   ```

---

### Use Case 5: Update Topic When Source Changes

**User request**: "Update the data-bus package info"

**Facilitator behavior**:

1. **Get existing Topic**: Retrieve Topic by name or ID
2. **Read current package.json**: Get fresh version, dependencies, etc.
3. **Compare with stored properties**: Detect version bump, new links, etc.
4. **Update Topic**:
   ```typescript
   topic_update({
     topicId: "topic-123",
     properties: {
       version: "1.1.0"  // Updated from 1.0.0
     }
   })
   ```
5. **Report changes**: "Updated version from 1.0.0 to 1.1.0"

---

### Use Case 6: Delete a Referenced Topic

**User request**: "Delete the Design Team person"

**System behavior**:

1. **Check for references**: Find all Topics with `topic-ref` fields pointing to "Design Team"
   - Found: 3 meetings reference this person as an attendee

2. **Execute deletion**:
   ```typescript
   topic_delete({ topicId: "topic-design-team" })
   ```

3. **Return response with broken references**:
   ```json
   {
     "success": true,
     "deletedId": "topic-design-team",
     "brokenReferences": [
       { "topicId": "topic-meeting-1", "topicName": "Sprint Planning", "fieldName": "attendees" },
       { "topicId": "topic-meeting-2", "topicName": "Design Review", "fieldName": "attendees" },
       { "topicId": "topic-meeting-3", "topicName": "Retrospective", "fieldName": "attendees" }
     ]
   }
   ```

4. **Facilitator reports**: "Deleted 'Design Team'. Note: 3 meetings had this person as an attendee - those references have been cleared."

---

### Use Case 7: Apply Schema to Existing Topics

**User request**: "I just created a schema for 'recipe'. Apply it to my existing recipes."

**Facilitator behavior**:

1. **Get schema**: `topic_get_schema("recipe")`
   - Returns schema with `defaultValue: "Easy"` for difficulty field

2. **Apply schema**:
   ```typescript
   topic_apply_schema({
     targetType: "recipe",
     applyDefaults: true
   })
   ```

3. **Response**:
   ```json
   {
     "appliedCount": 5,
     "skippedCount": 0,
     "errors": []
   }
   ```

4. **Report**: "Applied schema to 5 recipes. Default values have been set for fields that were missing."

---

### Use Case 8: Schema Validation Prevents Bad Data

**Scenario**: User tries to create a package with invalid version

**Facilitator behavior**:

1. **Validate before creating**:
   ```typescript
   topic_validate_properties({
     type: "package",
     properties: {
       path: "/Users/foo/project",
       version: "not-a-version"
     }
   })
   ```

2. **Response**:
   ```json
   {
     "valid": false,
     "errors": [
       { "field": "version", "message": "Invalid semver format. Expected X.Y.Z (e.g., 1.0.0)" }
     ],
     "warnings": []
   }
   ```

3. **Facilitator asks user**: "The version 'not-a-version' isn't a valid semver format. What version should I use? (e.g., 1.0.0)"

---

## Open Questions (with Recommendations)

### 1. Schema inheritance
**Question**: Should schemas support extending other schemas? (e.g., `app` extends `package`)

**Recommendation**: **No, defer to V2.** Inheritance adds complexity:
- Field conflict resolution
- Deep inheritance chains
- UI for managing inheritance

**Alternative**: Users can manually duplicate fields between similar schemas. If a pattern emerges, we can add inheritance later.

---

### 2. Field validation
**Question**: How strict should validation be? Warn vs block on invalid data?

**Decision**: **Per-schema `validationMode` setting** (already added to schema structure):
- `strict`: Block save if validation fails
- `warn`: Save but show warning in UI
- `none`: No validation (useful during migration)

Default is `warn` for flexibility.

---

### 3. Migration
**Question**: When a schema changes, what happens to existing Topics with that type?

**Decision**: **Lazy migration with warnings**:
- Existing Topics retain their current properties
- New required fields are NOT retroactively enforced
- UI shows "Missing required field" indicator on affected Topics
- `topic_apply_schema` tool can batch-apply defaults
- Adding a field: No impact on existing Topics (field is undefined)
- Removing a field: Property remains on Topic but is ignored by UI
- Renaming a field: Old property remains, new field is undefined (manual migration needed)

---

### 4. Cross-workspace schemas
**Question**: Should there be global/shared schemas?

**Decision**: **Personal workspace as schema library.**
- Schemas are workspace-scoped
- Users create/customize schemas in their **personal workspace** (see [Workspace Hierarchy](./02-workspace-hierarchy.md))
- Users **copy schemas** from personal to team workspaces as needed
- This provides a personal "schema library" without global scope complexity

---

### 5. Schema versioning
**Question**: Track schema changes over time?

**Recommendation**: **No, defer.** Versioning adds significant complexity:
- Storage overhead
- Migration between versions
- UI for version management

**Alternative**: Users can duplicate a schema before making changes if they want a backup.

---

### 6. Path handling (NEW)
**Question**: How should `path` type fields handle cross-platform and validity?

**Decision**:
- Store paths as-is (absolute or relative, user's choice)
- UI displays path with "open in finder/explorer" action
- If path doesn't exist, show warning icon but don't block
- Cross-platform: No automatic conversion (paths are stored verbatim)

---

### 7. Agent schema creation guardrails (NEW)
**Question**: Should agents be able to create schemas without user confirmation?

**Decision**: **Soft guardrail via prompt guidance.**
- No technical enforcement (tool doesn't require confirmation)
- Facilitator prompt instructs: "Always ask user before creating a schema"
- This allows flexibility for automated workflows while defaulting to safety

---

## Success Criteria

### Phase 1: Schema Infrastructure
- [ ] TypeScript types defined for `SchemaFieldDefinition`, `SchemaTopic`, `FieldType`
- [ ] Reserved field names are rejected when creating/updating schemas
- [ ] Only one schema per `targetType` allowed (uniqueness enforced)
- [ ] Default schemas created on workspace initialization
- [ ] Schemas stored in `_schemas` system folder
- [ ] All schema CRUD operations work via MCP tools
- [ ] Field validation works for all field types
- [ ] `validationMode` respected (strict/warn/none)

### Phase 2: Reference Integrity
- [ ] Deleting a Topic nullifies all `topic-ref` references to it
- [ ] Delete response includes `brokenReferences` array
- [ ] Circular references are detected and prevented
- [ ] `topic-ref` with `allowedTypes` enforces type constraints

### Phase 3: Agent Intelligence
- [ ] Facilitator calls `topic_get_schema` before creating Topics
- [ ] Facilitator populates path/version/repo when importing packages
- [ ] Facilitator suggests schema creation for unknown types
- [ ] Facilitator asks for confirmation before creating schemas
- [ ] Facilitator handles validation errors gracefully (asks user for correction)

### Phase 4: UI - Key Fields Display
- [ ] Key fields display at top of Topic view
- [ ] Each field type renders appropriately (links, dates, badges, etc.)
- [ ] Missing required fields show warning indicator
- [ ] Invalid field values show warning indicator
- [ ] `path` fields have "open in finder/explorer" action

### Phase 5: UI - Schema Editor
- [ ] Users can view list of all schemas in workspace settings
- [ ] Users can create new schemas via UI
- [ ] Users can edit existing schemas (add/remove/reorder fields)
- [ ] Users can delete schemas (with confirmation if Topics exist)
- [ ] Topic count displayed per schema

---

## Appendix: Error Messages

| Error Code | Message | When |
|------------|---------|------|
| `SCHEMA_EXISTS` | Schema for type '{type}' already exists | Creating duplicate schema |
| `SCHEMA_NOT_FOUND` | No schema found for type '{type}' | Getting non-existent schema |
| `SCHEMA_HAS_TOPICS` | Cannot delete schema: {count} Topics of type '{type}' exist. Use force=true to delete anyway. | Deleting schema with existing Topics |
| `RESERVED_FIELD_NAME` | Field name '{name}' is reserved and cannot be used | Using reserved field name |
| `INVALID_FIELD_TYPE` | Unknown field type '{type}' | Invalid type in schema definition |
| `MISSING_OPTIONS` | Field type '{type}' requires 'options' array | select/multiselect without options |
| `INVALID_TOPIC_REF` | Topic '{id}' not found | topic-ref pointing to non-existent Topic |
| `INVALID_TOPIC_REF_TYPE` | Topic '{id}' is type '{actual}', expected one of: {allowed} | topic-ref type mismatch |
| `CIRCULAR_REFERENCE` | Cannot set reference: would create circular dependency | Circular topic-ref detected |
| `VALIDATION_FAILED` | Validation failed for field '{field}': {message} | Field validation error |

---

## Appendix: Edge Cases

### Edge Case 1: Schema created after Topics exist
- Topics of that type gain schema association automatically
- Properties are not modified (may be missing fields)
- UI shows "Missing required field" warnings
- Use `topic_apply_schema` to batch-apply defaults

### Edge Case 2: Schema deleted with force=true
- Existing Topics retain their `properties` object
- Topics lose schema association (no key fields display)
- Topics appear as generic type in UI

### Edge Case 3: Field removed from schema
- Existing Topics keep the property value
- UI ignores the property (not displayed)
- Property can be accessed programmatically

### Edge Case 4: Field renamed in schema
- Old property remains on Topics
- New field is undefined
- Manual migration required (or add both temporarily)

### Edge Case 5: Required field added to existing schema
- Existing Topics are NOT retroactively validated
- New Topics must provide the field
- UI shows warning on existing Topics missing the field

### Edge Case 6: Path no longer exists
- Value is stored as-is
- UI shows warning icon next to path
- "Open" action shows error toast if path doesn't exist

---

## Related Documents

- [Things to Topics Rename](./01-things-to-topics-rename.md) - Prerequisite: rename before implementing schemas
- [Workspace Hierarchy](./02-workspace-hierarchy.md) - Dependency: personal workspace for schema library
