import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import { v4 as uuid } from 'uuid';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  links: string[]; // IDs of linked notes
  createdAt: string;
  updatedAt: string;
}

export class NotesModule implements AssistantModule {
  id = 'notes';
  name = 'Notes';
  description = 'Personal knowledge base, wiki, and note-taking with bi-directional linking';
  version = '1.0.0';
  triggers = ['note', 'save', 'remember', 'knowledge', 'wiki', 'write down', 'jot'];

  private notes = new Map<string, Note>();
  private storageKey = 'ai-platform-notes';

  async init(_config: ModuleConfig) {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const arr: Note[] = JSON.parse(raw);
        arr.forEach(n => this.notes.set(n.id, n));
      }
    } catch {}
  }

  async destroy() {}

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.notes.values())));
  }

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: `Notes module: ${this.notes.size} notes.`, ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'notes.create', description: 'Create a new note', inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['title', 'content'] } },
      { name: 'notes.search', description: 'Search notes', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'notes.link', description: 'Link two notes', inputSchema: { type: 'object', properties: { noteId1: { type: 'string' }, noteId2: { type: 'string' } }, required: ['noteId1', 'noteId2'] } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'notes.create': {
        const note: Note = {
          id: uuid(),
          title: args.title as string,
          content: args.content as string,
          tags: (args.tags as string[]) || [],
          links: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.notes.set(note.id, note);
        this.persist();
        return { success: true, data: note };
      }
      case 'notes.search': {
        const q = (args.query as string).toLowerCase();
        const results = Array.from(this.notes.values()).filter(n =>
          n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))
        );
        return { success: true, data: results };
      }
      case 'notes.link': {
        const n1 = this.notes.get(args.noteId1 as string);
        const n2 = this.notes.get(args.noteId2 as string);
        if (!n1 || !n2) return { success: false, error: 'Note not found' };
        if (!n1.links.includes(n2.id)) n1.links.push(n2.id);
        if (!n2.links.includes(n1.id)) n2.links.push(n1.id);
        this.persist();
        return { success: true, data: { linked: [n1.id, n2.id] } };
      }
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'notes.new', label: 'New Note', icon: 'file-text', description: 'Create a new note', moduleId: this.id, action: () => {} },
    ];
  }
}
