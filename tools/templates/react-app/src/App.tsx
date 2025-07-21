import cx from 'classnames';
import styles from './App.module.css';

function App() {
  return (
    <div className={cx(styles.root)}>
      <div className={cx(styles.card)}>
        <h1 className={cx(styles.title)}>Welcome to {{ name }}</h1>
        <p className={cx(styles.description)}>
          Get started by editing <code className={cx(styles.code)}>src/App.tsx</code>
        </p>
      </div>
    </div>
  );
}

export default App;
