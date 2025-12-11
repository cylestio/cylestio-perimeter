# Live Trace Analysis Flow

## Analysis Types

| Type | Location | Triggers | Storage | Min Sessions |
|------|----------|----------|---------|--------------|
| **Behavioral** | `runtime/behavioral.py` | API access, session completion | Memory cache | 5 |
| **Security** | `runtime/security.py` | API access, session completion | DB (`security_checks`) | 5 |
| **PII** | `runtime/pii.py` | API access (background) | Memory cache | 0 |

---

## Trigger 1: Session Completion (Background Thread)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SESSION COMPLETION TRIGGER                        │
│                          (Background Thread - 10s interval)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
    ┌─────────────────────────────────┼─────────────────────────────────────┐
    │                                 │                                     │
    ▼                                 ▼                                     ▼
interceptor.py              store.py:1044                           engine.py:1550
_run_completion_checker()   check_and_complete_sessions()          on_session_completed()
 (every 10 seconds)          - Find inactive sessions               │
        │                    - Mark completed                       ▼
        │                    - Return agent_ids              scheduler.should_run_analysis()
        │                            │                               │
        └────────────────────────────┘                       ┌───────┴───────┐
                                                             │               │
                                                           TRUE            FALSE
                                                             │               │
                                                             ▼               ▼
                                                 run_analysis_async()    [SKIP]
                                                             │
                                                             ▼
                                                  asyncio.run(run_analysis())
```

---

## Trigger 2: API Access (Dashboard Polling)

**Why you see multiple scans:** The frontend dashboard polls `/api/agent/{agent_id}` periodically.
Each poll can trigger `compute_risk_analysis()` if the cache is invalidated (session count changed).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API ACCESS TRIGGER                                │
│         (GET /api/agent/{agent_id} - Dashboard polls every ~5s)             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                            server.py:api_agent()
                                      │
                                      ▼
                          insights.get_agent_data()
                                      │
                                      ▼
                          compute_risk_analysis()
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                      CACHE HIT               CACHE MISS
                     (fast return)          (new session added)
                          │                       │
                          ▼                       ▼
                    Return cached         Run FULL analysis
                                          (Behavioral + Security + PII)
                                                  │
                                                  ▼
                                          Return to client
                                          (NOT persisted to DB)
```

**Key Differences Between Triggers:**

| Aspect | Session Completion | API Access |
|--------|-------------------|------------|
| Trigger | Background thread (10s) | Dashboard poll (~5s) |
| Persists to DB | YES (`analysis_sessions`, `security_checks`) | NO |
| Uses Scheduler | YES (prevents duplicates) | NO (can run in parallel) |
| Cache invalidation | Session count changed | Session count changed |

**Why scans appear "in parallel":** API access (Trigger 2) does NOT use the scheduler,
so multiple dashboard requests can each trigger `compute_risk_analysis()` simultaneously
if the cache was just invalidated.

---

## run_analysis() Flow (engine.py:1460)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              run_analysis()                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. scheduler.mark_analysis_started()                                       │
│                                                                             │
│  2. compute_risk_analysis()                                                 │
│         │                                                                   │
│         ├── Check sessions >= 5 ──► NO ──► Return INSUFFICIENT_DATA        │
│         │                                                                   │
│         ├── Check cache (session_count, completed_count)                    │
│         │         │                                                         │
│         │       CACHE HIT ──► Return cached result                          │
│         │       CACHE MISS ──┐                                              │
│         │                    │                                              │
│         ▼                    ▼                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ analyze_agent_behavior()    [BEHAVIORAL]                     │           │
│  │  - Extract features from sessions                            │           │
│  │  - Compute MinHash signatures                                │           │
│  │  - LSH clustering (0.40 threshold)                           │           │
│  │  - Detect outliers                                           │           │
│  │  → Returns BehavioralAnalysisResult                          │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                         │                                                   │
│                         ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ _trigger_pii_analysis_if_needed()  [PII - BACKGROUND]        │           │
│  │  - Checks if already running                                 │           │
│  │  - Launches asyncio.create_task() if needed                  │           │
│  │  → Returns cached or pending PIIAnalysisResult               │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                         │                                                   │
│                         ▼                                                   │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ generate_security_report()  [SECURITY]                       │           │
│  │  - Resource Management (5 checks)                            │           │
│  │  - Environment & Supply Chain (3 checks)                     │           │
│  │  - Behavioral Stability (5 checks)                           │           │
│  │  - Privacy & PII Compliance (3 checks)                       │           │
│  │  → Returns SecurityReport with 16 checks                     │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  3. IF security_report exists:                                              │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │ PERSIST TO DATABASE                                          │           │
│  │  a. store.create_analysis_session()  → analysis_sessions     │           │
│  │  b. store.persist_security_checks()  → security_checks       │           │
│  │  c. store.complete_analysis_session()                        │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  4. scheduler.mark_analysis_completed()                                     │
│                                                                             │
│  5. scheduler.should_run_analysis() [burst check]                           │
│         │                                                                   │
│       TRUE ──► asyncio.create_task(run_analysis())  [re-run]                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Analysis Runner Logic (runtime/analysis_runner.py)

```python
class AnalysisRunner:
    _running: Dict[str, bool]           # agent_id → is_running

    def _should_run(agent_id) -> bool:
        if analysis_currently_running:
            return False
        if completed_count < MIN_SESSIONS:  # 5
            return False
        if current_completed_count > last_analyzed_count:
            return True
        return False

    def trigger(agent_id) -> None:
        """Single entry point for all analysis triggers."""
        if _should_run(agent_id):
            _run_async(agent_id)
```

**Burst Handling:** After analysis completes, runner checks if new sessions arrived during analysis. If yes, triggers another run.

---

## Database Tables

### `analysis_sessions`
Stores analysis run metadata.

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT PK | Unique analysis session ID |
| agent_id | TEXT | Agent being analyzed |
| workflow_id | TEXT | Workflow identifier |
| session_type | TEXT | "DYNAMIC" for runtime analysis |
| status | TEXT | "pending", "completed" |
| findings_count | INTEGER | Number of security checks |
| risk_score | REAL | Overall risk score |

### `security_checks`
Stores individual security check results.

| Column | Type | Description |
|--------|------|-------------|
| check_id | TEXT PK | Unique check ID |
| agent_id | TEXT | Agent identifier |
| analysis_session_id | TEXT FK | Links to analysis_sessions |
| category_id | TEXT | RESOURCE_MANAGEMENT, BEHAVIORAL, etc. |
| check_type | TEXT | Specific check identifier |
| status | TEXT | "passed", "warning", "critical" |
| title | TEXT | Human-readable check name |
| evidence | TEXT (JSON) | Supporting data |
| recommendations | TEXT (JSON) | Suggested actions |

---

## Log Messages to Watch

When testing, look for these log lines:

```
[ANALYSIS] on_session_completed called for {agent_id}
[ANALYSIS] Scheduler approved, triggering analysis for {agent_id}
[ANALYSIS] run_analysis started for {agent_id}
[ANALYSIS] compute_risk_analysis returned for {agent_id}: result=True, has_security_report=True
[ANALYSIS] Persisted X security checks for agent {agent_id}
```

If you see "Scheduler declined", it means either:
- Analysis is already running for that agent
- No new sessions completed since last analysis
