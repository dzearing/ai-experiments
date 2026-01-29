/**
 * Product Topic - Product research, comparison, and purchase tracking
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { ChevronRightIcon } from '@ui-kit/icons/ChevronRightIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { FileIcon } from '@ui-kit/icons/FileIcon';
import { PackageIcon } from '@ui-kit/icons/PackageIcon';
import { RefreshIcon } from '@ui-kit/icons/RefreshIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import { StarIcon } from '@ui-kit/icons/StarIcon';
import { type BaseTopic, styles } from '../shared';

// ============================================
// TYPES
// ============================================

interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: Date;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
}

interface ProductArticle {
  id: string;
  title: string;
  source: string;
  date: Date;
  summary: string;
  url: string;
  type: 'review' | 'comparison' | 'guide' | 'news';
}

export interface ProductTopic extends BaseTopic {
  type: 'product';
  heroImage?: string;
  photos?: string[];
  price?: { amount: number; currency: string };
  rating?: number;
  reviewCount?: number;
  amazonUrl?: string;
  specs: { label: string; value: string }[];
  documents: { name: string; type: string; url: string }[];
  relatedProducts?: { id: string; name: string; image?: string; price?: number }[];
  purchaseUrl?: string;
  status: 'wishlist' | 'owned' | 'researching' | 'considering';
  reviews?: ProductReview[];
  articles?: ProductArticle[];
}

// ============================================
// SAMPLE DATA
// ============================================

export const sampleProduct: ProductTopic = {
  id: 'product-1',
  type: 'product',
  name: 'Sony WH-1000XM5',
  description: 'Industry-leading noise canceling wireless headphones with exceptional sound quality and comfort for all-day wear.',
  tags: ['audio', 'headphones', 'noise-canceling', 'sony'],
  heroImage: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
  photos: [
    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
    'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&q=80',
  ],
  price: { amount: 399.99, currency: 'USD' },
  rating: 4.8,
  reviewCount: 2847,
  amazonUrl: 'https://amazon.com/dp/B09XS7JWHH',
  specs: [
    { label: 'Driver Size', value: '30mm' },
    { label: 'Battery Life', value: '30 hours' },
    { label: 'Noise Canceling', value: 'Yes (Adaptive)' },
    { label: 'Bluetooth', value: '5.2' },
    { label: 'Weight', value: '250g' },
    { label: 'Connectivity', value: 'Multipoint (2 devices)' },
  ],
  documents: [
    { name: 'User Manual', type: 'PDF', url: '#' },
    { name: 'Quick Start Guide', type: 'PDF', url: '#' },
    { name: 'Comparison Notes', type: 'Markdown', url: '#' },
  ],
  relatedProducts: [
    { id: 'p2', name: 'Sony WF-1000XM5', image: 'https://images.unsplash.com/photo-1590658165737-15a047b7c0b0?w=200&q=80', price: 299.99 },
    { id: 'p3', name: 'Apple AirPods Max', image: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=200&q=80', price: 549.00 },
    { id: 'p4', name: 'Bose QuietComfort Ultra', image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80', price: 429.00 },
    { id: 'p5', name: 'Sennheiser Momentum 4', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=200&q=80', price: 379.95 },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'AudioEnthusiast',
      rating: 5,
      date: new Date('2024-01-10'),
      title: 'Best noise canceling I\'ve ever experienced',
      content: 'Coming from the XM4s, the improvement in noise canceling is immediately noticeable. The new design is lighter and more comfortable for long listening sessions. Sound quality is excellent with rich bass and clear highs.',
      helpful: 234,
      verified: true,
    },
    {
      id: 'r2',
      author: 'TechReviewer42',
      rating: 4,
      date: new Date('2024-01-08'),
      title: 'Great headphones, minor gripes',
      content: 'Fantastic sound and ANC. My only complaints: the touch controls can be overly sensitive, and I wish there was an IP rating for water resistance. Still the best in class overall.',
      helpful: 156,
      verified: true,
    },
    {
      id: 'r3',
      author: 'MusicProducer',
      rating: 5,
      date: new Date('2024-01-05'),
      title: 'Perfect for travel and work',
      content: 'I use these daily for mixing and on flights. The multipoint connection is seamless between my laptop and phone. Battery life easily lasts a full week of heavy use.',
      helpful: 89,
      verified: true,
    },
  ],
  articles: [
    {
      id: 'a1',
      title: 'Sony WH-1000XM5 Review: The New King of ANC Headphones',
      source: 'The Verge',
      date: new Date('2024-01-12'),
      summary: 'Sony\'s latest flagship headphones deliver exceptional noise canceling with a refined, lighter design. Sound quality remains top-tier with improved call quality over the previous generation.',
      url: '#',
      type: 'review',
    },
    {
      id: 'a2',
      title: 'XM5 vs AirPods Max vs Bose QC Ultra: Ultimate Comparison',
      source: 'RTINGS',
      date: new Date('2024-01-08'),
      summary: 'We tested all three premium ANC headphones head-to-head. The XM5 wins on comfort and battery life, while AirPods Max edges ahead on build quality. Bose offers the best noise canceling for voices.',
      url: '#',
      type: 'comparison',
    },
    {
      id: 'a3',
      title: 'How to Get the Best Sound from Your Sony XM5',
      source: 'Head-Fi',
      date: new Date('2024-01-03'),
      summary: 'A comprehensive guide to optimizing your XM5 experience including EQ settings, LDAC setup for high-res audio, and tips for maximizing noise canceling performance.',
      url: '#',
      type: 'guide',
    },
  ],
  purchaseUrl: 'https://www.sony.com',
  status: 'researching',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-20'),
  chatCount: 5,
  documentCount: 3,
  ideaCount: 2,
};

export const sampleDrone: ProductTopic = {
  id: 'product-2',
  type: 'product',
  name: 'DJI Mini 5 Pro',
  description: 'Ultra-lightweight sub-249g drone with 4K/60fps video, 48MP photos, omnidirectional obstacle sensing, and 34-minute flight time. Perfect for travel and creative aerial photography.',
  tags: ['drone', 'camera', 'aerial-photography', 'dji', 'travel'],
  heroImage: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',
  photos: [
    'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80',
    'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&q=80',
    'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=400&q=80',
    'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&q=80',
    'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=400&q=80',
    'https://images.unsplash.com/photo-1524143986875-3b098d911e55?w=400&q=80',
  ],
  price: { amount: 959.00, currency: 'USD' },
  rating: 4.7,
  reviewCount: 1832,
  amazonUrl: 'https://amazon.com/dp/B0CGXKNTX4',
  specs: [
    { label: 'Weight', value: '< 249g' },
    { label: 'Max Flight Time', value: '34 minutes' },
    { label: 'Max Transmission', value: '20 km (O4)' },
    { label: 'Camera Sensor', value: '1/1.3" CMOS' },
    { label: 'Video Resolution', value: '4K/60fps HDR' },
    { label: 'Photo Resolution', value: '48 MP' },
    { label: 'Obstacle Sensing', value: 'Omnidirectional' },
    { label: 'Internal Storage', value: '32 GB' },
  ],
  documents: [
    { name: 'User Manual', type: 'PDF', url: '#' },
    { name: 'Quick Start Guide', type: 'PDF', url: '#' },
    { name: 'FAA Registration Guide', type: 'PDF', url: '#' },
    { name: 'Local Flight Regulations', type: 'Markdown', url: '#' },
    { name: 'Firmware Release Notes', type: 'PDF', url: '#' },
  ],
  relatedProducts: [
    { id: 'd2', name: 'DJI Mini 4 Pro', image: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=200&q=80', price: 759.00 },
    { id: 'd3', name: 'DJI Air 3', image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&q=80', price: 1099.00 },
    { id: 'd4', name: 'DJI Mavic 3 Classic', image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=200&q=80', price: 1469.00 },
    { id: 'd5', name: 'Autel Evo Nano+', image: 'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=200&q=80', price: 849.00 },
  ],
  reviews: [
    {
      id: 'dr1',
      author: 'AerialPhotoPro',
      rating: 5,
      date: new Date('2024-01-18'),
      title: 'Best sub-250g drone ever made',
      content: 'The Mini 5 Pro is a game-changer for travel photography. Under 249g means no FAA registration needed in most cases, yet the image quality rivals much larger drones. The omnidirectional obstacle avoidance gives me peace of mind flying in tight spaces.',
      helpful: 312,
      verified: true,
    },
    {
      id: 'dr2',
      author: 'DroneEnthusiast',
      rating: 5,
      date: new Date('2024-01-15'),
      title: 'Perfect travel companion',
      content: 'I\'ve taken this on three trips already. The compact size means it fits in any bag, and the new O4 transmission is incredibly reliable. 4K60 footage looks professional.',
      helpful: 189,
      verified: true,
    },
    {
      id: 'dr3',
      author: 'ContentCreator',
      rating: 4,
      date: new Date('2024-01-12'),
      title: 'Almost perfect',
      content: 'Amazing image quality and features for the size. Only wish is longer battery life and better wind resistance. The 34 minutes is closer to 28 in real-world use.',
      helpful: 134,
      verified: true,
    },
  ],
  articles: [
    {
      id: 'da1',
      title: 'DJI Mini 5 Pro Review: The Best Travel Drone Gets Better',
      source: 'DPReview',
      date: new Date('2024-01-20'),
      summary: 'DJI\'s latest sub-249g drone packs professional-grade features into an incredibly portable package. The new sensor and O4 transmission make this a serious tool for content creators.',
      url: '#',
      type: 'review',
    },
    {
      id: 'da2',
      title: 'Mini 5 Pro vs Air 3: Which DJI Drone Should You Buy?',
      source: 'Tom\'s Guide',
      date: new Date('2024-01-16'),
      summary: 'We compare DJI\'s two most popular consumer drones to help you decide which is right for your needs and budget.',
      url: '#',
      type: 'comparison',
    },
  ],
  purchaseUrl: 'https://store.dji.com',
  status: 'wishlist',
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-20'),
  chatCount: 8,
  documentCount: 5,
  ideaCount: 3,
};

// ============================================
// COMPONENT
// ============================================

export function ProductTopicDetail({ topic }: { topic: ProductTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        {topic.heroImage ? (
          <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
            <div className={styles.heroActions}>
              <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this product</Button>
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
              {topic.price && (
                <div className={styles.heroPrice}>
                  ${topic.price.amount.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.heroPlaceholder}>
            <PackageIcon className={styles.heroPlaceholderIcon} />
            <Heading level={1} size={2}>{topic.name}</Heading>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className={styles.commandBar}>
        <div className={styles.commandBarStats}>
          {topic.rating && (
            <div className={styles.statItem}>
              <StarIcon className={styles.statIcon} />
              <span className={styles.statValue}>{topic.rating}</span>
              <span className={styles.statLabel}>({topic.reviewCount} reviews)</span>
            </div>
          )}
          <div className={styles.statItem}>
            <ChatIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.chatCount}</span>
            <span className={styles.statLabel}>chats</span>
          </div>
          <div className={styles.statItem}>
            <FileIcon className={styles.statIcon} />
            <span className={styles.statValue}>{topic.documentCount}</span>
            <span className={styles.statLabel}>docs</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'specs', label: 'Specifications', content: null },
          { value: 'docs', label: 'Documents', content: null },
          { value: 'related', label: 'Related', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.productOverview}>
            {/* Two Column Layout from the start */}
            <div className={styles.productOverviewColumns}>
              {/* Left Column - Description, Photos, Reviews, Research */}
              <div className={styles.productOverviewLeft}>
                {/* Description */}
                <div className={styles.descriptionSection}>
                  <Text className={styles.description}>{topic.description}</Text>
                </div>

                {topic.photos && topic.photos.length > 0 && (
                  <div className={styles.photoGrid}>
                    {topic.photos.map((photo, i) => (
                      <div
                        key={i}
                        className={styles.photoGridItem}
                        style={{ backgroundImage: `url(${photo})` }}
                      />
                    ))}
                  </div>
                )}

                {/* Latest Reviews Section */}
                {topic.reviews && topic.reviews.length > 0 && (
                  <div className={styles.reviewsSection}>
                    <div className={styles.sectionHeader}>
                      <Heading level={3} size={4}>Latest Reviews</Heading>
                      <Button variant="ghost" size="sm">See all {topic.reviewCount}</Button>
                    </div>
                    <div className={styles.reviewsList}>
                      {topic.reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div className={styles.reviewRating}>
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={i < review.rating ? styles.starFilled : styles.starEmpty}
                                />
                              ))}
                            </div>
                            <Text weight="medium" size="sm">{review.title}</Text>
                          </div>
                          <Text size="sm" color="soft" className={styles.reviewContent}>
                            {review.content}
                          </Text>
                          <div className={styles.reviewFooter}>
                            <Text size="xs" color="soft">
                              {review.author} {review.verified && <span className={styles.verifiedBadge}>Verified</span>}
                            </Text>
                            <Text size="xs" color="soft">{review.helpful} found helpful</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research Section (Articles) */}
                {topic.articles && topic.articles.length > 0 && (
                  <div className={styles.reviewsSection}>
                    <div className={styles.sectionHeader}>
                      <Heading level={3} size={4}>Research</Heading>
                      <Button variant="ghost" size="sm">See all</Button>
                    </div>
                    <div className={styles.articlesList}>
                      {topic.articles.map((article) => (
                        <a key={article.id} href={article.url} className={styles.articleCard}>
                          <div className={styles.articleHeader}>
                            <Chip size="sm" variant={
                              article.type === 'review' ? 'primary' :
                              article.type === 'comparison' ? 'warning' :
                              article.type === 'guide' ? 'success' : 'default'
                            }>
                              {article.type}
                            </Chip>
                            <Text size="xs" color="soft">{article.source}</Text>
                          </div>
                          <Text weight="medium" size="sm">{article.title}</Text>
                          <Text size="sm" color="soft" className={styles.articleSummary}>
                            {article.summary}
                          </Text>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Price Comparison, Compare With, Specs */}
              <div className={styles.productOverviewRight}>
                {/* Price Comparison Card */}
                <div className={styles.priceComparisonCard}>
                  <div className={styles.priceCardHeader}>
                    <Heading level={3} size={5}>Where to Buy</Heading>
                    <IconButton variant="ghost" size="sm" icon={<RefreshIcon />} aria-label="Refresh prices" />
                  </div>

                  {/* This product's prices */}
                  <div className={styles.priceOptionsList}>
                    <a href={topic.amazonUrl || '#'} className={styles.priceOption}>
                      <div className={styles.priceOptionInfo}>
                        <Text weight="medium" size="sm">Amazon</Text>
                        <Chip size="sm" variant="success">Best Price</Chip>
                      </div>
                      <div className={styles.priceOptionPrice}>
                        <Text size="lg" weight="bold">${topic.price?.amount.toFixed(2)}</Text>
                        <Text size="xs" color="soft">Free shipping</Text>
                      </div>
                    </a>
                    <a href={topic.purchaseUrl || '#'} className={styles.priceOption}>
                      <div className={styles.priceOptionInfo}>
                        <Text weight="medium" size="sm">Official Store</Text>
                      </div>
                      <div className={styles.priceOptionPrice}>
                        <Text size="lg" weight="bold">${topic.price?.amount.toFixed(2)}</Text>
                        <Text size="xs" color="soft">Direct from manufacturer</Text>
                      </div>
                    </a>
                    <a href="#" className={styles.priceOption}>
                      <div className={styles.priceOptionInfo}>
                        <Text weight="medium" size="sm">Best Buy</Text>
                      </div>
                      <div className={styles.priceOptionPrice}>
                        <Text size="lg" weight="bold">${topic.price?.amount.toFixed(2)}</Text>
                        <Text size="xs" color="soft">In-store pickup</Text>
                      </div>
                    </a>
                  </div>

                  <div className={styles.priceCardFooter}>
                    <Text size="xs" color="soft">Prices last checked: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
                  </div>
                </div>

                {/* Compare With */}
                {topic.relatedProducts && topic.relatedProducts.length > 0 && (
                  <div className={styles.relatedPreview}>
                    <div className={styles.priceCardHeader}>
                      <Heading level={3} size={5}>Compare With</Heading>
                      <IconButton variant="ghost" size="sm" icon={<AddIcon />} aria-label="Add product to compare" />
                    </div>
                    <div className={styles.relatedPreviewList}>
                      {topic.relatedProducts.slice(0, 4).map((related) => (
                        <div key={related.id} className={styles.relatedPreviewItem}>
                          {related.image && (
                            <div className={styles.relatedPreviewImage} style={{ backgroundImage: `url(${related.image})` }} />
                          )}
                          <Stack direction="vertical" gap="none" className={styles.relatedPreviewInfo}>
                            <Text size="sm" weight="medium">{related.name}</Text>
                            {related.price && <Text size="sm" color="soft">${related.price}</Text>}
                          </Stack>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Specs Card */}
                <div className={styles.quickSpecsCard}>
                  <Heading level={3} size={5}>Key Specs</Heading>
                  <div className={styles.quickSpecsList}>
                    {topic.specs.slice(0, 4).map((spec, i) => (
                      <div key={i} className={styles.quickSpecItem}>
                        <Text size="sm" color="soft">{spec.label}</Text>
                        <Text size="sm" weight="medium">{spec.value}</Text>
                      </div>
                    ))}
                  </div>
                  <div className={styles.showMoreFooter}>
                    <Text size="sm" color="soft">Show more...</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className={styles.specsGrid}>
            {topic.specs.map((spec, i) => (
              <div key={i} className={styles.specItem}>
                <span className={styles.specLabel}>{spec.label}</span>
                <span className={styles.specValue}>{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className={styles.docsList}>
            {topic.documents.map((doc, i) => (
              <div key={i} className={styles.docItem}>
                <FileIcon className={styles.docIcon} />
                <Stack direction="vertical" gap="none" className={styles.docInfo}>
                  <Text weight="medium">{doc.name}</Text>
                  <Text size="sm" color="soft">{doc.type}</Text>
                </Stack>
                <IconButton variant="ghost" icon={<ChevronRightIcon />} aria-label="Open document" />
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addDocButton}>
              Add document
            </Button>
          </div>
        )}

        {activeTab === 'related' && topic.relatedProducts && (
          <div className={styles.relatedGrid}>
            {topic.relatedProducts.map((related) => (
              <div key={related.id} className={styles.relatedCard}>
                {related.image ? (
                  <div className={styles.relatedImage} style={{ backgroundImage: `url(${related.image})` }} />
                ) : (
                  <div className={styles.relatedImagePlaceholder}>
                    <PackageIcon />
                  </div>
                )}
                <Text weight="medium" size="sm">{related.name}</Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
