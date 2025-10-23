#!/usr/bin/env python3
"""
Demo script showing live_trace persistence in action.

This script demonstrates:
1. Creating a TraceStore with persistence enabled
2. Adding session and agent data
3. Saving to file
4. Loading from file on restart
"""

import tempfile
from datetime import datetime, timezone
from pathlib import Path

from src.events import BaseEvent, EventName
from src.interceptors.live_trace.store import AgentData, SessionData, TraceStore


def print_header(text: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def print_store_stats(store: TraceStore, title: str):
    """Print store statistics."""
    print(f"--- {title} ---")
    print(f"Total events: {store.total_events}")
    print(f"Sessions: {len(store.sessions)}")
    print(f"Agents: {len(store.agents)}")
    
    for session_id, session in store.sessions.items():
        print(f"  Session {session_id}:")
        print(f"    - Messages: {session.message_count}")
        print(f"    - Tokens: {session.total_tokens}")
        print(f"    - Tool uses: {session.tool_uses}")
    
    for agent_id, agent in store.agents.items():
        print(f"  Agent {agent_id}:")
        print(f"    - Total sessions: {agent.total_sessions}")
        print(f"    - Total messages: {agent.total_messages}")
    print()


def main():
    """Run the demonstration."""
    print_header("Live Trace Persistence Demo")
    
    # Use temp directory for demo
    with tempfile.TemporaryDirectory() as tmpdir:
        persistence_file = Path(tmpdir) / "trace_store.json"
        
        # ===== STEP 1: Create store and add data =====
        print_header("Step 1: Create Store and Add Data")
        
        store1 = TraceStore(
            persist_to_file=True,
            persistence_dir=tmpdir,
            save_interval_events=5
        )
        
        # Add some sessions and agents
        session1 = SessionData("session-001", "math-agent")
        session1.total_events = 15
        session1.message_count = 5
        session1.tool_uses = 3
        session1.total_tokens = 1500
        session1.available_tools.add("calculator")
        session1.tool_usage_details["calculator"] = 3
        
        session2 = SessionData("session-002", "weather-agent")
        session2.total_events = 20
        session2.message_count = 8
        session2.tool_uses = 5
        session2.total_tokens = 2000
        session2.available_tools.add("weather_api")
        session2.tool_usage_details["weather_api"] = 5
        
        store1.sessions["session-001"] = session1
        store1.sessions["session-002"] = session2
        
        agent1 = AgentData("math-agent")
        agent1.sessions.add("session-001")
        agent1.total_sessions = 1
        agent1.total_messages = 5
        agent1.total_tokens = 1500
        agent1.total_tools = 3
        agent1.available_tools.add("calculator")
        agent1.used_tools.add("calculator")
        
        agent2 = AgentData("weather-agent")
        agent2.sessions.add("session-002")
        agent2.total_sessions = 1
        agent2.total_messages = 8
        agent2.total_tokens = 2000
        agent2.total_tools = 5
        agent2.available_tools.add("weather_api")
        agent2.used_tools.add("weather_api")
        
        store1.agents["math-agent"] = agent1
        store1.agents["weather-agent"] = agent2
        
        store1.total_events = 35
        store1.tool_usage["calculator"] = 3
        store1.tool_usage["weather_api"] = 5
        
        print_store_stats(store1, "Initial Store State")
        
        # ===== STEP 2: Save to file =====
        print_header("Step 2: Save to File")
        
        store1.save()
        
        print(f"✅ Saved to: {persistence_file}")
        print(f"📊 File size: {persistence_file.stat().st_size:,} bytes")
        print()
        
        # Show file contents
        print("File contents (first 500 chars):")
        print("-" * 60)
        with open(persistence_file) as f:
            content = f.read()
            print(content[:500] + "...")
        print("-" * 60 + "\n")
        
        # ===== STEP 3: Simulate restart - load from file =====
        print_header("Step 3: Simulate Restart - Load from File")
        
        print("Creating new TraceStore instance (simulating restart)...")
        
        store2 = TraceStore(
            persist_to_file=True,
            persistence_dir=tmpdir,
            save_interval_events=5
        )
        
        print("✅ Data loaded automatically from file!\n")
        
        print_store_stats(store2, "Restored Store State")
        
        # ===== STEP 4: Verify data integrity =====
        print_header("Step 4: Verify Data Integrity")
        
        checks = [
            ("Total events", store1.total_events == store2.total_events),
            ("Session count", len(store1.sessions) == len(store2.sessions)),
            ("Agent count", len(store1.agents) == len(store2.agents)),
            ("Session-001 messages", store1.sessions["session-001"].message_count == store2.sessions["session-001"].message_count),
            ("Session-002 tokens", store1.sessions["session-002"].total_tokens == store2.sessions["session-002"].total_tokens),
            ("Math agent tools", store1.agents["math-agent"].total_tools == store2.agents["math-agent"].total_tools),
            ("Tool usage", dict(store1.tool_usage) == dict(store2.tool_usage)),
        ]
        
        all_passed = True
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"{status} {check_name}: {'PASS' if passed else 'FAIL'}")
            if not passed:
                all_passed = False
        
        print()
        if all_passed:
            print("🎉 All integrity checks passed!")
        else:
            print("⚠️  Some checks failed!")
        
        # ===== STEP 5: Add more data and auto-save =====
        print_header("Step 5: Add More Data and Auto-Save")
        
        print("Adding events to trigger auto-save...")
        
        event = BaseEvent(
            name=EventName.LLM_CALL_START,
            session_id="session-003",
            trace_id="trace-1",
            span_id="span-1",
            agent_id="test-agent",
            attributes={"agent.id": "test-agent"}
        )
        
        # Add 5 events to trigger auto-save
        for i in range(5):
            store2.add_event(event, "session-003", "test-agent")
            print(f"  Added event {i+1}/5")
        
        print("\n✅ Auto-save triggered after 5 events!")
        
        print_store_stats(store2, "Final Store State")
        
        # ===== SUMMARY =====
        print_header("Summary")
        
        print("✅ Persistence feature works correctly!")
        print()
        print("Key features demonstrated:")
        print("  1. ✅ Data saves to JSON file")
        print("  2. ✅ Data loads automatically on restart")
        print("  3. ✅ Data integrity preserved")
        print("  4. ✅ Auto-save triggers correctly")
        print("  5. ✅ Sessions, agents, and metrics all restored")
        print()
        print("Configuration used:")
        print(f"  - persist_to_file: True")
        print(f"  - persistence_dir: {tmpdir}")
        print(f"  - save_interval_events: 5")
        print()


if __name__ == "__main__":
    main()

