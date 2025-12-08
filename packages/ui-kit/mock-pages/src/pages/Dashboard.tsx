import styles from './Dashboard.module.css';

export function Dashboard() {
  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>Dashboard</h1>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconButton}>
            <span>🔔</span>
          </button>
          <div className={styles.avatar}>JD</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          <a href="#" className={`${styles.navItem} ${styles.active}`}>
            📊 Overview
          </a>
          <a href="#" className={styles.navItem}>
            📁 Projects
          </a>
          <a href="#" className={styles.navItem}>
            ✅ Tasks
          </a>
          <a href="#" className={styles.navItem}>
            📅 Calendar
          </a>
          <a href="#" className={styles.navItem}>
            ⚙️ Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Projects</div>
            <div className={styles.statValue}>24</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Tasks</div>
            <div className={styles.statValue}>142</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Team Members</div>
            <div className={styles.statValue}>12</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Completed</div>
            <div className={styles.statValue}>87%</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Recent Activity */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityContent}>
                  <strong>Sarah</strong> completed task "Update homepage design"
                  <span className={styles.activityTime}>2 hours ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityContent}>
                  <strong>Mike</strong> created new project "Mobile App v2"
                  <span className={styles.activityTime}>4 hours ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div className={styles.activityContent}>
                  <strong>Alex</strong> added 3 new team members
                  <span className={styles.activityTime}>Yesterday</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tasks */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>My Tasks</h2>
            <div className={styles.taskList}>
              <label className={styles.task}>
                <input type="checkbox" className={styles.checkbox} />
                <span>Review pull request #234</span>
              </label>
              <label className={styles.task}>
                <input type="checkbox" className={styles.checkbox} />
                <span>Prepare quarterly report</span>
              </label>
              <label className={styles.task}>
                <input type="checkbox" className={styles.checkbox} defaultChecked />
                <span className={styles.completed}>Update documentation</span>
              </label>
              <label className={styles.task}>
                <input type="checkbox" className={styles.checkbox} />
                <span>Team standup meeting</span>
              </label>
            </div>
          </section>
        </div>

        {/* Alerts */}
        <div className={styles.alerts}>
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            ✅ All systems operational
          </div>
          <div className={`${styles.alert} ${styles.alertWarning}`}>
            ⚠️ 3 tasks are due today
          </div>
        </div>
      </main>
    </div>
  );
}
