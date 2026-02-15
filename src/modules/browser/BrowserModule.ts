import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';
import type { BrowserTab } from './types';

/**
 * Browser Module — wraps Claude in Chrome extension MCP tools.
 * In Electron mode, connects to the extension's MCP server.
 * Falls back to basic URL opening in PWA mode.
 */
export class BrowserModule implements AssistantModule {
  id = 'browser';
  name = 'Browser';
  description = 'Browser automation via Claude in Chrome extension';
  version = '1.0.0';
  triggers = ['browse', 'navigate', 'open', 'click', 'fill', 'screenshot', 'tab', 'web page', 'website', 'url'];

  private tabs: BrowserTab[] = [];

  async init(_config: ModuleConfig) {}
  async destroy() {}

  canHandle(intent: Intent): boolean {
    const lower = intent.raw.toLowerCase();
    return this.triggers.some(t => lower.includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    // Extract URL from message if present
    const urlMatch = intent.raw.match(/https?:\/\/[^\s]+/);

    if (urlMatch) {
      return {
        success: true,
        message: `Opening ${urlMatch[0]}...`,
        data: { action: 'navigate', url: urlMatch[0] },
        ui: 'panel',
      };
    }

    return {
      success: true,
      message: 'Browser module ready. Use tools like browser.navigate, browser.screenshot, etc.',
      ui: 'panel',
    };
  }

  getTools(): ToolDefinition[] {
    return [
      {
        name: 'browser.navigate',
        description: 'Navigate to a URL in the browser',
        inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      },
      {
        name: 'browser.click',
        description: 'Click an element by selector or description',
        inputSchema: { type: 'object', properties: { selector: { type: 'string' }, description: { type: 'string' } } },
      },
      {
        name: 'browser.fill_form',
        description: 'Fill form fields with values',
        inputSchema: { type: 'object', properties: { fields: { type: 'object' } }, required: ['fields'] },
      },
      {
        name: 'browser.screenshot',
        description: 'Capture the current page as a screenshot',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'browser.read_page',
        description: 'Extract page content as text/markdown',
        inputSchema: { type: 'object', properties: { format: { type: 'string', enum: ['text', 'markdown', 'html'] } } },
      },
      {
        name: 'browser.run_script',
        description: 'Execute JavaScript on the current page',
        inputSchema: { type: 'object', properties: { script: { type: 'string' } }, required: ['script'] },
      },
      {
        name: 'browser.list_tabs',
        description: 'Get all open browser tabs',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'browser.record_gif',
        description: 'Record browser interaction as GIF',
        inputSchema: { type: 'object', properties: { filename: { type: 'string' } } },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    // These would connect to the Claude in Chrome extension MCP
    // For now, return placeholder responses
    switch (name) {
      case 'browser.navigate':
        return { success: true, data: { navigated: args.url } };
      case 'browser.list_tabs':
        return { success: true, data: this.tabs };
      case 'browser.screenshot':
        return { success: true, data: { message: 'Screenshot captured' } };
      default:
        return { success: true, data: { tool: name, args } };
    }
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: 'browser.screenshot',
        label: 'Screenshot',
        icon: 'camera',
        description: 'Take a screenshot of the current page',
        moduleId: this.id,
        action: () => { this.executeTool('browser.screenshot', {}); },
      },
    ];
  }

  getContextSignals() {
    return this.tabs.length > 0
      ? [{ layer: 'session' as const, key: 'browser.activeTab', value: this.tabs.find(t => t.active), timestamp: Date.now(), source: 'browser' }]
      : [];
  }
}
