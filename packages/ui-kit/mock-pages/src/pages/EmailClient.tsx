import styles from './EmailClient.module.css';

export function EmailClient() {
  return (
    <div className={styles.emailClient}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <button className={styles.composeButton}>+ Compose</button>

        <nav className={styles.folders}>
          <a href="#" className={`${styles.folder} ${styles.active}`}>
            <span className={styles.folderIcon}>📥</span>
            <span className={styles.folderName}>Inbox</span>
            <span className={styles.folderCount}>24</span>
          </a>
          <a href="#" className={styles.folder}>
            <span className={styles.folderIcon}>⭐</span>
            <span className={styles.folderName}>Starred</span>
          </a>
          <a href="#" className={styles.folder}>
            <span className={styles.folderIcon}>📤</span>
            <span className={styles.folderName}>Sent</span>
          </a>
          <a href="#" className={styles.folder}>
            <span className={styles.folderIcon}>📝</span>
            <span className={styles.folderName}>Drafts</span>
            <span className={styles.folderCount}>3</span>
          </a>
          <a href="#" className={styles.folder}>
            <span className={styles.folderIcon}>🗑️</span>
            <span className={styles.folderName}>Trash</span>
          </a>
        </nav>

        <div className={styles.labels}>
          <h3 className={styles.labelsTitle}>Labels</h3>
          <a href="#" className={styles.label}>
            <span className={styles.labelDot} style={{ background: '#ef4444' }} />
            Work
          </a>
          <a href="#" className={styles.label}>
            <span className={styles.labelDot} style={{ background: '#22c55e' }} />
            Personal
          </a>
          <a href="#" className={styles.label}>
            <span className={styles.labelDot} style={{ background: '#3b82f6' }} />
            Projects
          </a>
        </div>
      </aside>

      {/* Email List */}
      <div className={styles.emailList}>
        <div className={styles.listHeader}>
          <div className={styles.searchBar}>
            <input type="text" placeholder="Search emails..." className={styles.searchInput} />
          </div>
          <div className={styles.listActions}>
            <button className={styles.actionButton}>🗑️</button>
            <button className={styles.actionButton}>📁</button>
            <button className={styles.actionButton}>⏰</button>
          </div>
        </div>

        <div className={styles.emails}>
          <div className={`${styles.emailItem} ${styles.unread}`}>
            <input type="checkbox" className={styles.emailCheckbox} />
            <button className={styles.starButton}>⭐</button>
            <div className={styles.emailContent}>
              <div className={styles.emailSender}>Design Team</div>
              <div className={styles.emailSubject}>New design system updates</div>
              <div className={styles.emailPreview}>Hi team, I wanted to share the latest updates to our design system...</div>
            </div>
            <div className={styles.emailMeta}>
              <span className={styles.emailTime}>10:30 AM</span>
            </div>
          </div>

          <div className={`${styles.emailItem} ${styles.unread} ${styles.selected}`}>
            <input type="checkbox" className={styles.emailCheckbox} />
            <button className={styles.starButton}>☆</button>
            <div className={styles.emailContent}>
              <div className={styles.emailSender}>Sarah Johnson</div>
              <div className={styles.emailSubject}>Re: Project timeline</div>
              <div className={styles.emailPreview}>Thanks for sending the updated timeline. I've reviewed it and have a few suggestions...</div>
            </div>
            <div className={styles.emailMeta}>
              <span className={styles.emailTime}>9:15 AM</span>
            </div>
          </div>

          <div className={styles.emailItem}>
            <input type="checkbox" className={styles.emailCheckbox} />
            <button className={styles.starButton}>☆</button>
            <div className={styles.emailContent}>
              <div className={styles.emailSender}>GitHub</div>
              <div className={styles.emailSubject}>[ui-kit] Pull request #42 merged</div>
              <div className={styles.emailPreview}>Your pull request "Add dark mode support" has been merged into main...</div>
            </div>
            <div className={styles.emailMeta}>
              <span className={styles.emailTime}>Yesterday</span>
            </div>
          </div>

          <div className={styles.emailItem}>
            <input type="checkbox" className={styles.emailCheckbox} />
            <button className={styles.starButton}>⭐</button>
            <div className={styles.emailContent}>
              <div className={styles.emailSender}>Mike Chen</div>
              <div className={styles.emailSubject}>Weekly sync notes</div>
              <div className={styles.emailPreview}>Here are the notes from today's weekly sync meeting...</div>
            </div>
            <div className={styles.emailMeta}>
              <span className={styles.emailTime}>Yesterday</span>
            </div>
          </div>

          <div className={styles.emailItem}>
            <input type="checkbox" className={styles.emailCheckbox} />
            <button className={styles.starButton}>☆</button>
            <div className={styles.emailContent}>
              <div className={styles.emailSender}>Newsletter</div>
              <div className={styles.emailSubject}>This week in tech</div>
              <div className={styles.emailPreview}>The biggest tech news from this week including AI advancements...</div>
            </div>
            <div className={styles.emailMeta}>
              <span className={styles.emailTime}>Dec 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email Detail */}
      <div className={styles.emailDetail}>
        <div className={styles.detailHeader}>
          <div className={styles.detailActions}>
            <button className={styles.actionButton}>←</button>
            <button className={styles.actionButton}>🗑️</button>
            <button className={styles.actionButton}>📁</button>
            <button className={styles.actionButton}>↩️</button>
            <button className={styles.actionButton}>↪️</button>
          </div>
        </div>

        <div className={styles.detailContent}>
          <h1 className={styles.detailSubject}>Re: Project timeline</h1>

          <div className={styles.detailMeta}>
            <div className={styles.senderAvatar}>SJ</div>
            <div className={styles.senderInfo}>
              <div className={styles.senderName}>Sarah Johnson</div>
              <div className={styles.senderEmail}>sarah.johnson@company.com</div>
            </div>
            <div className={styles.detailTime}>Today at 9:15 AM</div>
          </div>

          <div className={styles.detailBody}>
            <p>Hi,</p>
            <p>Thanks for sending the updated timeline. I've reviewed it and have a few suggestions that might help us stay on track.</p>
            <p>First, I think we should move the design review to earlier in the week. This will give the development team more time to implement any changes.</p>
            <p>Second, we might want to add a buffer between the testing phase and launch. Based on our previous projects, we often need extra time for last-minute fixes.</p>
            <p>Let me know what you think!</p>
            <p>Best,<br />Sarah</p>
          </div>

          <div className={styles.replyBox}>
            <textarea className={styles.replyInput} placeholder="Write your reply..." rows={3} />
            <div className={styles.replyActions}>
              <button className={styles.sendButton}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
