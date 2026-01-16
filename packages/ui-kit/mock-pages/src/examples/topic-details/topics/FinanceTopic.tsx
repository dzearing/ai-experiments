/**
 * Finance Topic - Budget and savings goal tracking
 */
import { useState } from 'react';
import {
  Button,
  Heading,
  IconButton,
  Tabs,
  Text,
} from '@ui-kit/react';
import { AddIcon } from '@ui-kit/icons/AddIcon';
import { ChatIcon } from '@ui-kit/icons/ChatIcon';
import { EditIcon } from '@ui-kit/icons/EditIcon';
import { ShareIcon } from '@ui-kit/icons/ShareIcon';
import type { BaseTopic } from '../shared/types';
import styles from '../shared/styles.module.css';

export interface FinanceTopic extends BaseTopic {
  type: 'finance';
  heroImage?: string;
  projectType: 'budget' | 'investment' | 'savings-goal' | 'expense-tracker';
  currency: string;
  currentBalance?: number;
  targetAmount?: number;
  deadline?: Date;
  categories: { name: string; amount: number; color: string }[];
  transactions: { date: Date; description: string; amount: number; category: string }[];
  projections?: { month: string; projected: number; actual?: number }[];
}

export const sampleFinance: FinanceTopic = {
  id: 'finance-1',
  type: 'finance',
  name: '2024 Home Renovation Fund',
  description: 'Savings fund for kitchen and bathroom remodel. Target completion by December 2024.',
  heroImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  projectType: 'savings-goal',
  tags: ['savings', 'home', 'renovation', '2024'],
  currency: 'USD',
  currentBalance: 12500,
  targetAmount: 35000,
  deadline: new Date('2024-12-31'),
  categories: [
    { name: 'Kitchen', amount: 20000, color: '#3B82F6' },
    { name: 'Bathroom', amount: 10000, color: '#10B981' },
    { name: 'Contingency', amount: 5000, color: '#F59E0B' },
  ],
  transactions: [
    { date: new Date('2024-01-15'), description: 'Monthly contribution', amount: 2500, category: 'Savings' },
    { date: new Date('2024-01-01'), description: 'Monthly contribution', amount: 2500, category: 'Savings' },
    { date: new Date('2023-12-15'), description: 'Bonus deposit', amount: 5000, category: 'Savings' },
    { date: new Date('2023-12-01'), description: 'Monthly contribution', amount: 2500, category: 'Savings' },
  ],
  projections: [
    { month: 'Jan', projected: 12500, actual: 12500 },
    { month: 'Feb', projected: 15000 },
    { month: 'Mar', projected: 17500 },
    { month: 'Apr', projected: 20000 },
    { month: 'May', projected: 22500 },
    { month: 'Jun', projected: 25000 },
  ],
  createdAt: new Date('2023-11-01'),
  updatedAt: new Date('2024-01-15'),
  chatCount: 8,
  documentCount: 4,
  ideaCount: 6,
};

export function FinanceTopicDetail({ topic }: { topic: FinanceTopic }) {
  const [activeTab, setActiveTab] = useState('overview');

  const progressPercent = topic.targetAmount
    ? Math.round(((topic.currentBalance || 0) / topic.targetAmount) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroImage} style={{ backgroundImage: `url(${topic.heroImage})` }}>
          <div className={styles.heroActions}>
            <Button variant="primary" icon={<ChatIcon />} className={`${styles.heroActionButton} ${styles.askButton}`}>Chat about this goal</Button>
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
            <span className={styles.statValue}>${topic.currentBalance?.toLocaleString()}</span>
            <span className={styles.statLabel}>of ${topic.targetAmount?.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{progressPercent}%</span>
            <span className={styles.statLabel}>complete</span>
          </div>
        </div>
        <div className={styles.commandBarActions}>
          <Button variant="primary" size="sm" icon={<ChatIcon />}>Ask about this</Button>
          <Button variant="ghost" size="sm" icon={<AddIcon />}>Add transaction</Button>
          <IconButton variant="ghost" size="sm" icon={<EditIcon />} aria-label="Edit topic" />
          <IconButton variant="ghost" size="sm" icon={<ShareIcon />} aria-label="Share" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        variant="underline"
        items={[
          { value: 'overview', label: 'Overview', content: null },
          { value: 'breakdown', label: 'Breakdown', content: null },
          { value: 'transactions', label: 'Transactions', content: null },
          { value: 'projections', label: 'Projections', content: null },
        ]}
        className={styles.tabs}
      />

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.financeOverview}>
            <div className={styles.actionsCard}>
              <Heading level={3} size={5}>Actions</Heading>
              <div className={styles.actionButtons}>
                <Button variant="primary" icon={<ChatIcon />}>Discuss this goal</Button>
                <Button variant="default" icon={<AddIcon />}>Add contribution</Button>
                <Button variant="ghost" icon={<EditIcon />}>Edit goal</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className={styles.categoryBreakdown}>
            {topic.categories.map((cat, i) => (
              <div key={i} className={styles.categoryItem}>
                <div className={styles.categoryColor} style={{ backgroundColor: cat.color }} />
                <div className={styles.categoryInfo}>
                  <Text weight="medium">{cat.name}</Text>
                  <Text size="sm" color="soft">${cat.amount.toLocaleString()}</Text>
                </div>
                <Text weight="medium">{Math.round((cat.amount / (topic.targetAmount || 1)) * 100)}%</Text>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className={styles.transactionList}>
            {topic.transactions.map((tx, i) => (
              <div key={i} className={styles.transactionItem}>
                <div className={styles.transactionInfo}>
                  <Text weight="medium">{tx.description}</Text>
                  <Text size="sm" color="soft">{tx.date.toLocaleDateString()}</Text>
                </div>
                <Text weight="medium" className={tx.amount > 0 ? styles.positiveAmount : styles.negativeAmount}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                </Text>
              </div>
            ))}
            <Button variant="ghost" icon={<AddIcon />} className={styles.addTransactionButton}>
              Add transaction
            </Button>
          </div>
        )}

        {activeTab === 'projections' && topic.projections && (
          <div className={styles.projectionChart}>
            <div className={styles.projectionBars}>
              {topic.projections.map((proj, i) => (
                <div key={i} className={styles.projectionBar}>
                  <div className={styles.projectionBarInner}>
                    <div
                      className={styles.projectionBarFill}
                      style={{ height: `${(proj.projected / (topic.targetAmount || 1)) * 100}%` }}
                    />
                    {proj.actual !== undefined && (
                      <div
                        className={styles.projectionBarActual}
                        style={{ height: `${(proj.actual / (topic.targetAmount || 1)) * 100}%` }}
                      />
                    )}
                  </div>
                  <Text size="sm" color="soft">{proj.month}</Text>
                </div>
              ))}
            </div>
            <div className={styles.projectionLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ backgroundColor: 'var(--primary-bg)' }} />
                <Text size="sm">Projected</Text>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ backgroundColor: 'var(--success-bg)' }} />
                <Text size="sm">Actual</Text>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
