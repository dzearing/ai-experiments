import { useEffect } from 'react';
import { useNavigate } from '@ui-kit/router';
import { Button, Card, IconButton, useTheme } from '@ui-kit/react';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { GearIcon } from '@ui-kit/icons/GearIcon';
import { SunIcon } from '@ui-kit/icons/SunIcon';
import { MoonIcon } from '@ui-kit/icons/MoonIcon';
import { SunMoonIcon } from '@ui-kit/icons/SunMoonIcon';
import { useAuth } from '../contexts/AuthContext';
import styles from './Landing.module.css';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, setMode } = useTheme();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const features = [
    {
      icon: <UsersIcon />,
      title: 'Real-time Collaboration',
      description:
        'See collaborators\' cursors and edits in real-time. Work together seamlessly on any document.',
    },
    {
      icon: <LinkIcon />,
      title: 'Network Discovery',
      description:
        'Discover and join documents shared on your local network. No setup required.',
    },
    {
      icon: <GearIcon />,
      title: 'Beautiful Themes',
      description:
        'Choose from 20+ built-in themes or customize your own. Light and dark modes included.',
    },
  ];

  return (
    <div className={styles.landing}>
      {/* Theme toggle in corner */}
      <div className={styles.themeToggle}>
        <IconButton
          icon={mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <SunMoonIcon />}
          variant="ghost"
          size="sm"
          onClick={() =>
            setMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light')
          }
          aria-label="Toggle theme"
        />
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoLarge}>
            <span className={styles.logoIcon}>I</span>
          </div>
          <h1 className={styles.title}>Ideate</h1>
          <p className={styles.tagline}>Ideas flow better together</p>
          <p className={styles.description}>
            A real-time collaborative markdown editor with local network discovery.
            Write, brainstorm, and create together.
          </p>
          <div className={styles.cta}>
            <Button variant="primary" size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Built with UIKit</p>
      </footer>
    </div>
  );
}
