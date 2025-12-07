// Mock activity data

import type { ActivityItem } from '@domain/activity/ActivityFeed';

export const mockActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'found',
    title: 'SQL Injection detected',
    detail: 'CustomerAgent found vulnerability in search_customer',
    timestamp: '2 min ago',
  },
  {
    id: '2',
    type: 'fixed',
    title: 'Rate Limiting added',
    detail: 'APIAgent auto-fixed missing rate limiting',
    timestamp: '15 min ago',
  },
  {
    id: '3',
    type: 'session',
    title: 'DataAgent session completed',
    detail: '156 requests analyzed, 1 finding',
    timestamp: '45 min ago',
  },
  {
    id: '4',
    type: 'scan',
    title: 'FileAgent scan started',
    detail: 'Scanning /app/uploads directory',
    timestamp: '1 hour ago',
  },
  {
    id: '5',
    type: 'found',
    title: 'Hardcoded API Key',
    detail: 'DataAgent found exposed credentials in config.py',
    timestamp: '2 hours ago',
  },
];
