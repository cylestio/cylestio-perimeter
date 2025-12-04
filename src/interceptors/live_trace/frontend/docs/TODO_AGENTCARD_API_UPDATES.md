# TODO: AgentCard API Integration Updates

This document tracks the changes made to align the AgentCard component with the real API data from `/api/dashboard`.

## Completed Changes

### Props Interface Changes

| Old Prop | New Prop | Status |
|----------|----------|--------|
| `name` | `name` (derived from `id`) | Done |
| `initials` | `initials` (derived from `id`) | Done |
| `repo` | `id` | Done - Replaced |
| `riskScore` (number 0-100) | `riskStatus` ('evaluating' \| 'ok') | Done |
| `autoFix` | Removed | Done |
| `staticMode` | Removed | Done |
| `dynamicMode` | Removed | Done |
| `findings` | `totalSessions` | Done |
| `fixed` | `totalErrors` | Done |
| `owaspScore` | `totalTools` | Done |
| `lastScan` | `lastSeen` | Done |
| `hasCriticalFinding` | `hasCriticalFinding` (from `analysis_summary.action_required`) | Done |
| - | `currentSessions` (new) | Done |
| - | `minSessionsRequired` (new) | Done |

### UI Changes

- [x] Replaced "Findings/Fixed/OWASP" stats with "Sessions/Errors/Tools"
- [x] Added evaluating state with progress indicator showing X/5 sessions
- [x] Changed risk display from numeric score to status badge ("OK" / "Evaluating")
- [x] Removed ModeIndicators component (autoFix, staticMode, dynamicMode not in API)
- [x] Changed footer text from "Last scan" to "Last seen"
- [x] Added "Action required" state from `analysis_summary.action_required`

### Files Modified

1. `src/api/types/dashboard.ts` - New API type definitions
2. `src/api/types/index.ts` - Export barrel
3. `src/api/endpoints/dashboard.ts` - Fetch function
4. `src/api/endpoints/index.ts` - Export barrel
5. `src/components/domain/agents/AgentCard.tsx` - Updated component
6. `src/components/domain/agents/AgentCard.styles.ts` - New styled components
7. `src/components/domain/agents/AgentCard.stories.tsx` - Updated stories
8. `src/pages/Portfolio/Portfolio.tsx` - API integration

## API Data Mapping

```typescript
// API Response Shape
interface APIAgent {
  id: string;                    // "prompt-f54b66477700"
  id_short: string;              // "prompt-f..."
  total_sessions: number;        // 12
  active_sessions: number;       // 0
  total_errors: number;          // 0
  total_tools: number;           // 55
  last_seen_relative: string;    // "1d ago"
  risk_status: 'evaluating' | 'ok';
  current_sessions: number;      // For progress
  min_sessions_required: number; // 5
  analysis_summary?: {
    action_required: boolean;    // Maps to hasCriticalFinding
  };
}

// Transformed to AgentCard props
interface AgentCardProps {
  id: string;
  name: string;                  // Derived from id
  initials: string;              // Derived from id
  totalSessions: number;
  totalErrors: number;
  totalTools: number;
  lastSeen: string;
  riskStatus: 'evaluating' | 'ok';
  currentSessions?: number;
  minSessionsRequired?: number;
  hasCriticalFinding?: boolean;
  onClick?: () => void;
}
```

## Future Improvements

- [ ] Add real-time updates using the `refresh_interval` from API
- [ ] Implement sessions list display using API session data
- [ ] Add agent detail page navigation (onClick handler)
- [ ] Consider adding more risk statuses if API expands (e.g., 'warning', 'critical')
