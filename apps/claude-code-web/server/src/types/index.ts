export interface AgentQueryOptions {
  prompt: string;
  sessionId?: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  claudeAvailable?: boolean;
}

// SDK Content Block Types
export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock;

// Usage Statistics
export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
}

// SDK Message Types
export interface SDKSystemMessage {
  type: 'system';
  subtype: 'init';
  session_id: string;
  cwd?: string;
  tools?: string[];
}

export interface SDKAssistantMessage {
  type: 'assistant';
  uuid: string;
  session_id: string;
  message: {
    content: ContentBlock[];
    model?: string;
    stop_reason?: string;
  };
}

export interface SDKPartialAssistantMessage {
  type: 'partial_assistant';
  uuid: string;
  session_id: string;
  event: RawMessageStreamEvent;
}

// Raw message stream event types for partial messages
export interface RawMessageStreamEvent {
  type: string;
  index?: number;
  delta?: {
    type: string;
    text?: string;
  };
  content_block?: ContentBlock;
}

export interface SDKResultMessage {
  type: 'result';
  uuid: string;
  session_id: string;
  is_error: boolean;
  duration_ms: number;
  usage: UsageStats;
  model_usage?: UsageStats;
}

export interface SDKErrorMessage {
  type: 'error';
  error: string;
  session_id?: string;
}

// Union of all SDK message types
export type SDKMessage =
  | SDKSystemMessage
  | SDKAssistantMessage
  | SDKPartialAssistantMessage
  | SDKResultMessage
  | SDKErrorMessage;

// Permission Mode Types
export type PermissionMode = 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions';

// Permission Request/Response Types
export interface PermissionRequest {
  requestId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

export interface PermissionResponse {
  requestId: string;
  behavior: 'allow' | 'deny';
  message?: string;
  updatedInput?: Record<string, unknown>;
}

// Question Request/Response Types (for AskUserQuestion tool)
export interface QuestionOption {
  label: string;
  description?: string;
}

export interface QuestionItem {
  question: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

export interface QuestionRequest {
  requestId: string;
  questions: QuestionItem[];
  timestamp: number;
}

export interface QuestionResponse {
  requestId: string;
  answers: Record<string, string>;
}

// SSE Event Types for Permission Flow
export interface PermissionRequestEvent {
  type: 'permission_request';
  requestId: string;
  toolName: string;
  input: Record<string, unknown>;
  timestamp: number;
}

export interface QuestionRequestEvent {
  type: 'question_request';
  requestId: string;
  questions: QuestionItem[];
  timestamp: number;
}

export interface ModeChangedEvent {
  type: 'mode_changed';
  mode: PermissionMode;
  timestamp: number;
}

// Union of permission-related SSE events
export type PermissionSSEEvent =
  | PermissionRequestEvent
  | QuestionRequestEvent
  | ModeChangedEvent;
