import styles from './Settings.module.css';

export function Settings() {
  return (
    <div className={styles.settings}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account preferences</p>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <a href="#" className={`${styles.navItem} ${styles.active}`}>Profile</a>
        <a href="#" className={styles.navItem}>Account</a>
        <a href="#" className={styles.navItem}>Notifications</a>
        <a href="#" className={styles.navItem}>Privacy</a>
        <a href="#" className={styles.navItem}>Appearance</a>
        <a href="#" className={styles.navItem}>Billing</a>
      </nav>

      {/* Content */}
      <main className={styles.content}>
        {/* Profile Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>
          <p className={styles.sectionDesc}>Update your profile details and public information.</p>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>First Name</label>
              <input type="text" className={styles.input} defaultValue="John" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Last Name</label>
              <input type="text" className={styles.input} defaultValue="Doe" />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Email Address</label>
              <input type="email" className={styles.input} defaultValue="john.doe@example.com" />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Bio</label>
              <textarea className={styles.textarea} rows={4} defaultValue="Product designer with 10+ years of experience." />
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notification Preferences</h2>
          <p className={styles.sectionDesc}>Choose how you want to be notified.</p>

          <div className={styles.toggleList}>
            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <div className={styles.toggleLabel}>Email Notifications</div>
                <div className={styles.toggleDesc}>Receive updates via email</div>
              </div>
              <button className={`${styles.toggle} ${styles.toggleOn}`} aria-pressed="true">
                <span className={styles.toggleKnob} />
              </button>
            </div>
            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <div className={styles.toggleLabel}>Push Notifications</div>
                <div className={styles.toggleDesc}>Get notified on your device</div>
              </div>
              <button className={styles.toggle} aria-pressed="false">
                <span className={styles.toggleKnob} />
              </button>
            </div>
            <div className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <div className={styles.toggleLabel}>Weekly Digest</div>
                <div className={styles.toggleDesc}>Summary of activity each week</div>
              </div>
              <button className={`${styles.toggle} ${styles.toggleOn}`} aria-pressed="true">
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <p className={styles.sectionDesc}>Customize how the interface looks.</p>

          <div className={styles.field}>
            <label className={styles.label}>Theme</label>
            <select className={styles.select}>
              <option>System Default</option>
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>

          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>Color Scheme</label>
            <div className={styles.radioOptions}>
              <label className={styles.radio}>
                <input type="radio" name="color" defaultChecked />
                <span className={styles.radioText}>Blue</span>
              </label>
              <label className={styles.radio}>
                <input type="radio" name="color" />
                <span className={styles.radioText}>Green</span>
              </label>
              <label className={styles.radio}>
                <input type="radio" name="color" />
                <span className={styles.radioText}>Purple</span>
              </label>
              <label className={styles.radio}>
                <input type="radio" name="color" />
                <span className={styles.radioText}>Orange</span>
              </label>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
          <p className={styles.sectionDesc}>Irreversible actions. Please proceed with caution.</p>

          <div className={styles.dangerActions}>
            <div className={styles.dangerItem}>
              <div>
                <div className={styles.dangerLabel}>Delete Account</div>
                <div className={styles.dangerDesc}>Permanently delete your account and all data</div>
              </div>
              <button className={styles.dangerButton}>Delete Account</button>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.secondaryButton}>Cancel</button>
          <button className={styles.primaryButton}>Save Changes</button>
        </div>
      </main>
    </div>
  );
}
