import styles from './ChatApp.module.css';

export function ChatApp() {
  return (
    <div className={styles.chatApp}>
      {/* Channels Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.workspaceHeader}>
          <h1 className={styles.workspaceName}>Acme Inc</h1>
          <button className={styles.dropdownButton}>▼</button>
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>▼</span>
            <span>Channels</span>
          </div>
          <nav className={styles.channelList}>
            <a href="#" className={styles.channel}># general</a>
            <a href="#" className={`${styles.channel} ${styles.active}`}># design</a>
            <a href="#" className={styles.channel}># engineering</a>
            <a href="#" className={styles.channel}># random</a>
            <a href="#" className={`${styles.channel} ${styles.unread}`}># announcements</a>
          </nav>
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>▼</span>
            <span>Direct Messages</span>
          </div>
          <nav className={styles.dmList}>
            <a href="#" className={styles.dm}>
              <span className={`${styles.status} ${styles.online}`} />
              Sarah Johnson
            </a>
            <a href="#" className={styles.dm}>
              <span className={`${styles.status} ${styles.online}`} />
              Mike Chen
            </a>
            <a href="#" className={styles.dm}>
              <span className={`${styles.status} ${styles.away}`} />
              Alex Kim
            </a>
            <a href="#" className={styles.dm}>
              <span className={`${styles.status} ${styles.offline}`} />
              Jordan Lee
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.chatMain}>
        <header className={styles.chatHeader}>
          <div className={styles.channelInfo}>
            <h2 className={styles.channelTitle}># design</h2>
            <span className={styles.channelDesc}>Design team discussions and updates</span>
          </div>
          <div className={styles.chatActions}>
            <button className={styles.headerButton}>👤 5</button>
            <button className={styles.headerButton}>📌</button>
            <button className={styles.headerButton}>🔍</button>
          </div>
        </header>

        <div className={styles.messages}>
          <div className={styles.dateDivider}>
            <span>Today</span>
          </div>

          <div className={styles.message}>
            <div className={styles.messageAvatar}>SJ</div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>Sarah Johnson</span>
                <span className={styles.messageTime}>9:30 AM</span>
              </div>
              <p className={styles.messageText}>Hey everyone! I just pushed the new component library updates. Can you all take a look?</p>
            </div>
          </div>

          <div className={styles.message}>
            <div className={styles.messageAvatar}>MC</div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>Mike Chen</span>
                <span className={styles.messageTime}>9:35 AM</span>
              </div>
              <p className={styles.messageText}>Looking good! I love the new button styles. The hover states feel much more polished now.</p>
              <div className={styles.reactions}>
                <span className={styles.reaction}>👍 3</span>
                <span className={styles.reaction}>🎉 2</span>
              </div>
            </div>
          </div>

          <div className={styles.message}>
            <div className={styles.messageAvatar}>AK</div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>Alex Kim</span>
                <span className={styles.messageTime}>9:42 AM</span>
              </div>
              <p className={styles.messageText}>Agreed! One thing though - should we add a focus state for accessibility? I noticed it's missing on some components.</p>
            </div>
          </div>

          <div className={styles.message}>
            <div className={styles.messageAvatar}>SJ</div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>Sarah Johnson</span>
                <span className={styles.messageTime}>9:45 AM</span>
              </div>
              <p className={styles.messageText}>Great catch! Let me add that now. I'll use the <code>--focus-ring</code> token for consistency.</p>
              <div className={styles.codeBlock}>
                <code>{`.button:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}`}</code>
              </div>
            </div>
          </div>

          <div className={styles.message}>
            <div className={styles.messageAvatar}>MC</div>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.messageSender}>Mike Chen</span>
                <span className={styles.messageTime}>9:48 AM</span>
              </div>
              <p className={styles.messageText}>Perfect! That follows our design system nicely. 👌</p>
            </div>
          </div>
        </div>

        <div className={styles.composer}>
          <div className={styles.composerActions}>
            <button className={styles.composerButton}>+</button>
            <button className={styles.composerButton}>@</button>
            <button className={styles.composerButton}>😊</button>
          </div>
          <input type="text" className={styles.composerInput} placeholder="Message #design" />
          <button className={styles.sendButton}>→</button>
        </div>
      </main>

      {/* Thread/Details Panel */}
      <aside className={styles.detailsPanel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Channel Details</h3>
          <button className={styles.closeButton}>×</button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>About</h4>
            <p className={styles.panelText}>Design team discussions, feedback, and updates. Share your work, get reviews, and collaborate on design projects.</p>
          </div>

          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>Members</h4>
            <div className={styles.memberList}>
              <div className={styles.member}>
                <div className={styles.memberAvatar}>SJ</div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>Sarah Johnson</div>
                  <div className={styles.memberRole}>Design Lead</div>
                </div>
              </div>
              <div className={styles.member}>
                <div className={styles.memberAvatar}>MC</div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>Mike Chen</div>
                  <div className={styles.memberRole}>Senior Designer</div>
                </div>
              </div>
              <div className={styles.member}>
                <div className={styles.memberAvatar}>AK</div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>Alex Kim</div>
                  <div className={styles.memberRole}>UX Designer</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>Pinned Items</h4>
            <div className={styles.pinnedItem}>
              <span className={styles.pinnedIcon}>📌</span>
              <span>Design System Guidelines v2.0</span>
            </div>
            <div className={styles.pinnedItem}>
              <span className={styles.pinnedIcon}>📌</span>
              <span>Component Library Documentation</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
