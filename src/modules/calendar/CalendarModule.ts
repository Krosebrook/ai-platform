import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export class CalendarModule implements AssistantModule {
  id = 'calendar';
  name = 'Calendar';
  description = 'Schedule awareness, meeting management, and time-based intelligence';
  version = '1.0.0';
  triggers = ['calendar', 'schedule', 'meeting', 'event', 'appointment', 'free time', 'busy', 'today'];

  private events: CalendarEvent[] = [];

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: 'Calendar module ready. Connect Google Calendar or Outlook in Settings.', ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'calendar.today', description: "Get today's schedule", inputSchema: { type: 'object', properties: {} } },
      { name: 'calendar.upcoming', description: 'Get events in a time range', inputSchema: { type: 'object', properties: { days: { type: 'number' } } } },
      { name: 'calendar.create_event', description: 'Create a new event', inputSchema: { type: 'object', properties: { title: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, description: { type: 'string' } }, required: ['title', 'start', 'end'] } },
      { name: 'calendar.find_free_time', description: 'Find available time slots', inputSchema: { type: 'object', properties: { date: { type: 'string' }, duration: { type: 'number' } } } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'calendar.today':
        return { success: true, data: this.events.filter(e => e.start.startsWith(new Date().toISOString().split('T')[0])) };
      case 'calendar.upcoming':
        return { success: true, data: this.events };
      default:
        return { success: true, data: { tool: name, args } };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'calendar.today', label: 'Today', icon: 'calendar', description: "Show today's schedule", moduleId: this.id, action: () => {} },
    ];
  }

  getContextSignals() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todayEvents = this.events.filter(e => e.start.startsWith(todayStr));
    return todayEvents.length > 0
      ? [{ layer: 'daily' as const, key: 'calendar.today', value: todayEvents, timestamp: Date.now(), source: 'calendar' }]
      : [];
  }
}
