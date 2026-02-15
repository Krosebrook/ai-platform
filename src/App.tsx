import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { ModuleRegistry } from './core/registry';
import { ContextEngine } from './core/context/ContextEngine';
import { ConversationStore } from './core/memory/ConversationStore';
import { PreferencesStore } from './core/memory/PreferencesStore';
import { VectorStore } from './core/memory/VectorStore';
import { AIProviderRegistry } from './core/ai/AIProvider';
import { ClaudeProvider } from './core/ai/providers/ClaudeProvider';
import { OpenAIProvider } from './core/ai/providers/OpenAIProvider';
import { OllamaProvider } from './core/ai/providers/OllamaProvider';

// Modules
import { ChatModule } from './modules/chat';
import { BrowserModule } from './modules/browser';
import { CoworkModule } from './modules/cowork';
import { CodeModule } from './modules/code';
import { WriterModule } from './modules/writer';
import { ResearchModule } from './modules/research';
import { VoiceModule } from './modules/voice';
import { WorkflowModule } from './modules/workflow';
import { VisionModule } from './modules/vision';
import { NotesModule } from './modules/notes';
import { CalendarModule } from './modules/calendar';
import { DataModule } from './modules/data';
import { AutomationModule } from './modules/automation';
import { EmailModule } from './modules/email';

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      // Initialize stores
      await PreferencesStore.init();
      await ConversationStore.init();
      await VectorStore.init();

      // Register AI providers
      AIProviderRegistry.register(ClaudeProvider);
      AIProviderRegistry.register(OpenAIProvider);
      AIProviderRegistry.register(OllamaProvider);

      // Register all modules
      const modules = [
        new ChatModule(),
        new BrowserModule(),
        new CoworkModule(),
        new CodeModule(),
        new WriterModule(),
        new ResearchModule(),
        new VoiceModule(),
        new WorkflowModule(),
        new VisionModule(),
        new NotesModule(),
        new CalendarModule(),
        new DataModule(),
        new AutomationModule(),
        new EmailModule(),
      ];

      for (const mod of modules) {
        ModuleRegistry.register(mod);
      }

      // Initialize all modules
      await ModuleRegistry.initAll();

      // Start context engine
      await ContextEngine.start();

      // Apply theme
      const theme = PreferencesStore.getTheme();
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      setReady(true);
    }

    bootstrap();

    return () => {
      ContextEngine.stop();
      ModuleRegistry.destroyAll();
    };
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading AI Platform...</p>
      </div>
    );
  }

  return <Layout />;
}

export default App;
