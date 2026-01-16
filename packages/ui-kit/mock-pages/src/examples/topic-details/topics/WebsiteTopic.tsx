/**
 * Website Topic - Bookmark collection and web resource management
 */
import { useState } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { CloseIcon } from '@ui-kit/icons/CloseIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { LinkIcon } from '@ui-kit/icons/LinkIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface WebsiteTopic extends BaseTopic {
  type: 'websites';
  heroImage?: string;
  bookmarks: {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    previewImage?: string;
    category: string;
    notes?: string;
    addedAt: Date;
  }[];
  categories: string[];
}

export const sampleWebsites: WebsiteTopic = {
  id: 'websites-1',
  type: 'websites',
  name: 'Design Inspiration',
  description: 'Collection of design resources, inspiration sites, and tools for UI/UX work.',
  heroImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&q=80',
  tags: ['design', 'inspiration', 'ui', 'ux', 'resources'],
  bookmarks: [
    { id: 'b1', title: 'Dribbble', url: 'https://dribbble.com', category: 'Inspiration', notes: 'Great for UI patterns and design inspiration', previewImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&q=60', addedAt: new Date('2024-01-10') },
    { id: 'b2', title: 'Behance', url: 'https://behance.net', category: 'Inspiration', notes: 'Creative portfolios and project showcases', previewImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=60', addedAt: new Date('2024-01-08') },
    { id: 'b3', title: 'Figma Community', url: 'https://figma.com/community', category: 'Tools', notes: 'Free templates and plugins', previewImage: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&q=60', addedAt: new Date('2024-01-05') },
    { id: 'b4', title: 'Coolors', url: 'https://coolors.co', category: 'Tools', notes: 'Color palette generator', previewImage: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=400&q=60', addedAt: new Date('2024-01-03') },
    { id: 'b5', title: 'Mobbin', url: 'https://mobbin.com', category: 'Inspiration', notes: 'Mobile app patterns', previewImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=60', addedAt: new Date('2024-01-01') },
    { id: 'b6', title: 'Laws of UX', url: 'https://lawsofux.com', category: 'Learning', notes: 'UX principles and psychology', previewImage: 'https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=400&q=60', addedAt: new Date('2023-12-28') },
  ],
  categories: ['Inspiration', 'Tools', 'Learning', 'References'],
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2024-01-20'),
  chatCount: 4,
  documentCount: 2,
  ideaCount: 8,
};

export function WebsiteTopicDetail({ topic }: { topic: WebsiteTopic }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredBookmarks = activeCategory
    ? topic.bookmarks.filter(b => b.category === activeCategory)
    : topic.bookmarks;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this website</Button>
            <IconButton variant="ghost" icon={<EditIcon />} aria-label="Edit topic" className={styles.heroActionButton} />
            <IconButton variant="ghost" icon={<ShareIcon />} aria-label="Share" className={styles.heroActionButton} />
          </div>
          <div className={styles.heroOverlay}>
            <div className={styles.heroTags}>
              {topic.tags.map(tag => (
                <span key={tag} className={styles.heroTag}>#{tag}</span>
              ))}
            </div>
            <Heading level={1} size={1} className={styles.heroTitle}>{topic.name}</Heading>
            <Text className={styles.heroSubtitle}>{topic.description}</Text>
          </div>
        </div>
      </div>

      {/* Command Bar */}
      <div className={styles.commandBar}>
        <div className={styles.commandBarStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.bookmarks.length}</span>
            <span className={styles.statLabel}>bookmarks</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.categories.length}</span>
            <span className={styles.statLabel}>categories</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<ChatIcon />}>Ask about this</Button>
          <Button variant="ghost" size="sm" icon={<AddIcon />}>Add bookmark</Button>
          <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit topic" />
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Category Filter */}
      <div className={styles.categoryFilter}>
        <Button
          variant={activeCategory === null ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {topic.categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Bookmarks Grid */}
      <div className={styles.bookmarksGrid}>
        {filteredBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className={styles.bookmarkCard}
            style={bookmark.previewImage ? { backgroundImage: `url(${bookmark.previewImage})` } : undefined}
          >
            <div className={styles.bookmarkContent}>
              <div className={styles.bookmarkTitleRow}>
                <Text weight="medium" className={styles.bookmarkTitle}>{bookmark.title}</Text>
                <Text size="sm" color="soft" className={styles.bookmarkUrl}>
                  {new URL(bookmark.url).hostname}
                </Text>
              </div>
              {bookmark.notes && (
                <Text size="sm" className={styles.bookmarkNotes}>
                  {bookmark.notes}
                </Text>
              )}
            </div>
            <div className={styles.bookmarkActions}>
              <IconButton variant="ghost" size="sm" icon={<LinkIcon />} aria-label="Open link" />
              <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit" />
              <IconButton variant="ghost" size="sm" icon={<CloseIcon />} aria-label="Remove" />
            </div>
          </div>
        ))}

        <button className={styles.addBookmarkCard}>
          <AddIcon />
          <Text size="sm">Add bookmark</Text>
        </button>
      </div>

      {/* Actions */}
      <div className={styles.websitesActions}>
        <Button variant="primary" icon={<ChatIcon />}>Ask about these sites</Button>
        <Button variant="ghost" icon={<ShareIcon />}>Export bookmarks</Button>
      </div>
    </div>
  );
}
