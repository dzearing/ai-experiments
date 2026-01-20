import { ChatView } from './components/ChatView';
import styles from './styles/App.module.css';

export function App() {
  return (
    <div className={styles.app}>
      <ChatView />
    </div>
  );
}
