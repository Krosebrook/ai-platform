import type { Conversation, ConversationMessage } from '../types';
import { v4 as uuid } from 'uuid';

// In-browser store using localStorage/IndexedDB
// In Electron, could be replaced with better-sqlite3 via IPC
class ConversationStoreImpl {
  private conversations = new Map<string, Conversation>();
  private storageKey = 'ai-platform-conversations';

  async init() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const arr: Conversation[] = JSON.parse(raw);
        arr.forEach(c => this.conversations.set(c.id, c));
      }
    } catch { /* fresh start */ }
  }

  private persist() {
    try {
      const arr = Array.from(this.conversations.values());
      localStorage.setItem(this.storageKey, JSON.stringify(arr));
    } catch { /* storage full, etc */ }
  }

  create(title?: string, model = 'claude-sonnet-4-5-20250929'): Conversation {
    const now = new Date().toISOString();
    const conv: Conversation = {
      id: uuid(),
      title: title || 'New Chat',
      model,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conv.id, conv);
    this.persist();
    return conv;
  }

  get(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getAll(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  update(id: string, updates: Partial<Pick<Conversation, 'title' | 'model' | 'systemPrompt'>>) {
    const conv = this.conversations.get(id);
    if (!conv) return;
    Object.assign(conv, updates, { updatedAt: new Date().toISOString() });
    this.persist();
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, model?: string): ConversationMessage {
    const conv = this.conversations.get(conversationId);
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ConversationMessage = {
      id: uuid(),
      role,
      content,
      timestamp: new Date().toISOString(),
      model,
    };
    conv.messages.push(msg);
    conv.updatedAt = msg.timestamp;

    // Auto-title from first user message
    if (conv.title === 'New Chat' && role === 'user' && conv.messages.length === 1) {
      conv.title = content.slice(0, 60) + (content.length > 60 ? '...' : '');
    }

    this.persist();
    return msg;
  }

  delete(id: string) {
    this.conversations.delete(id);
    this.persist();
  }

  search(query: string): Conversation[] {
    const q = query.toLowerCase();
    return this.getAll().filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
  }
}

export const ConversationStore = new ConversationStoreImpl();
