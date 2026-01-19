import { ChatView } from './components/ChatView';
import styles from './styles/App.module.css';

export function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Claude Code Web</h1>
      </header>
      <main className={styles.main}>
        <ChatView />
      </main>
    </div>
  );
}
