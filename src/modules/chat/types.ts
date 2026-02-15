export interface ChatState {
  conversationId: string | null;
  isStreaming: boolean;
  streamContent: string;
  error: string | null;
}
