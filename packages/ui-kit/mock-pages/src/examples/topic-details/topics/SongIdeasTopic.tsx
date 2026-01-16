/**
 * Song Ideas Topic - Songwriting inspiration and idea management
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Divider,
  Heading,
  IconButton,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { PlayIcon } from '@ui-kit/icons/PlayIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface SongIdea {
  id: string;
  title: string;
  hook?: string;
  lyricsSnippet?: string;
  genre: string;
  mood: string;
  tempo?: 'slow' | 'medium' | 'fast';
  status: 'spark' | 'developing' | 'ready' | 'recorded';
  rating: number;
  createdAt: Date;
  notes?: string;
}

export interface SongIdeasTopic extends BaseTopic {
  type: 'song-ideas';
  heroImage?: string;
  artist?: string;
  totalIdeas: number;
  ideas: SongIdea[];
  genres: string[];
  moods: string[];
  promptTemplates: { id: string; name: string; template: string }[];
}

export const sampleSongIdeas: SongIdeasTopic = {
  id: 'song-ideas-1',
  type: 'song-ideas',
  name: 'Midnight Muse',
  description: 'A collection of song ideas exploring themes of late-night creativity, urban life, and unexpected connections.',
  heroImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80',
  artist: 'Personal Project',
  tags: ['songwriting', 'creative', 'indie', 'pop'],
  totalIdeas: 12,
  genres: ['Indie Pop', 'Electronic', 'Folk', 'R&B', 'Rock'],
  moods: ['Melancholic', 'Uplifting', 'Dreamy', 'Energetic', 'Nostalgic'],
  ideas: [
    {
      id: 's1',
      title: 'Neon Prayers',
      hook: 'We light up the dark with our neon prayers',
      lyricsSnippet: 'City lights blur past the window\nEvery face a story untold\nWe\'re all just searching for something\nTo make us feel less alone',
      genre: 'Indie Pop',
      mood: 'Melancholic',
      tempo: 'medium',
      status: 'developing',
      rating: 4,
      createdAt: new Date('2024-01-18'),
      notes: 'Inspired by late night train rides. Think synth-heavy production.',
    },
    {
      id: 's2',
      title: 'Coffee at 3AM',
      hook: 'Another cup, another dream deferred',
      lyricsSnippet: 'The cafe\'s closing but I\'m just getting started\nScribbling verses on napkins, halfhearted\nBut somewhere between the steam and the silence\nI found the words I\'d been searching for',
      genre: 'Folk',
      mood: 'Nostalgic',
      tempo: 'slow',
      status: 'ready',
      rating: 5,
      createdAt: new Date('2024-01-15'),
      notes: 'Acoustic guitar driven. Simple arrangement.',
    },
    {
      id: 's3',
      title: 'Algorithm Heart',
      hook: 'My algorithm heart keeps recommending you',
      lyricsSnippet: 'Swipe right on destiny\nBuffer loading on chemistry\nWe\'re just data points colliding\nIn someone else\'s feed',
      genre: 'Electronic',
      mood: 'Uplifting',
      tempo: 'fast',
      status: 'spark',
      rating: 3,
      createdAt: new Date('2024-01-20'),
      notes: 'Modern dating commentary. Upbeat despite cynical lyrics.',
    },
    {
      id: 's4',
      title: 'Rooftop Gardens',
      hook: 'We built rooftop gardens in concrete minds',
      genre: 'Indie Pop',
      mood: 'Dreamy',
      tempo: 'medium',
      status: 'spark',
      rating: 4,
      createdAt: new Date('2024-01-19'),
    },
    {
      id: 's5',
      title: 'Static on the Line',
      hook: 'There\'s static on the line but I hear you clearly now',
      lyricsSnippet: 'Miles apart, screens between us\nBut your voice cuts through the noise',
      genre: 'R&B',
      mood: 'Melancholic',
      tempo: 'slow',
      status: 'developing',
      rating: 4,
      createdAt: new Date('2024-01-17'),
      notes: 'Long distance relationship theme. Slow burn R&B.',
    },
    {
      id: 's6',
      title: 'Earthquake Friends',
      hook: 'We\'re earthquake friends, only meet when the ground shakes',
      genre: 'Rock',
      mood: 'Energetic',
      tempo: 'fast',
      status: 'spark',
      rating: 3,
      createdAt: new Date('2024-01-21'),
    },
  ],
  promptTemplates: [
    { id: 'p1', name: 'Metaphor Generator', template: 'Generate a song hook using [emotion] as a metaphor for [everyday object]' },
    { id: 'p2', name: 'Story Starter', template: 'Write an opening verse about [character] in [location] at [time of day]' },
    { id: 'p3', name: 'Chorus Builder', template: 'Create a catchy chorus about [theme] with a [mood] feeling' },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-21'),
  chatCount: 15,
  documentCount: 4,
  ideaCount: 12,
};

export function SongIdeasTopicDetail({ topic }: { topic: SongIdeasTopic }) {
  const [activeTab, setActiveTab] = useState('ideas');
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning'> = {
    spark: 'warning',
    developing: 'primary',
    ready: 'success',
    recorded: 'default',
  };

  const filteredIdeas = topic.ideas.filter(idea => {
    if (activeGenre && idea.genre !== activeGenre) return false;
    if (activeMood && idea.mood !== activeMood) return false;

    return true;
  });

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this song</Button>
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
            <span className={styles.statValue}>{topic.ideas.length}</span>
            <span className={styles.statLabel}>ideas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.ideas.filter(i => i.status === 'ready').length}</span>
            <span className={styles.statLabel}>ready</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{topic.genres.length}</span>
            <span className={styles.statLabel}>genres</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<AddIcon />}>New Idea</Button>
          <Button variant="ghost" size="sm" icon={<ChatIcon />}>Generate with AI</Button>
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'ideas', label: 'Ideas', content: null },
          { value: 'prompts', label: 'Prompts', content: null },
          { value: 'recorded', label: 'Recorded', content: null },
        ]}
        className={styles.tabs}
      />

      <div className={styles.tabContent}>
        {activeTab === 'ideas' && (
          <>
            {/* Filters */}
            <div className={styles.categoryFilter}>
              <Text size="sm" color="soft">Genre:</Text>
              <Button
                variant={activeGenre === null ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveGenre(null)}
              >
                All
              </Button>
              {topic.genres.map(genre => (
                <Button
                  key={genre}
                  variant={activeGenre === genre ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>

            <div className={styles.categoryFilter}>
              <Text size="sm" color="soft">Mood:</Text>
              <Button
                variant={activeMood === null ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveMood(null)}
              >
                All
              </Button>
              {topic.moods.map(mood => (
                <Button
                  key={mood}
                  variant={activeMood === mood ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveMood(mood)}
                >
                  {mood}
                </Button>
              ))}
            </div>

            {/* Ideas Board */}
            <div className={styles.songIdeasBoard}>
              {filteredIdeas.map(idea => (
                <div key={idea.id} className={styles.songIdeaCard}>
                  <div className={styles.songIdeaHeader}>
                    <Heading level={3} size={5}>{idea.title}</Heading>
                    <div className={styles.songIdeaRating}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={i < idea.rating ? styles.starFilled : styles.starEmpty}
                        />
                      ))}
                    </div>
                  </div>

                  {idea.hook && (
                    <Text className={styles.songHook}>"{idea.hook}"</Text>
                  )}

                  {idea.lyricsSnippet && (
                    <div className={styles.lyricsSnippet}>
                      <Text size="sm" color="soft">{idea.lyricsSnippet}</Text>
                    </div>
                  )}

                  <div className={styles.songIdeaMeta}>
                    <Chip size="sm" variant="default">{idea.genre}</Chip>
                    <Chip size="sm" variant="default">{idea.mood}</Chip>
                    {idea.tempo && <Chip size="sm" variant="default">{idea.tempo}</Chip>}
                    <Chip size="sm" variant={statusColors[idea.status]}>{idea.status}</Chip>
                  </div>

                  {idea.notes && (
                    <Text size="sm" color="soft" className={styles.songIdeaNotes}>
                      {idea.notes}
                    </Text>
                  )}

                  <div className={styles.songIdeaActions}>
                    <Button variant="ghost" size="sm" icon={<EditIcon />}>Edit</Button>
                    <Button variant="ghost" size="sm" icon={<ChatIcon />}>Develop</Button>
                  </div>
                </div>
              ))}

              {/* Add New Idea Card */}
              <button className={styles.addSongIdeaCard}>
                <AddIcon className={styles.addSongIdeaIcon} />
                <Text weight="medium">New Song Idea</Text>
                <Text size="sm" color="soft">Capture your spark</Text>
              </button>
            </div>
          </>
        )}

        {activeTab === 'prompts' && (
          <div className={styles.promptsSection}>
            <div className={styles.promptsGrid}>
              {topic.promptTemplates.map(prompt => (
                <div key={prompt.id} className={styles.promptCard}>
                  <Heading level={4} size={5}>{prompt.name}</Heading>
                  <Text size="sm" color="soft" className={styles.promptTemplate}>
                    {prompt.template}
                  </Text>
                  <Button variant="primary" size="sm" icon={<PlayIcon />}>
                    Use Prompt
                  </Button>
                </div>
              ))}

              <button className={styles.addPromptCard}>
                <AddIcon />
                <Text size="sm">Create Custom Prompt</Text>
              </button>
            </div>

            <Divider />

            <div className={styles.aiGeneratorSection}>
              <Heading level={3} size={4}>AI Song Idea Generator</Heading>
              <Text color="soft">
                Describe a feeling, memory, or concept and let AI help spark your next song idea.
              </Text>
              <div className={styles.generatorInputRow}>
                <Button variant="primary" icon={<ChatIcon />}>Open Generator</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recorded' && (
          <div className={styles.recordedSection}>
            <div className={styles.emptyState}>
              <PlayIcon className={styles.emptyStateIcon} />
              <Heading level={3} size={4}>No Recorded Songs Yet</Heading>
              <Text color="soft">
                When you record demos or final versions of your song ideas, they'll appear here.
              </Text>
              <Button variant="primary" icon={<AddIcon />}>Upload Recording</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
