import { ObjectId } from 'mongodb'

export interface Website {
  _id?: any;
  url: string;
  status: WebsiteStatus;
  statusDetails?: WebsiteStatusDetails;
  createdAt: Date;
  updatedAt: Date;
  lastScraped?: Date;
  createdBy: string;
  embeddings?: {
    count: number;
    lastUpdated: Date;
  };
}

export type WebsiteStatus = 
  | 'unknown'
  | 'pending'
  | 'scraping'
  | 'processing'
  | 'embedding'
  | 'active'
  | 'error';

export interface WebsiteStatusDetails {
  currentAttempt?: number;
  maxAttempts?: number;
  statusCode?: number;
  lastError?: string;
  progress?: {
    phase: 'scraping' | 'processing' | 'embedding';
    current: number;
    total: number;
  };
  lastUpdate: Date;
}