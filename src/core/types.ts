// ─── Module System Types ───

export interface AssistantModule {
  id: string;
  name: string;
  description: string;
  version: string;
  triggers: string[];

  init(config: ModuleConfig): Promise<void>;
  destroy(): Promise<void>;

  canHandle(intent: Intent): boolean;
  handle(intent: Intent, context: ContextSnapshot): Promise<ModuleResult>;

  getTools?(): ToolDefinition[];
  executeTool?(name: string, args: Record<string, unknown>): Promise<ToolResult>;

  getResources?(): ResourceDefinition[];
  readResource?(uri: string): Promise<ResourceContent>;

  getPanel?(): React.ComponentType;
  getQuickActions?(): QuickAction[];
  getSettingsPanel?(): React.ComponentType;

  getContextSignals?(): ContextSignal[];
}

export interface ModuleConfig {
  enabled: boolean;
  settings: Record<string, unknown>;
}

// ─── Intent & Routing ───

export interface Intent {
  id: string;
  raw: string;
  type?: string;
  modules?: string[];
  confidence?: number;
  params?: Record<string, unknown>;
}

export interface ModuleResult {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  ui?: 'chat' | 'panel' | 'notification';
}

// ─── Context ───

export type ContextLayer = 'immediate' | 'session' | 'daily' | 'longterm';

export interface ContextSignal {
  layer: ContextLayer;
  key: string;
  value: unknown;
  timestamp: number;
  source: string;
}

export interface ContextSnapshot {
  time: string;
  clipboard?: string;
  activeModule?: string;
  signals: Record<string, unknown>;
  recentMessages?: ConversationMessage[];
  preferences?: Record<string, unknown>;
}

// ─── MCP-Style Tools & Resources ───

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Blob;
}

// ─── Quick Actions ───

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  moduleId: string;
  action: () => void | Promise<void>;
}

// ─── AI Provider ───

export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  chat(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncGenerator<string>;
}

export interface AIRequest {
  model: string;
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}

// ─── Conversation / Memory ───

export interface Conversation {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

// ─── Event Bus ───

export interface BusEvent {
  type: string;
  source: string;
  data?: unknown;
  timestamp: number;
}

// ─── Platform ───

export type Platform = 'electron' | 'pwa' | 'web';

export function detectPlatform(): Platform {
  if (typeof window !== 'undefined' && window.electron) return 'electron';
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) return 'pwa';
  return 'web';
}
