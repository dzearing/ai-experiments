/**
 * Shared types for Topic Details pages
 */

export interface BaseTopic {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  chatCount: number;
  documentCount: number;
  ideaCount: number;
}

export interface TopicDocument {
  name: string;
  type: string;
  url: string;
}

export interface TopicStat {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}
