# WorkItemCard

**Priority**: High

**Description**: Card component displaying work item information and status.

**Base Component**: Card (extends all Card props)

**Component Dependencies**:
- Card (container structure)
- Avatar (assignee display)
- AvatarGroup (multiple assignees)
- Badge (priority/status indicators)
- ProgressBar (completion progress)
- Button (quick actions)
- Chip (labels/tags)
- Tooltip (additional info)
- ContextMenu (right-click actions)

**API Surface Extension**:
```typescript
interface WorkItemCardProps extends CardProps {
  // Work item data
  workItem: {
    id: string;
    title: string;
    description?: string;
    status: WorkItemStatus;
    priority: Priority;
    type: WorkItemType;
    assignees: User[];
    dueDate?: Date;
    progress?: number;
    labels: Label[];
    estimatedHours?: number;
    actualHours?: number;
  };
  
  // Display options
  showProgress?: boolean;
  showAssignees?: boolean;
  showDueDate?: boolean;
  showLabels?: boolean;
  
  // Interactions
  draggable?: boolean;
  onStatusChange?: (status: WorkItemStatus) => void;
  onAssigneeChange?: (assignees: User[]) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  
  // Quick actions
  quickActions?: WorkItemAction[];
  showActionsOnHover?: boolean;
}
```

**Features**:
- Title and description
- Status indicator
- Assignee avatars
- Priority badge
- Due date display
- Progress bar
- Quick actions
- Drag handle
- Labels/tags
- Time tracking

**Use Cases**:
- Task boards
- Work item lists
- Sprint planning
- Project views
- Dashboard widgets
