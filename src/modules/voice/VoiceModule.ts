import type { AssistantModule, Intent, ContextSnapshot, ModuleResult, ModuleConfig, ToolDefinition, QuickAction } from '../../core/types';

export class VoiceModule implements AssistantModule {
  id = 'voice';
  name = 'Voice';
  description = 'Speech-to-text input, text-to-speech output, voice notes, and transcription';
  version = '1.0.0';
  triggers = ['voice', 'speak', 'listen', 'transcribe', 'dictate', 'read aloud', 'audio', 'record'];

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async init(_config: ModuleConfig) {}
  async destroy() { this.stopRecording(); }

  canHandle(intent: Intent): boolean {
    return this.triggers.some(t => intent.raw.toLowerCase().includes(t));
  }

  async handle(intent: Intent, _context: ContextSnapshot): Promise<ModuleResult> {
    return { success: true, message: 'Voice module ready.', ui: 'panel' };
  }

  getTools(): ToolDefinition[] {
    return [
      { name: 'voice.transcribe', description: 'Convert audio to text', inputSchema: { type: 'object', properties: { audio: { type: 'string' } } } },
      { name: 'voice.speak', description: 'Text-to-speech', inputSchema: { type: 'object', properties: { text: { type: 'string' }, rate: { type: 'number' } }, required: ['text'] } },
      { name: 'voice.record', description: 'Start/stop voice recording', inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['start', 'stop'] } }, required: ['action'] } },
    ];
  }

  async executeTool(name: string, args: Record<string, unknown>) {
    switch (name) {
      case 'voice.speak':
        return this.speak(args.text as string, args.rate as number | undefined);
      case 'voice.record':
        return args.action === 'start' ? this.startRecording() : this.stopRecording();
      default:
        return { success: true, data: { tool: name } };
    }
  }

  private speak(text: string, rate?: number) {
    if (!('speechSynthesis' in window)) return { success: false, error: 'TTS not supported' };
    const utterance = new SpeechSynthesisUtterance(text);
    if (rate) utterance.rate = rate;
    speechSynthesis.speak(utterance);
    return { success: true, data: { speaking: true } };
  }

  private async startRecording() {
    if (!('MediaRecorder' in window)) return { success: false, error: 'Recording not supported' };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
      this.mediaRecorder.start();
      return { success: true, data: { recording: true } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    return { success: true, data: { recording: false, chunks: this.audioChunks.length } };
  }

  getQuickActions(): QuickAction[] {
    return [
      { id: 'voice.record', label: 'Voice Note', icon: 'mic', description: 'Record a voice note', moduleId: this.id, action: () => this.startRecording() },
      { id: 'voice.speak', label: 'Read Aloud', icon: 'volume-2', description: 'Read text aloud', moduleId: this.id, action: () => {} },
    ];
  }
}
