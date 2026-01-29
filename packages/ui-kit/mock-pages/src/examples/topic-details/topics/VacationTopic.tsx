/**
 * Vacation/Destination Topic - Travel planning and itinerary management
 */
import { useState } from 'react';
import {
  Button,
  Chip,
  Heading,
  IconButton,
  Progress,
  Stack,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ArrowRightIcon } from '@ui-kit/icons/ArrowRightIcon';
import { CalendarIcon } from '@ui-kit/icons/CalendarIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { GlobeIcon } from '@ui-kit/icons/GlobeIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface VacationTopic extends BaseTopic {
  type: 'vacation';
  heroImage?: string;
  destination: string;
  country: string;
  dates?: { start: Date; end: Date };
  status: 'planning' | 'booked' | 'completed' | 'dreaming';
  weather?: { temp: number; condition: string };
  budget?: { spent: number; total: number; currency: string };
  itinerary: { day: number; title: string; activities: string[] }[];
  accommodations?: { name: string; checkIn: Date; checkOut: Date; confirmed: boolean }[];
  flights?: { from: string; to: string; date: Date; confirmed: boolean }[];
  packingList?: { item: string; packed: boolean }[];
}

export const sampleVacation: VacationTopic = {
  id: 'vacation-1',
  type: 'vacation',
  name: 'Japan Spring 2024',
  description: 'Two week trip exploring Tokyo, Kyoto, and Osaka during cherry blossom season.',
  destination: 'Tokyo, Kyoto, Osaka',
  country: 'Japan',
  tags: ['japan', 'cherry-blossoms', 'spring-2024', 'asia'],
  heroImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  dates: { start: new Date('2024-03-28'), end: new Date('2024-04-11') },
  status: 'planning',
  weather: { temp: 18, condition: 'Partly Cloudy' },
  budget: { spent: 2400, total: 8000, currency: 'USD' },
  itinerary: [
    { day: 1, title: 'Arrival in Tokyo', activities: ['Arrive at Narita', 'Check into hotel', 'Explore Shibuya'] },
    { day: 2, title: 'Tokyo Highlights', activities: ['Senso-ji Temple', 'Tokyo Skytree', 'Akihabara'] },
    { day: 3, title: 'Day Trip to Nikko', activities: ['Toshogu Shrine', 'Kegon Falls', 'Return to Tokyo'] },
    { day: 4, title: 'Shinkansen to Kyoto', activities: ['Bullet train', 'Check into ryokan', 'Gion district'] },
  ],
  accommodations: [
    { name: 'Park Hyatt Tokyo', checkIn: new Date('2024-03-28'), checkOut: new Date('2024-04-01'), confirmed: true },
    { name: 'Kyoto Ryokan Kinoe', checkIn: new Date('2024-04-01'), checkOut: new Date('2024-04-05'), confirmed: false },
  ],
  flights: [
    { from: 'SFO', to: 'NRT', date: new Date('2024-03-28'), confirmed: true },
    { from: 'KIX', to: 'SFO', date: new Date('2024-04-11'), confirmed: false },
  ],
  packingList: [
    { item: 'Passport', packed: true },
    { item: 'JR Pass', packed: true },
    { item: 'Camera', packed: false },
    { item: 'Portable WiFi', packed: false },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-18'),
  chatCount: 12,
  documentCount: 8,
  ideaCount: 15,
};

export function VacationTopicDetail({ topic }: { topic: VacationTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  const budgetProgress = topic.budget
    ? Math.round((topic.budget.spent / topic.budget.total) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this trip</Button>
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
            {topic.dates && (
              <span className={styles.dateRange}>
                <CalendarIcon />
                {topic.dates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {topic.dates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className={styles.vacationStats}>
        {topic.weather && (
          <div className={styles.weatherWidget}>
            <span className={styles.weatherTemp}>{topic.weather.temp}°C</span>
            <span className={styles.weatherCondition}>{topic.weather.condition}</span>
          </div>
        )}
        {topic.budget && (
          <div className={styles.budgetWidget}>
            <div className={styles.budgetHeader}>
              <span className={styles.budgetSpent}>${topic.budget.spent}</span>
              <span className={styles.budgetTotal}>of ${topic.budget.total}</span>
            </div>
            <Progress value={budgetProgress} size="sm" variant={budgetProgress > 80 ? 'error' : 'default'} />
          </div>
        )}
        <div className={styles.countdownWidget}>
          <span className={styles.countdownDays}>68</span>
          <span className={styles.countdownLabel}>days to go</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'itinerary', label: 'Itinerary', content: null },
          { value: 'bookings', label: 'Bookings', content: null },
          { value: 'packing', label: 'Packing', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.vacationOverview}>
            {/* Left column - Overview markdown */}
            <div className={styles.vacationOverviewLeft}>
              <div className={styles.descriptionSection}>
                <Heading level={3} size={4}>About this trip</Heading>
                <Text className={styles.description}>{topic.description}</Text>
                <Text className={styles.description}>
                  Experience the magic of Japan during cherry blossom season. This carefully curated trip takes you through the cultural heart of the country, from the bustling streets of Tokyo to the serene temples of Kyoto.
                </Text>
                <Heading level={4} size={5}>Highlights</Heading>
                <ul className={styles.tipsList}>
                  <li>Witness the stunning cherry blossoms at peak bloom</li>
                  <li>Visit ancient temples and shrines in Kyoto</li>
                  <li>Experience the bullet train (Shinkansen)</li>
                  <li>Stay in a traditional ryokan inn</li>
                  <li>Explore the vibrant neighborhoods of Tokyo</li>
                </ul>
              </div>
            </div>

            {/* Right column - Map and plan */}
            <div className={styles.vacationOverviewRight}>
              <div className={styles.mapPlaceholder}>
                <GlobeIcon className={styles.mapIcon} />
                <Text color="soft">Map: {topic.destination}</Text>
              </div>

              <div className={styles.actionsCard}>
                <Heading level={3} size={5}>Plan this trip</Heading>
                <div className={styles.actionButtons}>
                  <Button variant="primary" icon={<ChatIcon />}>Chat about this trip</Button>
                  <Button variant="default" icon={<CalendarIcon />}>Add to calendar</Button>
                  <Button variant="ghost" icon={<ShareIcon />}>Share itinerary</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className={styles.itineraryTimeline}>
            {topic.itinerary.map((day) => (
              <div key={day.day} className={styles.itineraryDay}>
                <div className={styles.dayMarker}>
                  <span className={styles.dayNumber}>Day {day.day}</span>
                  <div className={styles.dayLine} />
                </div>
                <div className={styles.dayContent}>
                  <Heading level={4} size={5}>{day.title}</Heading>
                  <ul className={styles.activityList}>
                    {day.activities.map((activity, i) => (
                      <li key={i}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addDayButton}>
              Add day
            </Button>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className={styles.bookingsSection}>
            <div className={styles.bookingCategory}>
              <Heading level={4} size={5}>Flights</Heading>
              {topic.flights?.map((flight, i) => (
                <div key={i} className={styles.bookingItem}>
                  <div className={styles.bookingRoute}>
                    <span>{flight.from}</span>
                    <ArrowRightIcon />
                    <span>{flight.to}</span>
                  </div>
                  <Text size="sm" color="soft">{flight.date.toLocaleDateString()}</Text>
                  <Chip size="sm" variant={flight.confirmed ? 'success' : 'warning'}>
                    {flight.confirmed ? 'Confirmed' : 'Pending'}
                  </Chip>
                </div>
              ))}
            </div>

            <div className={styles.bookingCategory}>
              <Heading level={4} size={5}>Accommodations</Heading>
              {topic.accommodations?.map((hotel, i) => (
                <div key={i} className={styles.bookingItem}>
                  <Stack direction="vertical" gap="none" className={styles.bookingInfo}>
                    <Text weight="medium">{hotel.name}</Text>
                    <Text size="sm" color="soft">
                      {hotel.checkIn.toLocaleDateString()} - {hotel.checkOut.toLocaleDateString()}
                    </Text>
                  </Stack>
                  <Chip size="sm" variant={hotel.confirmed ? 'success' : 'warning'}>
                    {hotel.confirmed ? 'Confirmed' : 'Pending'}
                  </Chip>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'packing' && (
          <div className={styles.packingList}>
            {topic.packingList?.map((item, i) => (
              <label key={i} className={styles.packingItem}>
                <input type="checkbox" checked={item.packed} readOnly />
                <span className={item.packed ? styles.packedItem : ''}>{item.item}</span>
              </label>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addItemButton}>
              Add item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
