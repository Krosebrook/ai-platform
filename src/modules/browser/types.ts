export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

export interface BrowserAction {
  type: 'navigate' | 'click' | 'fill' | 'screenshot' | 'read' | 'script';
  target?: string;
  value?: string;
  selector?: string;
}

export interface ScreenshotResult {
  dataUrl: string;
  timestamp: string;
  url: string;
}
