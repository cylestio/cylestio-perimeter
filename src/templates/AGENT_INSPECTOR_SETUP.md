# Agent Inspector - Installation Guide for AI Assistants

> **Purpose:** Complete guide for Cursor/Claude Code to install and configure Agent Inspector.
> 
> **Your job:** Execute EVERY step. Be smart. Handle edge cases. Succeed 100%.

---

## ⚠️ COMMANDS THAT WILL HANG - NEVER RUN

```bash
# ❌ NEVER - will freeze your session
curl http://localhost:...
wget http://...
nc -z localhost ...
ping ...
python -i ...
```

---

## STEP 1: UNDERSTAND THE ENVIRONMENT

### 1.1 Determine Agent Project Location

Ask yourself: Where is the agent code the user wants to analyze?

- If user specified a path → use that
- If user said "this project" → use current workspace root
- If unclear → ask: "Which folder contains your agent code?"

Store this as `{AGENT_PROJECT_FOLDER}`.

### 1.2 Check if Inside cylestio-perimeter Repo (Local Dev Mode)

```bash
# Check for cylestio-perimeter pyproject.toml in parent directories
ls ../../pyproject.toml 2>/dev/null | head -1
# OR
ls ../../../pyproject.toml 2>/dev/null | head -1
```

If found and contains "cylestio-perimeter" → **Local Dev Mode**
Otherwise → **Production Mode**

### 1.3 Check/Create Virtual Environment

```bash
# Check if venv exists
ls {AGENT_PROJECT_FOLDER}/venv/bin/activate 2>/dev/null && echo "VENV_EXISTS" || echo "NO_VENV"
```

**If NO_VENV:**
```bash
cd {AGENT_PROJECT_FOLDER}
python -m venv venv
```

**Activate venv for subsequent commands:**
```bash
source {AGENT_PROJECT_FOLDER}/venv/bin/activate
```

---

## STEP 2: INSTALL PACKAGE

**Always run installation** - `pip install` is idempotent and will update if needed.

### Production Mode:
```bash
source {AGENT_PROJECT_FOLDER}/venv/bin/activate
pip install agent-inspector
```

### Local Dev Mode:
```bash
source {AGENT_PROJECT_FOLDER}/venv/bin/activate
# Adjust path depth based on agent location relative to repo root:
# - repo/temp/agents/my-agent/ → pip install ../../../
# - repo/examples/my-agent/ → pip install ../../
pip install {RELATIVE_PATH_TO_REPO_ROOT}
```

**Verify success:** Output must show "Successfully installed" or "Requirement already satisfied".

---

## STEP 3: DETECT YOUR IDE

Determine which IDE YOU are:

| You Are | How to Know |
|---------|-------------|
| **Cursor** | You're an AI in Cursor IDE. Check: does `.cursor/` folder exist in workspace? |
| **Claude Code** | You're Claude Code. Check: does `.claude/` folder exist in workspace? |

Store result as `{IDE_TYPE}`.

---

## STEP 4: CONFIGURE MCP CONNECTION

### 4.1 For Cursor: `.cursor/mcp.json`

**First, check if file exists:**
```bash
cat {AGENT_PROJECT_FOLDER}/.cursor/mcp.json 2>/dev/null || echo "FILE_NOT_FOUND"
```

**If FILE_NOT_FOUND:** Create new file:
```bash
mkdir -p {AGENT_PROJECT_FOLDER}/.cursor
```
Then write:
```json
{
  "mcpServers": {
    "agent-inspector": {
      "type": "streamable-http",
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

**If file EXISTS:** Parse JSON and check if `agent-inspector` entry exists:
- If `agent-inspector` exists with correct config → skip
- If `agent-inspector` exists with wrong config → update the entry
- If `agent-inspector` missing → add it while PRESERVING other servers

**Example merge:**
```json
{
  "mcpServers": {
    "existing-server": { "command": "...", "args": ["..."] },
    "agent-inspector": {
      "type": "streamable-http",
      "url": "http://localhost:7100/mcp"
    }
  }
}
```

### 4.2 For Claude Code: `.mcp.json`

Same logic as above, but:
- File location: `{AGENT_PROJECT_FOLDER}/.mcp.json` (project root)
- Use `"type": "http"` instead of `"streamable-http"`

---

## STEP 5: CREATE RULES FILE

**Only for Cursor** (skip if you're Claude Code):

```bash
mkdir -p {AGENT_PROJECT_FOLDER}/.cursor/rules
```

**Copy from package template** if available:
- Look for: `src/templates/cursor-rules/agent-inspector.mdc` in the installed package or repo
- Copy to: `{AGENT_PROJECT_FOLDER}/.cursor/rules/agent-inspector.mdc`

If template not found, create minimal rules file that references MCP tools discovery.

---

## STEP 6: UPDATE AGENT CODE TO USE PROXY

**Search for LLM client initialization:**
```bash
grep -rn "Anthropic\|OpenAI" {AGENT_PROJECT_FOLDER} --include="*.py" | head -20
```

**For each match, check if `base_url` is already set:**
- If `base_url` already points to `localhost:4000` → skip
- If `base_url` missing or wrong → edit the file

**Add `base_url` parameter:**

```python
# Anthropic:
client = Anthropic(
    api_key="...",
    base_url="http://localhost:4000"
)

# OpenAI:
client = OpenAI(
    api_key="...",
    base_url="http://localhost:4000/v1"
)
```

**YOU MUST EDIT THE ACTUAL FILES** - use your file editing tools.

---

## STEP 7: START AGENT INSPECTOR SERVER

**Try to start it yourself** in a background terminal:

### Production Mode:
```bash
# Run in background
agent-inspector anthropic &
# OR for OpenAI:
agent-inspector openai &
```

### Local Dev Mode:
```bash
source {AGENT_PROJECT_FOLDER}/venv/bin/activate
cylestio-perimeter run --config {PATH_TO_CONFIG} &
```

**If background execution fails or isn't supported**, tell the user:

> "Please start Agent Inspector in a terminal:
> ```bash
> agent-inspector anthropic
> ```
> Keep it running while using the security tools."

---

## STEP 8: RELOAD IDE TO CONNECT MCP

**For Cursor - Multiple options:**

1. **Settings UI (easiest):** Go to Settings → Tools & MCP → click refresh/reload on MCP servers
2. **Command Palette:** Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux), type "Reload Window"
3. **Full Restart:** Quit and reopen Cursor

> "To connect to Agent Inspector MCP:
> - Go to **Settings → Tools & MCP** and reload the MCP servers
> - Or press `Cmd+Shift+P` → 'Developer: Reload Window'
> - Or restart Cursor
> 
> You should see 'agent-inspector' with 17 tools enabled."

**For Claude Code:**

> "Run `/mcp` to verify the connection. You should see 'agent-inspector' listed."

---

## STEP 9: REGISTER IDE CONNECTION (AUTOMATIC)

⚠️ **CRITICAL: This step MUST succeed. If it fails, retry on EVERY subsequent MCP tool call.**

### 9.1 Determine Your Model Name

**You MUST know what AI model you are.** Check your system prompt or self-identify:

| If you are... | Use model value |
|---------------|-----------------|
| Claude Opus 4.5 | `"claude-opus-4.5"` |
| Claude Sonnet 4 | `"claude-sonnet-4"` |
| Claude Sonnet 3.5 | `"claude-sonnet-3.5"` |
| GPT-4o | `"gpt-4o"` |
| GPT-4 Turbo | `"gpt-4-turbo"` |
| Other | Use your actual model identifier |

**If unsure, check:** Your system prompt often says "powered by X" or "You are X".

### 9.2 Immediately Register After MCP Connect

As soon as MCP tools are available, call `register_ide_connection` with ALL parameters:

```
register_ide_connection(
  ide_type="cursor",              // REQUIRED: "cursor" or "claude-code"
  agent_workflow_id="my-agent",   // REQUIRED: from folder name
  workspace_path="/path/to/project",  // REQUIRED: full workspace path
  model="claude-opus-4.5"         // REQUIRED: your AI model name
)
```

**Parameter values:**
| Parameter | How to determine |
|-----------|------------------|
| `ide_type` | `"cursor"` if in Cursor IDE, `"claude-code"` if Claude Code CLI |
| `agent_workflow_id` | Agent project folder name (e.g., `"next-rooms"`, `"my-agent"`) |
| `workspace_path` | Full path to the workspace you're editing |
| `model` | Your AI model name (see table above) |

### 9.3 Store the Connection ID

**IMPORTANT: Store the returned `connection_id` in your context.** You need it for heartbeats.

Example response:
```json
{
  "connection": {
    "connection_id": "ide_abc123def456",  // ← SAVE THIS!
    ...
  }
}
```

### 9.4 If Registration Fails

If `register_ide_connection` fails:

1. **DO NOT GIVE UP** - Remember: `PENDING_IDE_REGISTRATION = true`
2. **Retry on EVERY subsequent MCP call** - Before any other Agent Inspector tool, try again
3. **Only stop retrying** when you get a successful `connection_id` back

### 9.5 Heartbeat Strategy (MINIMAL - Save Tokens!)

⚠️ **DO NOT send heartbeats after every action!** This wastes tokens and context.

**Send heartbeats ONLY:**
1. **Once at the START** of Agent Inspector work (after registration)
2. **Once at the END** of a complete task (optional)

That's it! The dashboard will show "connected" for 60 seconds after each heartbeat.

**Example minimal flow:**
```
// User: "Scan my agent for security issues"
register_ide_connection(...)  // Only if not already registered
ide_heartbeat(connection_id, is_developing=true)  // ONE heartbeat at start
// ... do all the scanning work ...
// Done! No more heartbeats needed
```

---

## ⚠️ RECONNECTION ON FUTURE SESSIONS (Lightweight)

**Only register when user asks for Agent Inspector features.** Don't register proactively.

### When user asks for security analysis:
1. Call `register_ide_connection()` (idempotent - safe to call again)
2. Send ONE `ide_heartbeat(is_developing=true)`
3. Do the work
4. Done - no more calls needed

**Skip `get_ide_connection_status`** - just register directly. It's simpler and uses same tokens.

---

## STEP 10: RUN FIRST STATIC SCAN

**If there's agent code in the project, run a security scan immediately.**

### 10.1 Check for Code

Look for Python/JS/TS files in the agent project:
```bash
ls {AGENT_PROJECT_FOLDER}/*.py {AGENT_PROJECT_FOLDER}/*.js {AGENT_PROJECT_FOLDER}/*.ts 2>/dev/null | head -5
```

### 10.2 If Code Exists, Run Static Scan

If MCP is connected, use the `/scan` command workflow:

1. Create analysis session: `create_analysis_session(agent_workflow_id, "STATIC")`
2. Get security patterns: `get_security_patterns()`
3. **Analyze code for ALL 7 security categories:**
   - PROMPT (LLM01): Injection, jailbreak
   - OUTPUT (LLM02): Insecure output handling
   - TOOL (LLM07/08): Dangerous tools
   - DATA (LLM06): Hardcoded secrets
   - MEMORY: RAG/context security
   - SUPPLY (LLM05): Dependencies
   - BEHAVIOR (LLM08/09): Excessive agency
4. Store findings with category: `store_finding(..., category="PROMPT")`
5. Complete session: `complete_analysis_session(session_id)`

**Report using the 7-category format:**
```
🔍 AI Security Scan Complete!

Security Checks (7):
✗ PROMPT Security: X Critical issues
✓ DATA Security: Passed
...

Gate Status: 🔒 BLOCKED / ✅ OPEN
```

If MCP not connected yet, tell user:
> "Reload Cursor, then type `/scan` and I'll analyze your agent code."

---

## STEP 11: DISCOVER TOOLS & SHOW WELCOME

### 11.1 Get Available Tools

Query the `agent-inspector` MCP server for available tools.

### 11.2 Understand & Explain

**You're smart.** Read the tool names and descriptions. Figure out what's actually possible - don't assume features exist. Only mention capabilities you can verify from the tool list.

### 11.3 Display Welcome Message

```
 ██████╗██╗   ██╗██╗     ███████╗███████╗████████╗██╗ ██████╗ 
██╔════╝╚██╗ ██╔╝██║     ██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗
██║      ╚████╔╝ ██║     █████╗  ███████╗   ██║   ██║██║   ██║
██║       ╚██╔╝  ██║     ██╔══╝  ╚════██║   ██║   ██║██║   ██║
╚██████╗   ██║   ███████╗███████╗███████║   ██║   ██║╚██████╔╝
 ╚═════╝   ╚═╝   ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚═╝ ╚═════╝ 
                    AGENT INSPECTOR
```

**Thanks for using Cylestio Agent Inspector! 🛡️**

#### What is Agent Inspector?

A security analysis platform for AI agents - find vulnerabilities, understand behavior, meet compliance.

#### Quick Commands

| Command | Description |
|---------|-------------|
| `/scan` | Run security scan on current workspace |
| `/scan path/to/folder` | Run security scan on specific folder |
| `/fix REC-001` | Fix a specific recommendation |
| `/fix` | Fix the next highest-priority recommendation |

#### The 7 Security Checks

Your agent is evaluated against 7 security categories:
1. **PROMPT** - Prompt injection (LLM01)
2. **OUTPUT** - Insecure output handling (LLM02)
3. **TOOL** - Dangerous tools (LLM07/08)
4. **DATA** - Secrets exposure (LLM06)
5. **MEMORY** - RAG/context security
6. **SUPPLY** - Dependencies (LLM05)
7. **BEHAVIOR** - Excessive agency (LLM08/09)

**Gate is BLOCKED** if any HIGH or CRITICAL issues exist.

#### Quick Links

- **Dashboard:** http://localhost:7100  
- **Static Analysis:** http://localhost:7100/agent-workflow/{id}/static-analysis
- **Proxy:** http://localhost:4000

#### I'll Remember Agent Inspector

The rules file ensures I'll use these tools when you ask about security - even in future chats!

---

## CHECKLIST - VERIFY COMPLETION

- [ ] Identified agent project folder
- [ ] Checked/created virtual environment
- [ ] Ran `pip install` (saw success message)
- [ ] Created/updated MCP config file (`.cursor/mcp.json` or `.mcp.json`)
- [ ] Created rules file (Cursor only)
- [ ] Updated agent code with `base_url`
- [ ] Started server OR told user how to start it
- [ ] Told user to reload IDE
- [ ] **Registered IDE connection** (or set PENDING_IDE_REGISTRATION reminder)
- [ ] Ran first static scan (if code exists and MCP connected) OR told user to ask for scan after reload
- [ ] Displayed welcome message with ONLY verified capabilities

**ALL BOXES MUST BE CHECKED.**

**REMEMBER:** If IDE connection registration failed, you MUST retry on every subsequent MCP call!

---

## REFERENCE

| Port | Service |
|------|---------|
| 4000 | LLM Proxy (agent's `base_url`) |
| 7100 | Dashboard + MCP Server |

| Problem | Solution |
|---------|----------|
| Command not found | Re-run install step |
| MCP tools unavailable | Reload IDE, verify server running |
| Connection refused | Start the server |
| Permission denied | Activate venv first |
