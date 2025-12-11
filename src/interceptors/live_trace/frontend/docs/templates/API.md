# Creating API Endpoints

Step-by-step guide for creating new API endpoints.

---

## Directory Structure

```
src/api/
├── types/           # Response types
│   ├── dashboard.ts
│   └── index.ts
├── endpoints/       # Fetch functions
│   ├── dashboard.ts
│   └── index.ts
├── mocks/           # Dev data
│   └── index.ts
└── index.ts         # Barrel export
```

---

## Step 1: Define Types

Create type file in `src/api/types/`:

```typescript
// src/api/types/dashboard.ts
export interface APIAgent {
  id: string;
  id_short: string;
  total_sessions: number;
  active_sessions: number;
  risk_status: 'evaluating' | 'ok';
}

export interface DashboardResponse {
  agents: APIAgent[];
  sessions: APISession[];
  last_updated: string;
}
```

Export from `src/api/types/index.ts`:

```typescript
export type { APIAgent, DashboardResponse } from './dashboard';
```

---

## Step 2: Create Endpoint Function

Create endpoint file in `src/api/endpoints/`:

```typescript
// src/api/endpoints/dashboard.ts
import type { DashboardResponse } from '../types/dashboard';

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  const response = await fetch('/api/dashboard');
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  return response.json();
};
```

Export from `src/api/endpoints/index.ts`:

```typescript
export { fetchDashboard } from './dashboard';
```

---

## Step 3: Barrel Export

Update `src/api/index.ts`:

```typescript
// Types
export type { APIAgent, DashboardResponse } from './types';

// Endpoints
export { fetchDashboard } from './endpoints';
```

---

## Usage in Components

```typescript
import { fetchDashboard } from '@api';
import type { APIAgent } from '@api';

const [agents, setAgents] = useState<APIAgent[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetchDashboard()
    .then(data => setAgents(data.agents))
    .catch(err => setError(err instanceof Error ? err.message : 'Failed'))
    .finally(() => setLoading(false));
}, []);
```

---

## Error Handling

Always handle errors and provide user feedback:

```typescript
try {
  const data = await fetchDashboard();
  setAgents(data.agents);
} catch (err) {
  const message = err instanceof Error ? err.message : 'Failed to load data';
  setError(message);
  // Optionally show toast notification
} finally {
  setLoading(false);
}
```

---

## Best Practices

1. **Type everything** — Use TypeScript interfaces for all API responses
2. **Error handling** — Always check `response.ok` and handle errors
3. **Loading states** — Track loading state for better UX
4. **Barrel exports** — Use `@api` import path for cleaner imports

