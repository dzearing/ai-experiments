import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import {
  Avatar,
  AvatarGroup,
  Button,
  Chip,
  Heading,
  IconButton,
  Text,
  SplitPane,
  Checkbox,
  Progress,
  Spinner,
  Tooltip,
} from '@ui-kit/react';
import { ChatPanel, ChatInput, ThinkingIndicator, ChatProvider, type ChatPanelMessage } from '@ui-kit/react-chat';
import { MarkdownCoEditor, type ViewMode } from '@ui-kit/react-markdown';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { AlignLeftIcon } from '@ui-kit/icons/AlignLeftIcon';
import { AlignRightIcon } from '@ui-kit/icons/AlignRightIcon';
import { CheckCircleIcon } from '@ui-kit/icons/CheckCircleIcon';
import { ChevronDownIcon } from '@ui-kit/icons/ChevronDownIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { FolderIcon } from '@ui-kit/icons/FolderIcon';
import { ImageIcon } from '@ui-kit/icons/ImageIcon';
import { MaximizeIcon } from '@ui-kit/icons/MaximizeIcon';
import { MinimizeIcon } from '@ui-kit/icons/MinimizeIcon';
import { MoonIcon } from '@ui-kit/icons/MoonIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { SunIcon } from '@ui-kit/icons/SunIcon';
import { ThumbsUpIcon } from '@ui-kit/icons/ThumbsUpIcon';
import { ThumbsDownIcon } from '@ui-kit/icons/ThumbsDownIcon';
import { UsersIcon } from '@ui-kit/icons/UsersIcon';
import styles from './MultiEditingFlow.module.css';

/**
 * # Multi-Editing Surface & Coauthoring Flows
 *
 * Explores the artifact well concept where multiple artifacts can be
 * collaborated on through conversation. This flow demonstrates:
 *
 * ## Single User Flow (Steps 1-7)
 * 1. **Artifact Tabs**: Plan, Document, and dynamically added UI Mocks
 * 2. **UI Mock Generation**: Prompt-driven mock UI creation
 * 3. **Option Grid**: 4 variations (A, B, C, D) displayed in a grid
 * 4. **Iterative Refinement**: Describe preferences to regenerate options
 * 5. **Preview Dialog**: Expanded view with responsive toggles
 *
 * ## Multiplayer Collaboration Flow (Collab 1-6)
 * 1. **Live Presence**: See who's in the session with avatar indicators
 * 2. **Voting System**: Upvote/downvote options with visual feedback
 * 3. **Multi-user Chat**: Team members discuss and provide feedback
 * 4. **Agent Synthesis**: AI aggregates team preferences and patterns
 * 5. **Consensus Building**: Track votes until team reaches agreement
 * 6. **Winner Selection**: Highlight winning option, unlock next steps
 *
 * ## Component Gap Analysis
 *
 * Components that would improve this implementation:
 *
 * 1. **ArtifactTabs** - Tab bar for managing multiple artifacts with add/close
 * 2. **MockPreviewCard** - Scaled iframe preview with hover actions
 * 3. **MockPreviewDialog** - Full preview with responsive viewport controls
 * 4. **OptionGrid** - 2x2 grid layout for displaying variations
 * 5. **ViewportToggle** - Desktop/Tablet/Mobile toggle group
 * 6. **VotingCard** - Option card with integrated voting UI
 * 7. **CollaboratorPresence** - Real-time presence indicator
 * 8. **ConsensusTracker** - Visual progress toward team agreement
 *
 * ## Icon Gap Analysis
 *
 * Icons that would improve this implementation:
 *
 * 1. **DesktopIcon** - Desktop/monitor device icon
 * 2. **TabletIcon** - Tablet device icon
 * 3. **MobileIcon** - Mobile phone device icon
 * 4. **PaletteIcon** - Design/palette icon for UI mock tabs
 */

// ============================================
// TYPES
// ============================================

interface Collaborator {
  id: string;
  name: string;
  initials: string;
  color: string;
  isOnline?: boolean;
  isTyping?: boolean;
}

interface Vote {
  odor: string;
  odorInitials: string;
  odorColor: string;
  vote: 'up' | 'down';
  comment?: string;
}

interface PlanPhase {
  id: string;
  title: string;
  description?: string;
  tasks: PlanTask[];
  expanded?: boolean;
}

interface PlanTask {
  id: string;
  title: string;
  completed?: boolean;
  inProgress?: boolean;
}

interface MockOption {
  id: string;
  label: string;
  html: string;
  votes?: Vote[];
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';
type ArtifactTab = 'plan' | 'document' | 'ui-mock';

// ============================================
// MOCK DATA: Landing Page HTML Variations
// ============================================

const landingPageOptionA = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: white; }
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
    .hero h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.25rem; color: #94a3b8; max-width: 600px; margin-bottom: 2rem; }
    .cta { display: flex; gap: 1rem; }
    .btn { padding: 0.875rem 1.75rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: transparent; color: white; border: 1px solid #475569; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding: 4rem 2rem; background: #1e293b; }
    .feature { text-align: center; padding: 2rem; }
    .feature-icon { width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; margin: 0 auto 1rem; }
    .feature h3 { margin-bottom: 0.5rem; }
    .feature p { color: #94a3b8; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Build faster with AI</h1>
    <p>Transform your workflow with intelligent automation. Ship products 10x faster.</p>
    <div class="cta">
      <a href="#" class="btn btn-primary">Get Started</a>
      <a href="#" class="btn btn-secondary">Learn More</a>
    </div>
  </div>
  <div class="features">
    <div class="feature">
      <div class="feature-icon"></div>
      <h3>Lightning Fast</h3>
      <p>Optimized for speed and performance</p>
    </div>
    <div class="feature">
      <div class="feature-icon"></div>
      <h3>Secure by Default</h3>
      <p>Enterprise-grade security built in</p>
    </div>
    <div class="feature">
      <div class="feature-icon"></div>
      <h3>Scale Infinitely</h3>
      <p>Grows with your business needs</p>
    </div>
  </div>
</body>
</html>
`;

const landingPageOptionB = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #fafafa; color: #1a1a1a; }
    .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .hero-content { display: flex; flex-direction: column; justify-content: center; padding: 4rem; }
    .hero-content h1 { font-size: 3rem; font-weight: 700; line-height: 1.1; margin-bottom: 1.5rem; }
    .hero-content p { font-size: 1.125rem; color: #666; margin-bottom: 2rem; }
    .btn { display: inline-flex; padding: 1rem 2rem; background: #000; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500; }
    .hero-image { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); display: flex; align-items: center; justify-content: center; }
    .placeholder { width: 80%; height: 70%; background: white; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); }
    .stats { display: flex; gap: 3rem; padding: 3rem 4rem; background: white; border-top: 1px solid #eee; }
    .stat h3 { font-size: 2.5rem; font-weight: 700; color: #6366f1; }
    .stat p { color: #666; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-content">
      <h1>The modern way to build products</h1>
      <p>Streamline your development process with our cutting-edge platform. Join thousands of teams shipping faster.</p>
      <a href="#" class="btn">Start Free Trial →</a>
    </div>
    <div class="hero-image">
      <div class="placeholder"></div>
    </div>
  </div>
  <div class="stats">
    <div class="stat">
      <h3>10M+</h3>
      <p>Active users</p>
    </div>
    <div class="stat">
      <h3>99.9%</h3>
      <p>Uptime SLA</p>
    </div>
    <div class="stat">
      <h3>150+</h3>
      <p>Countries</p>
    </div>
  </div>
</body>
</html>
`;

const landingPageOptionC = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #18181b; color: white; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 3rem; }
    .logo { font-weight: 700; font-size: 1.25rem; }
    .nav-links { display: flex; gap: 2rem; }
    .nav-links a { color: #a1a1aa; text-decoration: none; }
    .hero { padding: 6rem 3rem; text-align: center; }
    .badge { display: inline-block; padding: 0.5rem 1rem; background: #27272a; border-radius: 9999px; font-size: 0.875rem; color: #a78bfa; margin-bottom: 2rem; }
    .hero h1 { font-size: 4rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1.1; }
    .hero h1 span { background: linear-gradient(90deg, #f472b6, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.25rem; color: #71717a; max-width: 600px; margin: 0 auto 2rem; }
    .cta-group { display: flex; gap: 1rem; justify-content: center; }
    .btn { padding: 0.875rem 1.5rem; border-radius: 0.5rem; font-weight: 500; text-decoration: none; }
    .btn-gradient { background: linear-gradient(90deg, #f472b6, #a78bfa); color: white; }
    .btn-ghost { color: white; border: 1px solid #3f3f46; }
    .video-preview { margin: 4rem auto; max-width: 900px; aspect-ratio: 16/9; background: #27272a; border-radius: 1rem; border: 1px solid #3f3f46; }
  </style>
</head>
<body>
  <nav>
    <div class="logo">Acme</div>
    <div class="nav-links">
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">Docs</a>
    </div>
  </nav>
  <div class="hero">
    <div class="badge">✨ Now in public beta</div>
    <h1>Create <span>beautiful</span><br/>experiences</h1>
    <p>The all-in-one platform for building modern web applications with AI-powered tools.</p>
    <div class="cta-group">
      <a href="#" class="btn btn-gradient">Get Started Free</a>
      <a href="#" class="btn btn-ghost">Watch Demo</a>
    </div>
  </div>
  <div class="video-preview"></div>
</body>
</html>
`;

const landingPageOptionD = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #fff; color: #000; }
    .hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 4rem; }
    .hero h1 { font-size: 6rem; font-weight: 900; line-height: 0.9; letter-spacing: -0.04em; margin-bottom: 2rem; }
    .hero h1 .highlight { color: #6366f1; }
    .hero-subtitle { font-size: 1.5rem; color: #666; max-width: 500px; margin-bottom: 3rem; }
    .cta-row { display: flex; align-items: center; gap: 2rem; }
    .btn-large { padding: 1.25rem 2.5rem; background: #000; color: white; text-decoration: none; font-weight: 600; font-size: 1.125rem; }
    .link { color: #6366f1; text-decoration: none; font-weight: 500; }
    .brands { margin-top: 6rem; }
    .brands p { color: #999; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .brand-logos { display: flex; gap: 3rem; }
    .brand-logo { width: 100px; height: 32px; background: #e5e5e5; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Ship<br/><span class="highlight">faster.</span><br/>Scale<br/>smarter.</h1>
    <p class="hero-subtitle">Enterprise-grade infrastructure for teams that move fast and build things that matter.</p>
    <div class="cta-row">
      <a href="#" class="btn-large">Start Building →</a>
      <a href="#" class="link">View case studies</a>
    </div>
    <div class="brands">
      <p>Trusted by industry leaders</p>
      <div class="brand-logos">
        <div class="brand-logo"></div>
        <div class="brand-logo"></div>
        <div class="brand-logo"></div>
        <div class="brand-logo"></div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const mockOptions: MockOption[] = [
  { id: 'a', label: 'A', html: landingPageOptionA },
  { id: 'b', label: 'B', html: landingPageOptionB },
  { id: 'c', label: 'C', html: landingPageOptionC },
  { id: 'd', label: 'D', html: landingPageOptionD },
];

// Regenerated options after feedback
const landingPageOptionA2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: white; }
    .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .hero-content { display: flex; flex-direction: column; justify-content: center; padding: 4rem; }
    .hero h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p { font-size: 1.25rem; color: #94a3b8; margin-bottom: 2rem; }
    .cta { display: flex; gap: 1rem; }
    .btn { padding: 0.875rem 1.75rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-secondary { background: transparent; color: white; border: 1px solid #475569; }
    .hero-visual { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1e293b, #334155); }
    .mock-app { width: 80%; height: 70%; background: #1e293b; border-radius: 1rem; border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-content">
      <h1>Build faster with AI</h1>
      <p>Transform your workflow with intelligent automation. Ship products 10x faster.</p>
      <div class="cta">
        <a href="#" class="btn btn-primary">Get Started</a>
        <a href="#" class="btn btn-secondary">Learn More</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="mock-app"></div>
    </div>
  </div>
</body>
</html>
`;

const landingPageOptionB2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0c0c0c; color: white; }
    .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .hero-content { display: flex; flex-direction: column; justify-content: center; padding: 4rem; }
    .hero-content h1 { font-size: 3rem; font-weight: 700; line-height: 1.1; margin-bottom: 1.5rem; }
    .hero-content p { font-size: 1.125rem; color: #888; margin-bottom: 2rem; }
    .btn { display: inline-flex; padding: 1rem 2rem; background: #fff; color: #000; text-decoration: none; border-radius: 9999px; font-weight: 500; }
    .hero-image { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); display: flex; align-items: center; justify-content: center; }
    .placeholder { width: 80%; height: 70%; background: #1a1a2e; border-radius: 1rem; border: 1px solid #333; }
    .stats { display: flex; gap: 3rem; padding: 3rem 4rem; background: #111; border-top: 1px solid #222; }
    .stat h3 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(90deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .stat p { color: #666; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-content">
      <h1>The modern way to build products</h1>
      <p>Streamline your development process with our cutting-edge platform.</p>
      <a href="#" class="btn">Start Free Trial →</a>
    </div>
    <div class="hero-image">
      <div class="placeholder"></div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><h3>10M+</h3><p>Active users</p></div>
    <div class="stat"><h3>99.9%</h3><p>Uptime SLA</p></div>
    <div class="stat"><h3>150+</h3><p>Countries</p></div>
  </div>
</body>
</html>
`;

const landingPageOptionC2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #09090b; color: white; }
    nav { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 3rem; }
    .logo { font-weight: 700; font-size: 1.25rem; }
    .hero { padding: 6rem 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .hero-text h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1.5rem; line-height: 1.1; }
    .hero-text h1 span { background: linear-gradient(90deg, #f472b6, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-text p { font-size: 1.25rem; color: #71717a; margin-bottom: 2rem; }
    .btn { display: inline-block; padding: 0.875rem 1.5rem; border-radius: 0.5rem; font-weight: 500; text-decoration: none; }
    .btn-gradient { background: linear-gradient(90deg, #f472b6, #a78bfa); color: white; }
    .hero-visual { aspect-ratio: 4/3; background: #18181b; border-radius: 1rem; border: 1px solid #27272a; }
  </style>
</head>
<body>
  <nav><div class="logo">Acme</div></nav>
  <div class="hero">
    <div class="hero-text">
      <h1>Create <span>beautiful</span> experiences</h1>
      <p>The all-in-one platform for building modern web applications.</p>
      <a href="#" class="btn btn-gradient">Get Started Free</a>
    </div>
    <div class="hero-visual"></div>
  </div>
</body>
</html>
`;

const landingPageOptionD2 = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; }
    .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }
    .hero-content { display: flex; flex-direction: column; justify-content: center; padding: 4rem; }
    .hero h1 { font-size: 4.5rem; font-weight: 900; line-height: 0.95; letter-spacing: -0.04em; margin-bottom: 2rem; }
    .hero h1 .highlight { background: linear-gradient(90deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-subtitle { font-size: 1.25rem; color: #666; max-width: 400px; margin-bottom: 2.5rem; }
    .btn-large { display: inline-block; padding: 1rem 2rem; background: #fff; color: #000; text-decoration: none; font-weight: 600; }
    .hero-visual { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #111, #1a1a1a); }
    .app-preview { width: 85%; height: 75%; background: #111; border: 1px solid #222; border-radius: 1rem; }
  </style>
</head>
<body>
  <div class="hero">
    <div class="hero-content">
      <h1>Ship<br/><span class="highlight">faster.</span><br/>Scale<br/>smarter.</h1>
      <p class="hero-subtitle">Enterprise-grade infrastructure for teams that move fast.</p>
      <a href="#" class="btn-large">Start Building →</a>
    </div>
    <div class="hero-visual">
      <div class="app-preview"></div>
    </div>
  </div>
</body>
</html>
`;

const regeneratedOptions: MockOption[] = [
  { id: 'a', label: 'A', html: landingPageOptionA2 },
  { id: 'b', label: 'B', html: landingPageOptionB2 },
  { id: 'c', label: 'C', html: landingPageOptionC2 },
  { id: 'd', label: 'D', html: landingPageOptionD2 },
];

// ============================================
// MOCK DATA: Collaborators
// ============================================

const collaborators: Collaborator[] = [
  { id: 'user-1', name: 'You', initials: 'ME', color: '#3b82f6', isOnline: true },
  { id: 'user-2', name: 'Sarah Chen', initials: 'SC', color: '#8b5cf6', isOnline: true },
  { id: 'user-3', name: 'Mike Johnson', initials: 'MJ', color: '#10b981', isOnline: true },
  { id: 'user-4', name: 'Emma Wilson', initials: 'EW', color: '#f59e0b', isOnline: false },
];

// Options with votes from multiple users
const optionsWithVotes: MockOption[] = [
  {
    id: 'a',
    label: 'A',
    html: landingPageOptionA2,
    votes: [
      { odor: 'Sarah Chen', odorInitials: 'SC', odorColor: '#8b5cf6', vote: 'up' },
      { odor: 'Mike Johnson', odorInitials: 'MJ', odorColor: '#10b981', vote: 'up' },
    ],
  },
  {
    id: 'b',
    label: 'B',
    html: landingPageOptionB2,
    votes: [
      { odor: 'You', odorInitials: 'ME', odorColor: '#3b82f6', vote: 'up' },
    ],
  },
  {
    id: 'c',
    label: 'C',
    html: landingPageOptionC2,
    votes: [
      { odor: 'You', odorInitials: 'ME', odorColor: '#3b82f6', vote: 'up' },
      { odor: 'Sarah Chen', odorInitials: 'SC', odorColor: '#8b5cf6', vote: 'up' },
      { odor: 'Mike Johnson', odorInitials: 'MJ', odorColor: '#10b981', vote: 'down', comment: 'Too gradient-heavy' },
    ],
  },
  {
    id: 'd',
    label: 'D',
    html: landingPageOptionD2,
    votes: [
      { odor: 'Emma Wilson', odorInitials: 'EW', odorColor: '#f59e0b', vote: 'up' },
    ],
  },
];

// Options after consensus - Option C wins
const optionsWithConsensus: MockOption[] = [
  {
    id: 'a',
    label: 'A',
    html: landingPageOptionA2,
    votes: [
      { odor: 'Sarah Chen', odorInitials: 'SC', odorColor: '#8b5cf6', vote: 'up' },
      { odor: 'Mike Johnson', odorInitials: 'MJ', odorColor: '#10b981', vote: 'up' },
    ],
  },
  {
    id: 'b',
    label: 'B',
    html: landingPageOptionB2,
    votes: [
      { odor: 'You', odorInitials: 'ME', odorColor: '#3b82f6', vote: 'up' },
      { odor: 'Emma Wilson', odorInitials: 'EW', odorColor: '#f59e0b', vote: 'up' },
    ],
  },
  {
    id: 'c',
    label: 'C',
    html: landingPageOptionC2,
    votes: [
      { odor: 'You', odorInitials: 'ME', odorColor: '#3b82f6', vote: 'up' },
      { odor: 'Sarah Chen', odorInitials: 'SC', odorColor: '#8b5cf6', vote: 'up' },
      { odor: 'Mike Johnson', odorInitials: 'MJ', odorColor: '#10b981', vote: 'up' },
      { odor: 'Emma Wilson', odorInitials: 'EW', odorColor: '#f59e0b', vote: 'up' },
    ],
  },
  {
    id: 'd',
    label: 'D',
    html: landingPageOptionD2,
    votes: [],
  },
];

// ============================================
// MOCK DATA: Plan & Document
// ============================================

const planPhases: PlanPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Core Sync Infrastructure',
    description: 'Set up the foundational CRDT and synchronization layer',
    expanded: true,
    tasks: [
      { id: 'task-1-1', title: 'Install Yjs and y-websocket dependencies', completed: true },
      { id: 'task-1-2', title: 'Create Yjs document provider', completed: true },
      { id: 'task-1-3', title: 'Set up WebSocket server', inProgress: true },
      { id: 'task-1-4', title: 'Implement basic document sync' },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Presence System',
    description: 'User awareness and cursor presence',
    expanded: false,
    tasks: [
      { id: 'task-2-1', title: 'Implement awareness protocol' },
      { id: 'task-2-2', title: 'Create CursorPresence component' },
      { id: 'task-2-3', title: 'Add user avatar display' },
      { id: 'task-2-4', title: 'Smooth cursor interpolation' },
    ],
  },
];

const planMarkdown = `# Real-time Collaborative Editing

## Overview
Enable multiple users to edit the same document simultaneously with live cursor presence and conflict-free synchronization.

## Goals
- Real-time sync without conflicts
- Show who else is viewing/editing
- Work offline with eventual consistency

## Implementation Plan

### Phase 1: Core Sync Infrastructure
Set up the foundational CRDT and synchronization layer.
- [x] Install Yjs and y-websocket dependencies
- [x] Create Yjs document provider
- [ ] Set up WebSocket server
- [ ] Implement basic document sync

### Phase 2: Presence System
User awareness and cursor presence.
- [ ] Implement awareness protocol
- [ ] Create CursorPresence component
- [ ] Add user avatar display
- [ ] Smooth cursor interpolation
`;

// ============================================
// MOCK DATA: Chat Messages
// ============================================

const initialPlanningMessages: ChatPanelMessage[] = [
  {
    id: 'sys-1',
    content: `I'll help you plan "Real-time collaborative editing". This is a complex feature that will benefit from careful planning.

Based on my analysis, here's what we need to consider:

**Key Components:**
- CRDT library (Yjs recommended) for conflict-free sync
- WebSocket server for real-time communication
- Presence system for cursor/selection display

I've created a phased plan in the Plan tab. Would you like to discuss any part of it?`,
    timestamp: new Date(),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const messagesWithMockPrompt: ChatPanelMessage[] = [
  ...initialPlanningMessages,
  {
    id: 'user-1',
    content: 'Create a UI mock for the landing page',
    timestamp: new Date(Date.now() - 60000),
    senderName: 'You',
    isOwn: true,
  },
];

const messagesWithOptions: ChatPanelMessage[] = [
  ...messagesWithMockPrompt,
  {
    id: 'assistant-1',
    content: `I've generated 4 landing page options for you. Each one takes a different approach:

**Option A** - Dark gradient hero with centered content and feature grid
**Option B** - Clean split layout with stats section
**Option C** - Modern dark theme with gradient accents and video preview
**Option D** - Bold typography-first design with minimal elements

You can:
1. **Choose one** to use as the starting point
2. **Describe what you like** about each and I'll regenerate with those preferences

Click any option to preview it in full size.`,
    timestamp: new Date(Date.now() - 30000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const messagesWithFeedback: ChatPanelMessage[] = [
  ...messagesWithOptions,
  {
    id: 'user-2',
    content: 'I like the dark theme from A and C, but prefer the split layout from B. Can you combine those? Also make it more minimal.',
    timestamp: new Date(Date.now() - 20000),
    senderName: 'You',
    isOwn: true,
  },
];

const messagesWithRegeneratedOptions: ChatPanelMessage[] = [
  ...messagesWithFeedback,
  {
    id: 'assistant-2',
    content: `I've regenerated the options based on your feedback:

- **Dark theme** from options A and C
- **Split layout** structure from option B
- **More minimal** overall design

All four options now feature a dark color scheme with a two-column hero layout. Take a look and let me know if any of these work, or if you'd like to refine further.`,
    timestamp: new Date(Date.now() - 10000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

// ============================================
// MOCK DATA: Multiplayer Chat Messages
// ============================================

const multiplayerMessagesInitial: ChatPanelMessage[] = [
  {
    id: 'sys-collab-1',
    content: `Welcome to collaborative design mode. **Sarah Chen**, **Mike Johnson**, and **Emma Wilson** have joined the session.

I've generated 4 landing page options. Everyone can vote on their favorites and leave feedback. Once you reach consensus, I'll help refine the chosen direction.`,
    timestamp: new Date(Date.now() - 300000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const multiplayerMessagesWithVoting: ChatPanelMessage[] = [
  ...multiplayerMessagesInitial,
  {
    id: 'sarah-1',
    content: 'I really like Option A - the gradient on the hero text is striking. Voted for it.',
    timestamp: new Date(Date.now() - 240000),
    senderName: 'Sarah Chen',
    senderColor: '#8b5cf6',
  },
  {
    id: 'mike-1',
    content: 'Option A looks good but I think C has better balance. The gradient accents are more subtle. Upvoted both A and C.',
    timestamp: new Date(Date.now() - 180000),
    senderName: 'Mike Johnson',
    senderColor: '#10b981',
  },
  {
    id: 'user-collab-1',
    content: 'I\'m torn between B and C. B has cleaner stats section, but C\'s overall vibe is better. Going with C.',
    timestamp: new Date(Date.now() - 120000),
    senderName: 'You',
    isOwn: true,
  },
];

const multiplayerMessagesWithFeedback: ChatPanelMessage[] = [
  ...multiplayerMessagesWithVoting,
  {
    id: 'emma-1',
    content: 'Just joined! Looking at the options now. I think B\'s layout is most professional for enterprise clients.',
    timestamp: new Date(Date.now() - 90000),
    senderName: 'Emma Wilson',
    senderColor: '#f59e0b',
  },
  {
    id: 'sarah-2',
    content: 'Good point Emma. Maybe we can combine C\'s color scheme with B\'s professional layout?',
    timestamp: new Date(Date.now() - 60000),
    senderName: 'Sarah Chen',
    senderColor: '#8b5cf6',
  },
];

const multiplayerMessagesSynthesis: ChatPanelMessage[] = [
  ...multiplayerMessagesWithFeedback,
  {
    id: 'assistant-synthesis',
    content: `I'm seeing some interesting patterns in the team's feedback:

**What's resonating:**
- Dark theme (A, C) - 3 votes
- Professional layout (B) - 2 mentions
- Gradient accents (C) - 2 mentions
- Clean stats section (B) - 1 mention

**Suggested direction:**
Combine C's dark theme and gradient accents with B's professional two-column layout and stats section.

Should I generate new options based on this synthesis?`,
    timestamp: new Date(Date.now() - 45000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const multiplayerMessagesConsensus: ChatPanelMessage[] = [
  ...multiplayerMessagesSynthesis,
  {
    id: 'mike-2',
    content: 'That sounds perfect. Let\'s see what you come up with!',
    timestamp: new Date(Date.now() - 40000),
    senderName: 'Mike Johnson',
    senderColor: '#10b981',
  },
  {
    id: 'user-collab-2',
    content: 'Agreed, go for it.',
    timestamp: new Date(Date.now() - 35000),
    senderName: 'You',
    isOwn: true,
  },
  {
    id: 'sarah-3',
    content: '+1',
    timestamp: new Date(Date.now() - 30000),
    senderName: 'Sarah Chen',
    senderColor: '#8b5cf6',
  },
  {
    id: 'assistant-consensus',
    content: `Great! I've regenerated the options incorporating everyone's feedback.

**All options now feature:**
- Dark theme with gradient accents (from C)
- Professional two-column layout (from B)
- Clean stats section (from B)

Option C is currently leading with **4 votes**. If everyone's happy, we can lock this in and move to implementation.`,
    timestamp: new Date(Date.now() - 20000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

const multiplayerMessagesFinalVote: ChatPanelMessage[] = [
  ...multiplayerMessagesConsensus,
  {
    id: 'emma-2',
    content: 'Option C looks great now. Changing my vote.',
    timestamp: new Date(Date.now() - 15000),
    senderName: 'Emma Wilson',
    senderColor: '#f59e0b',
  },
  {
    id: 'assistant-final',
    content: `**Consensus reached!**

Option C has unanimous approval from the team. I'll use this as the final design direction.

**Next steps:**
1. Export design assets
2. Create component specifications
3. Begin implementation

Would you like me to proceed with any of these?`,
    timestamp: new Date(Date.now() - 5000),
    senderName: 'Plan Agent',
    senderColor: 'var(--success-fg)',
    renderMarkdown: true,
  },
];

// ============================================
// REUSABLE COMPONENTS
// ============================================

/** Artifact tab bar with Plan, Document, and dynamic tabs */
function ArtifactTabs({
  activeTab,
  onTabChange,
  tabs,
}: {
  activeTab: ArtifactTab;
  onTabChange: (tab: ArtifactTab) => void;
  tabs: { id: ArtifactTab; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className={styles.artifactTabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.artifactTab} ${activeTab === tab.id ? styles.artifactTabActive : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Single mock preview card with scaled iframe */
function MockPreviewCard({
  option,
  onClick,
  isGenerating = false,
}: {
  option: MockOption;
  onClick: () => void;
  isGenerating?: boolean;
}) {
  return (
    <button
      className={styles.mockPreviewCard}
      onClick={onClick}
      disabled={isGenerating}
    >
      <div className={styles.mockPreviewLabel}>Option {option.label}</div>
      <div className={styles.mockPreviewIframeWrapper}>
        {isGenerating ? (
          <div className={styles.mockPreviewGenerating}>
            <Spinner size="md" />
            <Text size="sm" color="soft">Generating...</Text>
          </div>
        ) : (
          <iframe
            srcDoc={option.html}
            className={styles.mockPreviewIframe}
            title={`Option ${option.label}`}
            sandbox="allow-same-origin"
          />
        )}
      </div>
      {!isGenerating && (
        <div className={styles.mockPreviewOverlay}>
          <Text size="sm" weight="medium">Click to preview</Text>
        </div>
      )}
    </button>
  );
}

/** 2x2 grid of mock options */
function MockOptionsGrid({
  options,
  onSelectOption,
  isGenerating = false,
}: {
  options: MockOption[];
  onSelectOption: (option: MockOption) => void;
  isGenerating?: boolean;
}) {
  return (
    <div className={styles.mockOptionsGrid}>
      {options.map((option) => (
        <MockPreviewCard
          key={option.id}
          option={option}
          onClick={() => onSelectOption(option)}
          isGenerating={isGenerating}
        />
      ))}
    </div>
  );
}

/** Viewport size toggle for preview dialog */
function ViewportToggle({
  size,
  onChange,
}: {
  size: ViewportSize;
  onChange: (size: ViewportSize) => void;
}) {
  const viewports: { id: ViewportSize; label: string; width: string }[] = [
    { id: 'desktop', label: 'Desktop', width: '1280' },
    { id: 'tablet', label: 'Tablet', width: '768' },
    { id: 'mobile', label: 'Mobile', width: '375' },
  ];

  return (
    <div className={styles.viewportToggle}>
      {viewports.map((viewport) => (
        <Button
          key={viewport.id}
          variant={size === viewport.id ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onChange(viewport.id)}
        >
          {viewport.label}
        </Button>
      ))}
    </div>
  );
}

/** Collaborator presence indicator */
function CollaboratorPresence({
  collaborators,
  showCount = true,
}: {
  collaborators: Collaborator[];
  showCount?: boolean;
}) {
  const onlineCollaborators = collaborators.filter(c => c.isOnline);

  return (
    <div className={styles.collaboratorPresence}>
      <AvatarGroup max={4} size="sm">
        {collaborators.map((collaborator) => (
          <Tooltip key={collaborator.id} content={`${collaborator.name}${collaborator.isOnline ? '' : ' (offline)'}`}>
            <Avatar
              fallback={collaborator.initials}
              color={collaborator.color}
              className={collaborator.isOnline ? '' : styles.avatarOffline}
            />
          </Tooltip>
        ))}
      </AvatarGroup>
      {showCount && (
        <Text size="sm" color="soft">{onlineCollaborators.length} online</Text>
      )}
    </div>
  );
}

/** Vote indicator badge */
function VoteBadge({ votes }: { votes: Vote[] }) {
  const upVotes = votes.filter(v => v.vote === 'up');
  const downVotes = votes.filter(v => v.vote === 'down');

  if (votes.length === 0) return null;

  return (
    <div className={styles.voteBadge}>
      {upVotes.length > 0 && (
        <Tooltip
          content={
            <div>
              <strong>Upvotes:</strong>
              {upVotes.map(v => (
                <div key={v.odor}>{v.odor}{v.comment ? `: "${v.comment}"` : ''}</div>
              ))}
            </div>
          }
        >
          <div className={styles.voteCount}>
            <ThumbsUpIcon />
            <span>{upVotes.length}</span>
            <AvatarGroup max={3} size="xs">
              {upVotes.map((v) => (
                <Avatar key={v.odor} fallback={v.odorInitials} color={v.odorColor} />
              ))}
            </AvatarGroup>
          </div>
        </Tooltip>
      )}
      {downVotes.length > 0 && (
        <Tooltip
          content={
            <div>
              <strong>Downvotes:</strong>
              {downVotes.map(v => (
                <div key={v.odor}>{v.odor}{v.comment ? `: "${v.comment}"` : ''}</div>
              ))}
            </div>
          }
        >
          <div className={`${styles.voteCount} ${styles.voteCountDown}`}>
            <ThumbsDownIcon />
            <span>{downVotes.length}</span>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

/** Voting actions for an option */
function VotingActions({
  optionId,
  hasVoted,
  onVote,
}: {
  optionId: string;
  hasVoted?: 'up' | 'down' | null;
  onVote: (optionId: string, vote: 'up' | 'down') => void;
}) {
  const votingClasses = [
    styles.votingActions,
    'surface inverted',
    hasVoted && styles.votingActionsVoted,
  ].filter(Boolean).join(' ');

  return (
    <div className={votingClasses}>
      <IconButton
        variant={hasVoted === 'up' ? 'primary' : 'outline'}
        icon={<ThumbsUpIcon />}
        aria-label="Vote up"
        onClick={(e) => {
          e.stopPropagation();
          onVote(optionId, 'up');
        }}
      />
      <IconButton
        variant={hasVoted === 'down' ? 'danger' : 'outline'}
        icon={<ThumbsDownIcon />}
        aria-label="Vote down"
        onClick={(e) => {
          e.stopPropagation();
          onVote(optionId, 'down');
        }}
      />
    </div>
  );
}

/** Mock preview card with voting support */
function MockPreviewCardWithVoting({
  option,
  onClick,
  isGenerating = false,
  showVoting = false,
  isWinner = false,
  onVote,
}: {
  option: MockOption;
  onClick: () => void;
  isGenerating?: boolean;
  showVoting?: boolean;
  isWinner?: boolean;
  onVote?: (optionId: string, vote: 'up' | 'down') => void;
}) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = (optionId: string, vote: 'up' | 'down') => {
    setUserVote(vote === userVote ? null : vote);
    onVote?.(optionId, vote);
  };

  return (
    <button
      className={`${styles.mockPreviewCard} ${isWinner ? styles.mockPreviewCardWinner : ''}`}
      onClick={onClick}
      disabled={isGenerating}
    >
      <div className={styles.mockPreviewLabel}>
        Option {option.label}
        {isWinner && <CheckCircleIcon className={styles.winnerIcon} />}
      </div>
      {option.votes && option.votes.length > 0 && (
        <VoteBadge votes={option.votes} />
      )}
      <div className={styles.mockPreviewIframeWrapper}>
        {isGenerating ? (
          <div className={styles.mockPreviewGenerating}>
            <Spinner size="md" />
            <Text size="sm" color="soft">Generating...</Text>
          </div>
        ) : (
          <iframe
            srcDoc={option.html}
            className={styles.mockPreviewIframe}
            title={`Option ${option.label}`}
            sandbox="allow-same-origin"
          />
        )}
      </div>
      {!isGenerating && (
        <div className={styles.mockPreviewOverlay}>
          {showVoting ? (
            <VotingActions optionId={option.id} hasVoted={userVote} onVote={handleVote} />
          ) : (
            <Text size="sm" weight="medium">Click to preview</Text>
          )}
        </div>
      )}
    </button>
  );
}

/** Grid with voting support */
function MockOptionsGridWithVoting({
  options,
  onSelectOption,
  isGenerating = false,
  showVoting = false,
  winnerId,
  onVote,
}: {
  options: MockOption[];
  onSelectOption: (option: MockOption) => void;
  isGenerating?: boolean;
  showVoting?: boolean;
  winnerId?: string;
  onVote?: (optionId: string, vote: 'up' | 'down') => void;
}) {
  return (
    <div className={styles.mockOptionsGrid}>
      {options.map((option) => (
        <MockPreviewCardWithVoting
          key={option.id}
          option={option}
          onClick={() => onSelectOption(option)}
          isGenerating={isGenerating}
          showVoting={showVoting}
          isWinner={option.id === winnerId}
          onVote={onVote}
        />
      ))}
    </div>
  );
}

/** Chat panel with collaborator presence */
function CollaborativeChatPanelWrapper({
  messages,
  collaborators,
  isThinking = false,
  inputPlaceholder = 'Share your thoughts...',
  typingUsers = [],
}: {
  messages: ChatPanelMessage[];
  collaborators: Collaborator[];
  isThinking?: boolean;
  inputPlaceholder?: string;
  typingUsers?: string[];
}) {
  // Create a map of collaborator colors by name for avatar rendering
  const collaboratorMap = new Map(collaborators.map(c => [c.name, c]));

  // Custom avatar renderer for multi-user chat
  const renderAvatar = (message: ChatPanelMessage) => {
    const collaborator = collaboratorMap.get(message.senderName);

    if (collaborator) {
      return (
        <Avatar
          fallback={collaborator.initials}
          color={collaborator.color}
          size="sm"
        />
      );
    }

    // Default avatar for agent
    if (message.senderName === 'Plan Agent') {
      return (
        <Avatar
          fallback="AI"
          color="var(--success-fg)"
          size="sm"
        />
      );
    }

    return null;
  };

  // Convert collaborators to ChatParticipant format
  const participants = collaborators.map(c => ({
    id: c.id,
    name: c.name,
    initials: c.initials,
    color: c.color,
    isCurrentUser: c.name === 'You',
  }));

  return (
    <ChatProvider mode="group" participants={participants}>
      <div className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderLeft}>
            <UsersIcon className={styles.agentIcon} />
            <Text weight="medium">Team Design Session</Text>
            <span className={styles.connectionStatus}>
              <span className={styles.connectionDot} />
              Live
            </span>
          </div>
          <CollaboratorPresence collaborators={collaborators} showCount={false} />
        </div>

        <ChatPanel
          messages={messages}
          className={styles.chatMessages}
          typingUsers={typingUsers}
          isLoading={isThinking}
          loadingText="Agent is thinking..."
          renderAvatar={renderAvatar}
        />

        <div className={styles.chatInputArea}>
          <ChatInput
            placeholder={inputPlaceholder}
            size="md"
            fullWidth
            disabled={isThinking}
          />
        </div>
      </div>
    </ChatProvider>
  );
}

type ThemeMode = 'light' | 'dark';
type DirectionMode = 'ltr' | 'rtl';

/** Theme toggle for preview dialog */
function ThemeToggle({
  theme,
  onChange,
}: {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  return (
    <div className={styles.themeToggle}>
      <IconButton
        variant={theme === 'light' ? 'primary' : 'ghost'}
        size="sm"
        icon={<SunIcon />}
        aria-label="Light mode"
        onClick={() => onChange('light')}
      />
      <IconButton
        variant={theme === 'dark' ? 'primary' : 'ghost'}
        size="sm"
        icon={<MoonIcon />}
        aria-label="Dark mode"
        onClick={() => onChange('dark')}
      />
    </div>
  );
}

/** Direction toggle for preview dialog */
function DirectionToggle({
  direction,
  onChange,
}: {
  direction: DirectionMode;
  onChange: (direction: DirectionMode) => void;
}) {
  return (
    <div className={styles.directionToggle}>
      <IconButton
        variant={direction === 'ltr' ? 'primary' : 'ghost'}
        size="sm"
        icon={<AlignLeftIcon />}
        aria-label="Left to right"
        onClick={() => onChange('ltr')}
      />
      <IconButton
        variant={direction === 'rtl' ? 'primary' : 'ghost'}
        size="sm"
        icon={<AlignRightIcon />}
        aria-label="Right to left"
        onClick={() => onChange('rtl')}
      />
    </div>
  );
}

/** Inject theme and direction into HTML */
function injectHtmlSettings(html: string, theme: ThemeMode, direction: DirectionMode): string {
  // Add theme class and direction to body
  const themeStyles = theme === 'dark' ? '' : `
    <style>
      body {
        filter: invert(1) hue-rotate(180deg);
      }
      img, video, iframe {
        filter: invert(1) hue-rotate(180deg);
      }
    </style>
  `;

  // For RTL, we need to add dir attribute and mirror the layout
  const rtlStyles = direction === 'rtl' ? `
    <style>
      body { direction: rtl; }
      .hero { direction: rtl; }
      .cta, .cta-group, .cta-row { flex-direction: row-reverse; }
      .features { direction: rtl; }
      .stats { flex-direction: row-reverse; }
      .nav-links { flex-direction: row-reverse; }
      .brand-logos { flex-direction: row-reverse; }
    </style>
  ` : '';

  // Insert styles after <head> tag
  return html.replace('</head>', `${theme === 'light' ? themeStyles : ''}${rtlStyles}</head>`);
}

/** Full preview dialog with responsive controls */
function MockPreviewDialog({
  option,
  onClose,
  onChoose,
}: {
  option: MockOption;
  onClose: () => void;
  onChoose: () => void;
}) {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [isMaximized, setIsMaximized] = useState(false);
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [direction, setDirection] = useState<DirectionMode>('ltr');
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const viewportWidths: Record<ViewportSize, number> = {
    desktop: 1280,
    tablet: 768,
    mobile: 375,
  };

  const handleMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;

    const startX = e.clientX;
    const startWidth = previewWidth || viewportWidths[viewportSize];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;

      const diff = side === 'right'
        ? moveEvent.clientX - startX
        : startX - moveEvent.clientX;

      const newWidth = Math.max(320, Math.min(1920, startWidth + diff * 2));
      setPreviewWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const effectiveWidth = previewWidth || viewportWidths[viewportSize];
  const processedHtml = injectHtmlSettings(option.html, theme, direction);

  return (
    <div className={`${styles.previewDialogOverlay} ${isMaximized ? styles.maximized : ''}`}>
      <div className={styles.previewDialog} ref={containerRef}>
        <div className={styles.previewDialogHeader}>
          <div className={styles.previewDialogHeaderLeft}>
            <Text weight="medium">Option {option.label}</Text>
            <Chip size="sm" variant="default">{effectiveWidth}px</Chip>
          </div>
          <div className={styles.previewDialogHeaderCenter}>
            <ViewportToggle size={viewportSize} onChange={(size) => {
              setViewportSize(size);
              setPreviewWidth(null);
            }} />
            <div className={styles.previewDivider} />
            <ThemeToggle theme={theme} onChange={setTheme} />
            <div className={styles.previewDivider} />
            <DirectionToggle direction={direction} onChange={setDirection} />
          </div>
          <div className={styles.previewDialogHeaderRight}>
            <IconButton
              variant="ghost"
              icon={isMaximized ? <MinimizeIcon /> : <MaximizeIcon />}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
              onClick={() => setIsMaximized(!isMaximized)}
            />
            <IconButton
              variant="ghost"
              icon={<CloseIcon />}
              aria-label="Close preview"
              onClick={onClose}
            />
          </div>
        </div>
        <div className={styles.previewDialogBody}>
          <div
            className={styles.resizeHandle}
            style={{ left: `calc(50% - ${effectiveWidth / 2}px - 8px)` }}
            onMouseDown={handleMouseDown('left')}
          />
          <div
            className={styles.previewIframeContainer}
            style={{ width: effectiveWidth }}
          >
            <iframe
              srcDoc={processedHtml}
              className={styles.previewIframe}
              title={`Preview Option ${option.label}`}
              sandbox="allow-same-origin"
            />
          </div>
          <div
            className={styles.resizeHandle}
            style={{ right: `calc(50% - ${effectiveWidth / 2}px - 8px)` }}
            onMouseDown={handleMouseDown('right')}
          />
        </div>
        <div className={styles.previewDialogFooter}>
          <Button variant="default" onClick={onClose}>Back to options</Button>
          <Button variant="primary" onClick={onChoose}>Use this design</Button>
        </div>
      </div>
    </div>
  );
}

/** Plan view sidebar (reused from NewIdeaInputFlow) */
function PlanViewSidebar({ phases }: { phases: PlanPhase[] }) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases.filter(p => p.expanded).map(p => p.id))
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = phases.reduce((sum, p) => sum + p.tasks.filter(t => t.completed).length, 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={styles.planView}>
      <div className={styles.planToolbar}>
        <div className={styles.planProgress}>
          <div style={{ width: 120 }}>
            <Progress value={progressPercent} size="sm" />
          </div>
          <Text size="sm" color="soft">{completedTasks}/{totalTasks} tasks</Text>
        </div>
      </div>
      <div className={styles.planContent}>
        {phases.map((phase, phaseIndex) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseCompletedTasks = phase.tasks.filter(t => t.completed).length;
          const phaseProgress = phase.tasks.length > 0
            ? Math.round((phaseCompletedTasks / phase.tasks.length) * 100)
            : 0;

          return (
            <div key={phase.id} className={styles.planPhase}>
              <button
                className={styles.planPhaseHeader}
                onClick={() => togglePhase(phase.id)}
                aria-expanded={isExpanded}
              >
                <span className={styles.planPhaseToggle}>
                  {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <span className={styles.planPhaseNumber}>{phaseIndex + 1}</span>
                <span className={styles.planPhaseTitle}>{phase.title}</span>
                <span className={styles.planPhaseProgress}>
                  {phaseProgress === 100 ? (
                    <CheckCircleIcon style={{ color: 'var(--success-fg)' }} />
                  ) : (
                    <Text size="sm" color="soft">{phaseCompletedTasks}/{phase.tasks.length}</Text>
                  )}
                </span>
              </button>
              {isExpanded && (
                <div className={styles.planPhaseContent}>
                  {phase.description && (
                    <Text size="sm" color="soft" className={styles.planPhaseDescription}>
                      {phase.description}
                    </Text>
                  )}
                  <div className={styles.planTasks}>
                    {phase.tasks.map((task) => (
                      <div key={task.id} className={`${styles.planTask} ${task.inProgress ? styles.planTaskInProgress : ''}`}>
                        {task.inProgress ? (
                          <Spinner size="sm" />
                        ) : (
                          <Checkbox checked={task.completed} aria-label={task.title} />
                        )}
                        <span className={`${styles.planTaskTitle} ${task.completed ? styles.planTaskCompleted : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Chat panel wrapper with header */
function ChatPanelWrapper({
  messages,
  isThinking = false,
  inputPlaceholder = 'Ask questions or refine the plan...',
}: {
  messages: ChatPanelMessage[];
  isThinking?: boolean;
  inputPlaceholder?: string;
}) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <StarIcon className={styles.agentIcon} />
          <Text weight="medium">Plan Agent</Text>
          <span className={styles.connectionStatus}>
            <span className={styles.connectionDot} />
            Connected
          </span>
        </div>
      </div>

      <ChatPanel
        messages={messages}
        className={styles.chatMessages}
      />

      <div className={styles.chatInputArea}>
        <ThinkingIndicator isActive={isThinking} showEscapeHint={false} />
        <ChatInput
          placeholder={inputPlaceholder}
          size="md"
          fullWidth
          disabled={isThinking}
        />
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface MultiEditingFlowProps {
  messages: ChatPanelMessage[];
  activeTab: ArtifactTab;
  showUIMockTab?: boolean;
  mockOptions?: MockOption[];
  isGenerating?: boolean;
  isThinking?: boolean;
  previewOption?: MockOption | null;
}

function MultiEditingFlowComponent({
  messages,
  activeTab: initialActiveTab,
  showUIMockTab = false,
  mockOptions: options = mockOptions,
  isGenerating = false,
  isThinking = false,
  previewOption: initialPreviewOption = null,
}: MultiEditingFlowProps) {
  const [activeTab, setActiveTab] = useState<ArtifactTab>(initialActiveTab);
  const [previewOption, setPreviewOption] = useState<MockOption | null>(initialPreviewOption);
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');

  const tabs: { id: ArtifactTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'document', label: 'Document' },
  ];

  if (showUIMockTab) {
    tabs.push({ id: 'ui-mock', label: 'Landing Page', icon: <ImageIcon /> });
  }

  const renderArtifactContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanViewSidebar phases={planPhases} />;
      case 'document':
        return (
          <div className={styles.docEditor}>
            <MarkdownCoEditor
              value={planMarkdown}
              mode={docViewMode}
              onModeChange={setDocViewMode}
              fullPage
              placeholder="Plan details..."
            />
          </div>
        );
      case 'ui-mock':
        return (
          <div className={styles.mockTabContent}>
            <MockOptionsGrid
              options={options}
              onSelectOption={setPreviewOption}
              isGenerating={isGenerating}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.planningDialog}>
        <div className={styles.planningHeader}>
          <div className={styles.planningHeaderLeft}>
            <Heading level={2} size={4}>Planning: Real-time Collaborative Editing</Heading>
            <Chip size="sm" variant="default">Collaboration</Chip>
          </div>
          <div className={styles.planningHeaderRight}>
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.planningBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <ChatPanelWrapper
                  messages={messages}
                  isThinking={isThinking}
                  inputPlaceholder={showUIMockTab ? 'Describe what you like or ask for changes...' : 'Ask questions or refine the plan...'}
                />
              </div>
            }
            second={
              <div className={styles.artifactSection}>
                <ArtifactTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={tabs}
                />
                <div className={styles.artifactContent}>
                  {renderArtifactContent()}
                </div>
              </div>
            }
          />
        </div>
        <div className={styles.planningFooter}>
          <div className={styles.folderChips}>
            <Button
              variant="outline"
              icon={<FolderIcon />}
              iconAfter={<ChevronDownIcon />}
            >
              ~/git/.../my-project/
            </Button>
            <IconButton
              variant="ghost"
              icon={<AddIcon />}
              aria-label="Add folder"
            />
          </div>
          <div className={styles.footerActions}>
            <Button variant="default">Save Draft</Button>
            <Button variant="primary" icon={<PlayIcon />}>Execute Plan</Button>
          </div>
        </div>
      </div>

      {previewOption && (
        <MockPreviewDialog
          option={previewOption}
          onClose={() => setPreviewOption(null)}
          onChoose={() => setPreviewOption(null)}
        />
      )}
    </div>
  );
}

// ============================================
// STORYBOOK CONFIG
// ============================================

const meta: Meta<typeof MultiEditingFlowComponent> = {
  title: 'Example Pages/Ideate Ideas/Multi Editing Flow',
  component: MultiEditingFlowComponent,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MultiEditingFlowComponent>;

/**
 * Step 1: Initial planning view with Plan tab active
 */
export const Step1_InitialPlanning: Story = {
  name: '1. Initial Planning View',
  args: {
    messages: initialPlanningMessages,
    activeTab: 'plan',
    showUIMockTab: false,
  },
};

/**
 * Step 2: User prompts to create a UI mock
 */
export const Step2_PromptForMock: Story = {
  name: '2. User Prompts for UI Mock',
  args: {
    messages: messagesWithMockPrompt,
    activeTab: 'plan',
    showUIMockTab: false,
    isThinking: true,
  },
};

/**
 * Step 3: Generating mock options (loading state)
 */
export const Step3_GeneratingMocks: Story = {
  name: '3. Generating Mock Options',
  args: {
    messages: messagesWithMockPrompt,
    activeTab: 'ui-mock',
    showUIMockTab: true,
    isGenerating: true,
    isThinking: true,
  },
};

/**
 * Step 4: Mock options displayed in grid
 */
export const Step4_MockOptionsDisplayed: Story = {
  name: '4. Mock Options Displayed',
  args: {
    messages: messagesWithOptions,
    activeTab: 'ui-mock',
    showUIMockTab: true,
    mockOptions: mockOptions,
  },
};

/**
 * Step 5: User provides feedback on options
 */
export const Step5_UserFeedback: Story = {
  name: '5. User Provides Feedback',
  args: {
    messages: messagesWithFeedback,
    activeTab: 'ui-mock',
    showUIMockTab: true,
    mockOptions: mockOptions,
    isThinking: true,
  },
};

/**
 * Step 6: Options regenerating based on feedback
 */
export const Step6_RegeneratingOptions: Story = {
  name: '6. Regenerating Options',
  args: {
    messages: messagesWithFeedback,
    activeTab: 'ui-mock',
    showUIMockTab: true,
    isGenerating: true,
    isThinking: true,
  },
};

/**
 * Step 7: Regenerated options displayed
 */
export const Step7_RegeneratedOptions: Story = {
  name: '7. Regenerated Options',
  args: {
    messages: messagesWithRegeneratedOptions,
    activeTab: 'ui-mock',
    showUIMockTab: true,
    mockOptions: regeneratedOptions,
  },
};

/**
 * Interactive demo with preview dialog
 */
function InteractiveMockDemo() {
  const [activeTab, setActiveTab] = useState<ArtifactTab>('ui-mock');
  const [previewOption, setPreviewOption] = useState<MockOption | null>(null);
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');

  const tabs: { id: ArtifactTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'document', label: 'Document' },
    { id: 'ui-mock', label: 'Landing Page', icon: <ImageIcon /> },
  ];

  const renderArtifactContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanViewSidebar phases={planPhases} />;
      case 'document':
        return (
          <div className={styles.docEditor}>
            <MarkdownCoEditor
              value={planMarkdown}
              mode={docViewMode}
              onModeChange={setDocViewMode}
              fullPage
              placeholder="Plan details..."
            />
          </div>
        );
      case 'ui-mock':
        return (
          <div className={styles.mockTabContent}>
            <MockOptionsGrid
              options={regeneratedOptions}
              onSelectOption={setPreviewOption}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.planningDialog}>
        <div className={styles.planningHeader}>
          <div className={styles.planningHeaderLeft}>
            <Heading level={2} size={4}>Planning: Real-time Collaborative Editing</Heading>
            <Chip size="sm" variant="default">Collaboration</Chip>
          </div>
          <div className={styles.planningHeaderRight}>
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.planningBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <ChatPanelWrapper
                  messages={messagesWithRegeneratedOptions}
                  inputPlaceholder="Describe what you like or ask for changes..."
                />
              </div>
            }
            second={
              <div className={styles.artifactSection}>
                <ArtifactTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={tabs}
                />
                <div className={styles.artifactContent}>
                  {renderArtifactContent()}
                </div>
              </div>
            }
          />
        </div>
        <div className={styles.planningFooter}>
          <div className={styles.folderChips}>
            <Button
              variant="outline"
              icon={<FolderIcon />}
              iconAfter={<ChevronDownIcon />}
            >
              ~/git/.../my-project/
            </Button>
            <IconButton
              variant="ghost"
              icon={<AddIcon />}
              aria-label="Add folder"
            />
          </div>
          <div className={styles.footerActions}>
            <Button variant="default">Save Draft</Button>
            <Button variant="primary" icon={<PlayIcon />}>Execute Plan</Button>
          </div>
        </div>
      </div>

      {previewOption && (
        <MockPreviewDialog
          option={previewOption}
          onClose={() => setPreviewOption(null)}
          onChoose={() => setPreviewOption(null)}
        />
      )}
    </div>
  );
}

export const Interactive_FullDemo: Story = {
  name: 'Interactive - Click to Preview',
  render: () => <InteractiveMockDemo />,
};

/**
 * Preview dialog in isolation
 */
export const PreviewDialog_Desktop: Story = {
  name: 'Preview Dialog - Desktop',
  render: () => (
    <MockPreviewDialog
      option={mockOptions[0]}
      onClose={() => {}}
      onChoose={() => {}}
    />
  ),
};

// ============================================
// MULTIPLAYER COLLABORATION STORIES
// ============================================

/** Multiplayer collaboration component */
function MultiplayerCollaborationComponent({
  messages,
  collaborators: collabs,
  options,
  showVoting = false,
  winnerId,
  isThinking = false,
  typingUsers = [],
}: {
  messages: ChatPanelMessage[];
  collaborators: Collaborator[];
  options: MockOption[];
  showVoting?: boolean;
  winnerId?: string;
  isThinking?: boolean;
  typingUsers?: string[];
}) {
  const [activeTab, setActiveTab] = useState<ArtifactTab>('ui-mock');
  const [previewOption, setPreviewOption] = useState<MockOption | null>(null);
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');

  const tabs: { id: ArtifactTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'document', label: 'Document' },
    { id: 'ui-mock', label: 'Landing Page', icon: <ImageIcon /> },
  ];

  const renderArtifactContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanViewSidebar phases={planPhases} />;
      case 'document':
        return (
          <div className={styles.docEditor}>
            <MarkdownCoEditor
              value={planMarkdown}
              mode={docViewMode}
              onModeChange={setDocViewMode}
              fullPage
              placeholder="Plan details..."
            />
          </div>
        );
      case 'ui-mock':
        return (
          <div className={styles.mockTabContent}>
            <div className={styles.votingHeader}>
              <Text weight="medium">Vote for your favorites</Text>
              <Chip size="sm" variant="info">{options.reduce((sum, o) => sum + (o.votes?.length || 0), 0)} votes cast</Chip>
            </div>
            <MockOptionsGridWithVoting
              options={options}
              onSelectOption={setPreviewOption}
              showVoting={showVoting}
              winnerId={winnerId}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.planningDialog}>
        <div className={styles.planningHeader}>
          <div className={styles.planningHeaderLeft}>
            <Heading level={2} size={4}>Team Design Session</Heading>
            <Chip size="sm" variant="success">Live</Chip>
          </div>
          <div className={styles.planningHeaderRight}>
            <CollaboratorPresence collaborators={collabs} />
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.planningBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <CollaborativeChatPanelWrapper
                  messages={messages}
                  collaborators={collabs}
                  isThinking={isThinking}
                  typingUsers={typingUsers}
                  inputPlaceholder="Share your thoughts on the designs..."
                />
              </div>
            }
            second={
              <div className={styles.artifactSection}>
                <ArtifactTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={tabs}
                />
                <div className={styles.artifactContent}>
                  {renderArtifactContent()}
                </div>
              </div>
            }
          />
        </div>
        <div className={styles.planningFooter}>
          <div className={styles.folderChips}>
            <Button
              variant="outline"
              icon={<FolderIcon />}
              iconAfter={<ChevronDownIcon />}
            >
              ~/git/.../my-project/
            </Button>
          </div>
          <div className={styles.footerActions}>
            {winnerId ? (
              <>
                <Button variant="default">Export Assets</Button>
                <Button variant="primary" icon={<PlayIcon />}>Begin Implementation</Button>
              </>
            ) : (
              <>
                <Button variant="default">Save Draft</Button>
                <Button variant="primary" disabled>Waiting for consensus...</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {previewOption && (
        <MockPreviewDialog
          option={previewOption}
          onClose={() => setPreviewOption(null)}
          onChoose={() => setPreviewOption(null)}
        />
      )}
    </div>
  );
}

/**
 * Multiplayer: Session starts, options displayed
 */
export const Collab1_SessionStart: Story = {
  name: 'Collab 1. Session Starts',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesInitial}
      collaborators={collaborators}
      options={regeneratedOptions}
      showVoting={true}
    />
  ),
};

/**
 * Multiplayer: Team members voting
 */
export const Collab2_VotingInProgress: Story = {
  name: 'Collab 2. Voting in Progress',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesWithVoting}
      collaborators={collaborators}
      options={optionsWithVotes}
      showVoting={true}
      typingUsers={['Emma Wilson']}
    />
  ),
};

/**
 * Multiplayer: Team members providing feedback
 */
export const Collab3_TeamFeedback: Story = {
  name: 'Collab 3. Team Feedback',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesWithFeedback}
      collaborators={collaborators}
      options={optionsWithVotes}
      showVoting={true}
    />
  ),
};

/**
 * Multiplayer: Agent synthesizes feedback
 */
export const Collab4_AgentSynthesis: Story = {
  name: 'Collab 4. Agent Synthesizes Feedback',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesSynthesis}
      collaborators={collaborators}
      options={optionsWithVotes}
      showVoting={true}
      isThinking={false}
    />
  ),
};

/**
 * Multiplayer: Consensus building
 */
export const Collab5_ConsensusBuilding: Story = {
  name: 'Collab 5. Consensus Building',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesConsensus}
      collaborators={collaborators}
      options={optionsWithConsensus}
      showVoting={true}
    />
  ),
};

/**
 * Multiplayer: Final vote and winner
 */
export const Collab6_ConsensusReached: Story = {
  name: 'Collab 6. Consensus Reached',
  render: () => (
    <MultiplayerCollaborationComponent
      messages={multiplayerMessagesFinalVote}
      collaborators={collaborators}
      options={optionsWithConsensus}
      showVoting={false}
      winnerId="c"
    />
  ),
};

/**
 * Interactive multiplayer demo
 */
function InteractiveMultiplayerDemo() {
  const [activeTab, setActiveTab] = useState<ArtifactTab>('ui-mock');
  const [previewOption, setPreviewOption] = useState<MockOption | null>(null);
  const [docViewMode, setDocViewMode] = useState<ViewMode>('preview');
  const [votes, setVotes] = useState<Record<string, 'up' | 'down' | null>>({});

  const optionsWithUserVotes: MockOption[] = optionsWithVotes.map(opt => ({
    ...opt,
    votes: [
      ...(opt.votes || []),
      ...(votes[opt.id] ? [{
        odor: 'You',
        odorInitials: 'ME',
        odorColor: '#3b82f6',
        vote: votes[opt.id] as 'up' | 'down',
      }] : []),
    ],
  }));

  const handleVote = (optionId: string, vote: 'up' | 'down') => {
    setVotes(prev => ({
      ...prev,
      [optionId]: prev[optionId] === vote ? null : vote,
    }));
  };

  const tabs: { id: ArtifactTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'document', label: 'Document' },
    { id: 'ui-mock', label: 'Landing Page', icon: <ImageIcon /> },
  ];

  const renderArtifactContent = () => {
    switch (activeTab) {
      case 'plan':
        return <PlanViewSidebar phases={planPhases} />;
      case 'document':
        return (
          <div className={styles.docEditor}>
            <MarkdownCoEditor
              value={planMarkdown}
              mode={docViewMode}
              onModeChange={setDocViewMode}
              fullPage
              placeholder="Plan details..."
            />
          </div>
        );
      case 'ui-mock':
        return (
          <div className={styles.mockTabContent}>
            <div className={styles.votingHeader}>
              <Text weight="medium">Vote for your favorites</Text>
              <Chip size="sm" variant="info">
                {optionsWithUserVotes.reduce((sum, o) => sum + (o.votes?.length || 0), 0)} votes cast
              </Chip>
            </div>
            <MockOptionsGridWithVoting
              options={optionsWithUserVotes}
              onSelectOption={setPreviewOption}
              showVoting={true}
              onVote={handleVote}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.planningDialog}>
        <div className={styles.planningHeader}>
          <div className={styles.planningHeaderLeft}>
            <Heading level={2} size={4}>Team Design Session</Heading>
            <Chip size="sm" variant="success">Live</Chip>
          </div>
          <div className={styles.planningHeaderRight}>
            <CollaboratorPresence collaborators={collaborators} />
            <IconButton variant="ghost" icon={<CloseIcon />} aria-label="Close" />
          </div>
        </div>
        <div className={styles.planningBody}>
          <SplitPane
            orientation="horizontal"
            defaultSize="50%"
            collapsible
            first={
              <div className={styles.chatSection}>
                <CollaborativeChatPanelWrapper
                  messages={multiplayerMessagesWithVoting}
                  collaborators={collaborators}
                  inputPlaceholder="Share your thoughts on the designs..."
                />
              </div>
            }
            second={
              <div className={styles.artifactSection}>
                <ArtifactTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={tabs}
                />
                <div className={styles.artifactContent}>
                  {renderArtifactContent()}
                </div>
              </div>
            }
          />
        </div>
        <div className={styles.planningFooter}>
          <div className={styles.folderChips}>
            <Button
              variant="outline"
              icon={<FolderIcon />}
              iconAfter={<ChevronDownIcon />}
            >
              ~/git/.../my-project/
            </Button>
          </div>
          <div className={styles.footerActions}>
            <Button variant="default">Save Draft</Button>
            <Button variant="primary" disabled>Waiting for consensus...</Button>
          </div>
        </div>
      </div>

      {previewOption && (
        <MockPreviewDialog
          option={previewOption}
          onClose={() => setPreviewOption(null)}
          onChoose={() => setPreviewOption(null)}
        />
      )}
    </div>
  );
}

export const Collab_Interactive: Story = {
  name: 'Collab Interactive - Vote & Preview',
  render: () => <InteractiveMultiplayerDemo />,
};
