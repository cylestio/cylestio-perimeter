"""Behavioral analysis engine for agent clustering and outlier detection."""
import hashlib
import logging
import math
import re
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np

logger = logging.getLogger(__name__)

from .models import (
    BehavioralAnalysisResult,
    CentroidDistance,
    ClusterCharacteristics,
    ClusterInfo,
    OutlierInfo,
    SessionFeatures,
)
from ..store.store import SessionData


# ============================================================================
# Feature Extraction (Section 3.2)
# ============================================================================

def extract_session_features(session: SessionData) -> SessionFeatures:
    """Extract behavioral features from a session.
    
    Args:
        session: SessionData object with events
        
    Returns:
        SessionFeatures object
    """
    # Initialize accumulators
    tools_used = set()
    tool_sequences = []
    tool_times = []
    llm_models = set()
    llm_count = 0
    token_in = []
    token_out = []
    
    # Extract from each event
    for event in session.events:
        event_name = event.name.value
        
        # Tool interactions
        if 'tool' in event_name.lower():
            tool_name = event.attributes.get('tool.name')
            if tool_name:
                tools_used.add(tool_name)
                tool_sequences.append(tool_name)
                
                exec_time = event.attributes.get('tool.execution_time_ms', 0)
                if exec_time > 0:
                    tool_times.append(exec_time)
        
        # LLM interactions
        if 'llm' in event_name.lower():
            llm_count += 1
            model = event.attributes.get('llm.model')
            if model:
                llm_models.add(model)
            
            req_tokens = event.attributes.get('llm.usage.input_tokens', 0)
            resp_tokens = event.attributes.get('llm.usage.output_tokens', 0)
            if req_tokens > 0:
                token_in.append(req_tokens)
            if resp_tokens > 0:
                token_out.append(resp_tokens)
    
    # Calculate statistics
    def calc_stats(values):
        if not values:
            return {'mean': 0, 'std': 0, 'max': 0, 'p95': 0}
        return {
            'mean': float(np.mean(values)),
            'std': float(np.std(values)),
            'max': float(np.max(values)),
            'p95': float(np.percentile(values, 95))
        }
    
    # Temporal features
    duration = session.duration_minutes * 60  # Convert to seconds
    avg_interval = duration / max(session.total_events - 1, 1)
    
    return SessionFeatures(
        session_id=session.session_id,
        agent_id=session.agent_id,
        tools_used=tools_used,
        tool_sequences=tool_sequences,
        tool_execution_times=tool_times,
        llm_models=llm_models,
        llm_request_count=llm_count,
        token_in_stats=calc_stats(token_in),
        token_out_stats=calc_stats(token_out),
        session_duration=duration,
        event_count=session.total_events,
        avg_event_interval=avg_interval,
        total_tokens=sum(token_in) + sum(token_out),
        total_tool_calls=len(tool_sequences)
    )


# ============================================================================
# Shingle Generation (Section 3.3)
# ============================================================================

def _adaptive_bin(value: float, percentile_dict: Optional[Dict[str, float]], fallback_thresholds: List[float]) -> str:
    """Bin a numerical value using adaptive percentiles or fallback thresholds.
    
    Args:
        value: The numerical value to bin
        percentile_dict: Dict with keys "p25", "p50", "p75" for adaptive binning
        fallback_thresholds: List of 3 thresholds for fallback binning [low, mid, high]
        
    Returns:
        Bin label: "very_low", "low", "medium", "high", or "very_high"
    """
    if percentile_dict and "p25" in percentile_dict:
        # Use data-driven percentiles
        p25 = percentile_dict["p25"]
        p50 = percentile_dict["p50"]
        p75 = percentile_dict["p75"]
        
        if value < p25:
            return "very_low"
        elif value < p50:
            return "low"
        elif value < p75:
            return "medium"
        else:
            return "high"
    else:
        # Use fallback thresholds
        if value < fallback_thresholds[0]:
            return "very_low"
        elif value < fallback_thresholds[1]:
            return "low"
        elif value < fallback_thresholds[2]:
            return "medium"
        else:
            return "high"


def features_to_shingles(features: SessionFeatures, percentiles: Dict[str, Dict[str, float]] = None) -> Set[str]:
    """Convert session features to behavioral shingles.
    
    This creates a set of tokens representing the session's behavior,
    enabling Jaccard similarity comparison.
    
    Uses adaptive binning based on data distribution (percentiles) when available,
    otherwise falls back to generic thresholds suitable for initial analysis.
    
    Args:
        features: Extracted session features
        percentiles: Optional dict of feature percentiles for adaptive binning.
                    Format: {"feature_name": {"p25": value, "p50": value, "p75": value}}
        
    Returns:
        Set of shingle strings
    """
    shingles = set()
    seq = features.tool_sequences
    
    # 1. Unigrams - individual tool calls
    for tool in seq:
        shingles.add(f"t:{tool}")
    
    # 2. Bigrams - adjacent calls
    for i in range(len(seq) - 1):
        shingles.add(f"b:{seq[i]}>{seq[i+1]}")
    
    # 3. Trigrams - 3-tool sequences
    for i in range(len(seq) - 2):
        shingles.add(f"g:{seq[i]}>{seq[i+1]}>{seq[i+2]}")
    
    # 4. Skip-grams within window (W=2)
    for i in range(len(seq)):
        for j in range(i + 1, min(len(seq), i + 3)):
            gap = j - i
            shingles.add(f"s:{seq[i]}>{seq[j]}@{gap}")
    
    # 5. Run-length encoding
    i = 0
    while i < len(seq):
        j = i
        while j < len(seq) and seq[j] == seq[i]:
            j += 1
        run_length = j - i
        
        # Bin: 1, 2, 3+
        if run_length == 1:
            bin_label = "1"
        elif run_length == 2:
            bin_label = "2"
        else:
            bin_label = "3+"
        
        shingles.add(f"r:{seq[i]}x{bin_label}")
        i = j
    
    # 6. Anchors - mark session edges
    if seq:
        shingles.add(f"^:{seq[0]}")
        shingles.add(f"...:{seq[-1]}$")
    
    # 7. LLM model patterns
    for model in features.llm_models:
        shingles.add(f"llm:{model}")
    
    # 8-15. Adaptive numerical features using percentiles
    # If percentiles are provided, use data-driven thresholds
    # Otherwise, use generic fallback thresholds
    
    # 8. Session duration
    duration_bin = _adaptive_bin(
        features.session_duration,
        percentiles.get("session_duration") if percentiles else None,
        fallback_thresholds=[30, 60, 90]
    )
    shingles.add(f"duration:{duration_bin}")
    
    # 9. Tool call intensity
    if features.total_tool_calls == 0:
        shingles.add("tools:none")
    else:
        tools_bin = _adaptive_bin(
            features.total_tool_calls,
            percentiles.get("total_tool_calls") if percentiles else None,
            fallback_thresholds=[1, 3, 8]
        )
        shingles.add(f"tools:{tools_bin}")
        
        # Tool diversity (ratio is universal, doesn't need adaptation)
        unique_tools = len(features.tools_used)
        diversity_ratio = unique_tools / features.total_tool_calls
        if diversity_ratio > 0.75:
            shingles.add("tool_diversity:high")
        elif diversity_ratio > 0.4:
            shingles.add("tool_diversity:moderate")
        else:
            shingles.add("tool_diversity:low")
    
    # 10. LLM request count
    llm_bin = _adaptive_bin(
        features.llm_request_count,
        percentiles.get("llm_request_count") if percentiles else None,
        fallback_thresholds=[5, 10, 20]
    )
    shingles.add(f"llm_requests:{llm_bin}")
    
    # 11. Token usage
    tokens_bin = _adaptive_bin(
        features.total_tokens,
        percentiles.get("total_tokens") if percentiles else None,
        fallback_thresholds=[1000, 5000, 15000]
    )
    shingles.add(f"tokens:{tokens_bin}")
    
    # 12. Input/Output token ratio (using mean from stats)
    token_in_mean = features.token_in_stats.get('mean', 0)
    token_out_mean = features.token_out_stats.get('mean', 0)
    if token_in_mean > 0 and token_out_mean > 0:
        io_ratio = token_out_mean / token_in_mean
        if io_ratio > 1.5:
            shingles.add("io_ratio:output_heavy")
        elif io_ratio > 0.8:
            shingles.add("io_ratio:balanced")
        else:
            shingles.add("io_ratio:input_heavy")
    
    # 13. Average event interval (temporal pattern)
    interval_bin = _adaptive_bin(
        features.avg_event_interval,
        percentiles.get("avg_event_interval") if percentiles else None,
        fallback_thresholds=[5, 15, 30]  # seconds between events
    )
    shingles.add(f"event_interval:{interval_bin}")
    
    # 14. Event count
    event_bin = _adaptive_bin(
        features.event_count,
        percentiles.get("event_count") if percentiles else None,
        fallback_thresholds=[10, 25, 50]
    )
    shingles.add(f"events:{event_bin}")
    
    # 15. Relative patterns (these are meaningful across agents)
    # Ratio of tool calls to LLM requests (conversational intensity)
    if features.llm_request_count > 0 and features.total_tool_calls > 0:
        tool_ratio = features.total_tool_calls / features.llm_request_count
        if tool_ratio > 0.6:
            shingles.add("pattern:tool_heavy")
        elif tool_ratio > 0.3:
            shingles.add("pattern:balanced")
        else:
            shingles.add("pattern:conversation_heavy")
    
    return shingles


# ============================================================================
# MinHash Signature (Section 3.4)
# ============================================================================

class MinHashSignature:
    """MinHash signature generator for session fingerprinting."""
    
    def __init__(self, num_hashes: int = 512):
        self.num_hashes = num_hashes
        self.hash_functions = self._generate_hash_functions()
    
    def _generate_hash_functions(self) -> List[callable]:
        """Generate independent hash functions with different seeds."""
        hash_funcs = []
        for i in range(self.num_hashes):
            seed = i * 12345
            hash_funcs.append(
                lambda x, s=seed: int(hashlib.md5(f"{x}_{s}".encode(), usedforsecurity=False).hexdigest(), 16)
            )
        return hash_funcs
    
    def compute_signature(self, shingles: Set[str]) -> List[int]:
        """Compute MinHash signature for a set of shingles.
        
        Args:
            shingles: Set of behavioral shingle strings
            
        Returns:
            List of 512 integers (the signature)
        """
        signature = []
        
        for hash_func in self.hash_functions:
            min_hash = float('inf')
            for shingle in shingles:
                hash_val = hash_func(shingle)
                min_hash = min(min_hash, hash_val)
            
            signature.append(int(min_hash) if min_hash != float('inf') else 0)
        
        return signature
    
    def jaccard_similarity(self, sig1: List[int], sig2: List[int]) -> float:
        """Estimate Jaccard similarity from MinHash signatures.
        
        Args:
            sig1, sig2: MinHash signatures (512-dim vectors)
            
        Returns:
            Estimated Jaccard similarity [0.0, 1.0]
        """
        if len(sig1) != len(sig2):
            raise ValueError("Signatures must have same length")
        
        matches = sum(1 for a, b in zip(sig1, sig2) if a == b)
        return matches / len(sig1)


# ============================================================================
# LSH Clustering (Section 3.5)
# ============================================================================

class LSHClustering:
    """Locality-Sensitive Hashing for fast candidate generation."""
    
    def __init__(self, num_bands: int = 64, rows_per_band: int = 8):
        self.num_bands = num_bands
        self.rows_per_band = rows_per_band
    
    def find_candidates(self, signatures: Dict[str, List[int]]) -> Dict[str, Set[str]]:
        """Find candidate pairs using LSH banding.
        
        Args:
            signatures: Dict mapping session_id to MinHash signature
            
        Returns:
            Dict mapping session_id to set of candidate session_ids
        """
        # Create band buckets
        band_buckets = {}  # {band_hash: set of session_ids}
        
        for session_id, signature in signatures.items():
            # Divide signature into bands
            for band_idx in range(self.num_bands):
                start = band_idx * self.rows_per_band
                end = start + self.rows_per_band
                band = tuple(signature[start:end])
                
                # Hash the band
                band_hash = hash(band)
                
                # Add session to this bucket
                if band_hash not in band_buckets:
                    band_buckets[band_hash] = set()
                band_buckets[band_hash].add(session_id)
        
        # Extract candidate pairs
        candidates = {session_id: set() for session_id in signatures.keys()}
        
        for bucket_sessions in band_buckets.values():
            if len(bucket_sessions) > 1:
                # All sessions in same bucket are candidates
                for s1 in bucket_sessions:
                    for s2 in bucket_sessions:
                        if s1 != s2:
                            candidates[s1].add(s2)
        
        return candidates
    
    def cluster_sessions(self, signatures: Dict[str, List[int]], 
                        threshold: float = 0.40) -> List[Set[str]]:
        """Cluster sessions based on Jaccard similarity threshold.
        
        Args:
            signatures: Dict mapping session_id to MinHash signature
            threshold: Minimum Jaccard similarity for clustering (default 0.40)
            
        Returns:
            List of clusters (each cluster is a set of session_ids)
        """
        minhash = MinHashSignature()
        candidates = self.find_candidates(signatures)
        
        # Build similarity graph (edges = similar pairs)
        edges = set()
        for session_id, candidate_sessions in candidates.items():
            for candidate in candidate_sessions:
                # Verify similarity meets threshold
                similarity = minhash.jaccard_similarity(
                    signatures[session_id], 
                    signatures[candidate]
                )
                if similarity >= threshold:
                    edge = tuple(sorted([session_id, candidate]))
                    edges.add(edge)
        
        # Find connected components using DFS
        clusters = []
        visited = set()
        
        for session_id in signatures.keys():
            if session_id not in visited:
                cluster = self._dfs_cluster(session_id, edges, visited)
                if cluster:
                    clusters.append(cluster)
        
        return clusters
    
    def _dfs_cluster(self, session_id: str, edges: Set[Tuple[str, str]], 
                     visited: Set[str]) -> Set[str]:
        """Depth-first search to find connected component (cluster)."""
        if session_id in visited:
            return set()
        
        visited.add(session_id)
        cluster = {session_id}
        
        # Find all connected sessions
        for edge in edges:
            if session_id in edge:
                other = edge[0] if edge[1] == session_id else edge[1]
                cluster.update(self._dfs_cluster(other, edges, visited))
        
        return cluster


# ============================================================================
# Outlier Detection & Root Cause Analysis (Section 3.7)
# ============================================================================

def detect_outliers_multidimensional(
    all_features: Dict[str, SessionFeatures],
    clustered_session_ids: Set[str],
    cluster_centroids: Dict[str, List[int]] = None,
    all_signatures: Dict[str, List[int]] = None
) -> List[OutlierInfo]:
    """Detect outliers using multiple behavioral dimensions.

    Args:
        all_features: All session features
        clustered_session_ids: Sessions that are in valid clusters
        cluster_centroids: Dict mapping cluster_id to centroid signature (optional)
        all_signatures: Dict mapping session_id to MinHash signature (optional)

    Returns:
        List of outlier sessions with anomaly scores and distances to nearest centroids
    """
    # Calculate statistics for normal (clustered) sessions
    normal_features = [
        features for sid, features in all_features.items()
        if sid in clustered_session_ids
    ]
    
    if not normal_features:
        # No clusters formed, all sessions are potential outliers
        return []
    
    # Calculate baseline statistics using MAD (Median Absolute Deviation)
    durations = [f.session_duration for f in normal_features]
    event_counts = [f.event_count for f in normal_features]
    tool_counts = [f.total_tool_calls for f in normal_features]
    token_totals = [f.total_tokens for f in normal_features]
    
    baseline = {
        'duration_median': np.median(durations),
        'duration_mad': np.median(np.abs(durations - np.median(durations))),
        'event_median': np.median(event_counts),
        'event_mad': np.median(np.abs(event_counts - np.median(event_counts))),
        'tool_median': np.median(tool_counts),
        'tool_mad': np.median(np.abs(tool_counts - np.median(tool_counts))),
        'token_median': np.median(token_totals),
        'token_mad': np.median(np.abs(token_totals - np.median(token_totals)))
    }
    
    # Analyze unclustered sessions
    outliers = []
    logger.info(f"[OUTLIER DETECTION] Analyzing {len([s for s in all_features.keys() if s not in clustered_session_ids])} unclustered sessions...")

    for session_id, features in all_features.items():
        if session_id not in clustered_session_ids:
            anomaly_score, anomalies = calculate_anomaly_score(features, baseline)

            logger.info(f"[OUTLIER DETECTION] Session {session_id[:8]}... - anomaly_score: {anomaly_score:.3f} - will be marked as outlier")

            # Perform root cause analysis
            root_causes = analyze_outlier_root_causes(
                features, all_features, clustered_session_ids
            )

            severity = classify_outlier_severity(anomaly_score, root_causes)

            # Calculate distance to nearest centroid (if data available)
            distance_to_nearest = 0.0
            nearest_cluster = ""

            if cluster_centroids and all_signatures and session_id in all_signatures:
                outlier_signature = all_signatures[session_id]
                min_distance = float('inf')

                for cluster_id, centroid in cluster_centroids.items():
                    distance = calculate_jaccard_distance(outlier_signature, centroid)
                    if distance < min_distance:
                        min_distance = distance
                        nearest_cluster = cluster_id

                distance_to_nearest = min_distance

            outliers.append(OutlierInfo(
                session_id=session_id,
                anomaly_score=anomaly_score,
                severity=severity['severity'],
                distance_to_nearest_centroid=round(distance_to_nearest, 3),
                nearest_cluster_id=nearest_cluster,
                primary_causes=root_causes.get('primary_causes', []),
                tool_analysis=root_causes.get('tool_analysis', {}),
                resource_analysis=root_causes.get('resource_analysis', {}),
                temporal_analysis=root_causes.get('temporal_analysis', {}),
                recommendations=root_causes.get('recommendations', [])
            ))

    return outliers


def calculate_anomaly_score(
    features: SessionFeatures, 
    baseline: Dict
) -> Tuple[float, List[str]]:
    """Calculate multi-dimensional anomaly score.
    
    Returns:
        (anomaly_score, list_of_anomaly_descriptions)
    """
    anomaly_score = 0.0
    anomalies = []
    
    # Duration anomaly (weight: 0.3)
    duration_deviation = abs(features.session_duration - baseline['duration_median'])
    if baseline['duration_mad'] > 0:
        duration_factor = duration_deviation / baseline['duration_mad']
        if duration_factor >= 8.0:
            anomaly_score += 0.3
            anomalies.append(
                f"Duration anomaly: {features.session_duration:.1f}s vs. "
                f"typical {baseline['duration_median']:.1f}s "
                f"(deviation: {duration_factor:.1f}×)"
            )
    
    # Event count anomaly (weight: 0.2)
    event_deviation = abs(features.event_count - baseline['event_median'])
    if baseline['event_mad'] > 0:
        event_factor = event_deviation / baseline['event_mad']
        if event_factor >= 8.0:
            anomaly_score += 0.2
            anomalies.append(
                f"Activity anomaly: {features.event_count} events vs. "
                f"typical {int(baseline['event_median'])} events "
                f"(deviation: {event_factor:.1f}×)"
            )
    
    # Tool usage anomaly (weight: 0.2)
    tool_deviation = abs(features.total_tool_calls - baseline['tool_median'])
    if baseline['tool_mad'] > 0:
        tool_factor = tool_deviation / baseline['tool_mad']
        if tool_factor >= 8.0:
            anomaly_score += 0.2
            anomalies.append(
                f"Tool usage anomaly: {features.total_tool_calls} calls vs. "
                f"typical {int(baseline['tool_median'])} calls "
                f"(deviation: {tool_factor:.1f}×)"
            )
    
    # Token usage anomaly (weight: 0.3)
    token_deviation = abs(features.total_tokens - baseline['token_median'])
    if baseline['token_mad'] > 0:
        token_factor = token_deviation / baseline['token_mad']
        if token_factor >= 8.0:
            anomaly_score += 0.3
            anomalies.append(
                f"Token usage anomaly: {features.total_tokens} tokens vs. "
                f"typical {int(baseline['token_median'])} tokens "
                f"(deviation: {token_factor:.1f}×)"
            )
    
    return anomaly_score, anomalies


def analyze_outlier_root_causes(
    outlier_features: SessionFeatures,
    all_features: Dict[str, SessionFeatures],
    normal_session_ids: Set[str]
) -> Dict[str, Any]:
    """Detailed root cause analysis for outlier sessions.
    
    Returns:
        Dictionary with categorized root causes and recommendations
    """
    root_causes = {
        "primary_causes": [],
        "tool_analysis": {},
        "resource_analysis": {},
        "temporal_analysis": {},
        "recommendations": []
    }
    
    # Collect normal session features for comparison
    normal_features = [
        all_features[sid] for sid in normal_session_ids
        if sid in all_features
    ]
    
    if not normal_features:
        return root_causes
    
    # TOOL USAGE ANALYSIS
    normal_tools = set()
    for nf in normal_features:
        normal_tools.update(nf.tools_used)
    
    outlier_tools = outlier_features.tools_used
    unique_tools = outlier_tools - normal_tools
    missing_tools = normal_tools - outlier_tools
    
    if unique_tools:
        root_causes["tool_analysis"]["unique_tools"] = list(unique_tools)
        root_causes["primary_causes"].append(
            f"Uses {len(unique_tools)} unique tool(s) not seen in normal sessions: "
            f"{', '.join(list(unique_tools)[:3])}"
        )
        root_causes["recommendations"].append(
            "Investigate why these unique tools were invoked. "
            "Consider if this represents a new use case requiring separate agent."
        )
    
    if len(missing_tools) > len(normal_tools) / 2:
        root_causes["tool_analysis"]["missing_common_tools"] = list(missing_tools)[:3]
        root_causes["primary_causes"].append(
            f"Missing {len(missing_tools)} commonly-used tools"
        )
    
    # SEQUENCE ANALYSIS
    outlier_seq_length = len(outlier_features.tool_sequences)
    normal_seq_lengths = [len(nf.tool_sequences) for nf in normal_features]
    median_seq_length = np.median(normal_seq_lengths) if normal_seq_lengths else 0
    
    if median_seq_length > 0:
        if outlier_seq_length < median_seq_length / 3:
            root_causes["primary_causes"].append(
                f"Very short workflow: {outlier_seq_length} steps vs. typical {median_seq_length:.0f}"
            )
            root_causes["recommendations"].append(
                "Session terminated early or represents minimal interaction. "
                "Check for errors or edge cases."
            )
        elif outlier_seq_length > median_seq_length * 3:
            root_causes["primary_causes"].append(
                f"Very long workflow: {outlier_seq_length} steps vs. typical {median_seq_length:.0f}"
            )
            root_causes["recommendations"].append(
                "Excessive tool chaining detected. "
                "Review agent logic for potential loops or inefficiencies."
            )
    
    # RESOURCE CONSUMPTION ANALYSIS
    normal_tokens = [nf.total_tokens for nf in normal_features]
    median_tokens = np.median(normal_tokens) if normal_tokens else 0
    
    if median_tokens > 0 and outlier_features.total_tokens > median_tokens * 3:
        root_causes["resource_analysis"]["token_usage"] = "excessive"
        root_causes["primary_causes"].append(
            f"Excessive token usage: {outlier_features.total_tokens} vs. typical {median_tokens:.0f}"
        )
        root_causes["recommendations"].append(
            "High token consumption suggests verbose prompts or responses. "
            "Consider optimizing prompt templates."
        )
    
    # LLM MODEL ANALYSIS
    normal_models = set()
    for nf in normal_features:
        normal_models.update(nf.llm_models)
    
    if outlier_features.llm_models - normal_models:
        root_causes["primary_causes"].append(
            f"Uses different LLM model(s): {outlier_features.llm_models}"
        )
        root_causes["recommendations"].append(
            "Model mismatch detected. Ensure consistent model configuration."
        )
    
    # TEMPORAL PATTERN ANALYSIS
    normal_durations = [nf.session_duration for nf in normal_features]
    median_duration = np.median(normal_durations) if normal_durations else 0
    
    if median_duration > 0 and outlier_features.session_duration > median_duration * 5:
        root_causes["temporal_analysis"]["duration"] = "excessive"
        root_causes["primary_causes"].append(
            f"Very long session: {outlier_features.session_duration:.1f}s vs. typical {median_duration:.1f}s"
        )
        root_causes["recommendations"].append(
            "Extended session duration may indicate hanging tools, retries, or complex reasoning. "
            "Review execution logs."
        )
    
    # If no specific causes found
    if not root_causes["primary_causes"]:
        root_causes["primary_causes"].append(
            "Session behavior pattern does not match any established cluster"
        )
        root_causes["recommendations"].append(
            "This session represents a unique combination of factors. "
            "Review session details manually to understand the context."
        )
    
    return root_causes


def classify_outlier_severity(anomaly_score: float, root_causes: Dict) -> Dict[str, Any]:
    """Classify outlier severity for developer prioritization.
    
    Returns:
        {
            'severity': 'low'|'medium'|'high'|'critical',
            'action': 'monitor'|'investigate'|'fix_required',
            'priority': int (1-4)
        }
    """
    num_causes = len(root_causes.get('primary_causes', []))
    
    if anomaly_score < 0.3 and num_causes <= 1:
        return {
            'severity': 'low',
            'action': 'monitor',
            'priority': 4,
            'description': 'Minor deviation, likely within normal operational variance'
        }
    elif anomaly_score < 0.5 or num_causes <= 2:
        return {
            'severity': 'medium',
            'action': 'investigate',
            'priority': 3,
            'description': 'Notable deviation requiring investigation'
        }
    elif anomaly_score < 0.7 or num_causes <= 3:
        return {
            'severity': 'high',
            'action': 'fix_required',
            'priority': 2,
            'description': 'Significant behavioral anomaly requiring fixes'
        }
    else:
        return {
            'severity': 'critical',
            'action': 'fix_required',
            'priority': 1,
            'description': 'Severe behavioral deviation, agent may be unstable'
        }


# ============================================================================
# Centroid Distance Calculations
# ============================================================================

def calculate_cluster_centroid(
    cluster_session_ids: Set[str],
    all_signatures: Dict[str, List[int]]
) -> List[int]:
    """Calculate cluster centroid using mode of MinHash signatures.

    Args:
        cluster_session_ids: Set of session IDs in the cluster
        all_signatures: Dict mapping session_id to MinHash signature

    Returns:
        List of 512 integers representing the centroid signature
    """
    centroid = []
    for i in range(512):  # For each hash position
        values = [all_signatures[sid][i] for sid in cluster_session_ids if sid in all_signatures]
        if not values:
            centroid.append(0)
            continue
        from collections import Counter
        most_common = Counter(values).most_common(1)[0][0]
        centroid.append(most_common)
    return centroid


def calculate_jaccard_distance(sig1: List[int], sig2: List[int]) -> float:
    """Calculate Jaccard distance between two MinHash signatures.

    Args:
        sig1, sig2: MinHash signatures (512-dim vectors)

    Returns:
        Jaccard distance [0.0, 1.0] where 0=identical, 1=completely different
    """
    if len(sig1) != len(sig2):
        return 1.0

    matches = sum(1 for a, b in zip(sig1, sig2) if a == b)
    similarity = matches / len(sig1)
    return 1.0 - similarity


def calculate_centroid_distances(
    clusters: List[Set[str]],
    cluster_ids: List[str],
    all_signatures: Dict[str, List[int]]
) -> List[CentroidDistance]:
    """Calculate pairwise distances between all cluster centroids.

    Args:
        clusters: List of cluster sets (each set contains session IDs)
        cluster_ids: Corresponding cluster IDs
        all_signatures: Dict mapping session_id to MinHash signature

    Returns:
        List of CentroidDistance objects
    """
    # Step 1: Calculate centroid for each cluster
    centroids = {}
    for cluster, cluster_id in zip(clusters, cluster_ids):
        centroid = calculate_cluster_centroid(cluster, all_signatures)
        centroids[cluster_id] = centroid

    # Step 2: Calculate pairwise distances
    distances = []
    cluster_id_list = list(centroids.keys())

    for i in range(len(cluster_id_list)):
        for j in range(i + 1, len(cluster_id_list)):
            cluster1_id = cluster_id_list[i]
            cluster2_id = cluster_id_list[j]

            centroid1 = centroids[cluster1_id]
            centroid2 = centroids[cluster2_id]

            # Calculate Jaccard distance
            distance = calculate_jaccard_distance(centroid1, centroid2)
            similarity = 1.0 - distance

            distances.append(CentroidDistance(
                from_cluster=cluster1_id,
                to_cluster=cluster2_id,
                distance=round(distance, 3),
                similarity_score=round(similarity, 3)
            ))

    return distances


# ============================================================================
# Percentile Calculation for Adaptive Binning
# ============================================================================

def _percentiles_differ_significantly(
    old_percentiles: Dict[str, Dict[str, float]], 
    new_percentiles: Dict[str, Dict[str, float]],
    threshold: float = 0.10
) -> bool:
    """Check if new percentiles differ significantly from cached ones.
    
    Args:
        old_percentiles: Previously cached percentiles
        new_percentiles: Newly calculated percentiles
        threshold: Relative difference threshold (default 10%)
        
    Returns:
        True if percentiles differ by more than threshold, False otherwise
    """
    if not old_percentiles or not new_percentiles:
        return True
    
    # Check each feature's percentiles
    for feature_name in new_percentiles:
        if feature_name not in old_percentiles:
            return True
        
        old_vals = old_percentiles[feature_name]
        new_vals = new_percentiles[feature_name]
        
        # Compare p50 (median) as the key stability indicator
        if "p50" in old_vals and "p50" in new_vals:
            old_p50 = old_vals["p50"]
            new_p50 = new_vals["p50"]
            
            # Avoid division by zero
            if old_p50 == 0:
                if new_p50 > 0:
                    return True
                continue
            
            relative_change = abs(new_p50 - old_p50) / old_p50
            if relative_change > threshold:
                logger.info(f"[PERCENTILE STABILITY] Feature '{feature_name}' p50 changed by {relative_change:.1%} "
                           f"(from {old_p50:.1f} to {new_p50:.1f})")
                return True
    
    return False


def _calculate_feature_percentiles(all_features: Dict[str, SessionFeatures]) -> Dict[str, Dict[str, float]]:
    """Calculate percentiles for numerical features to enable adaptive binning.
    
    Args:
        all_features: Dictionary mapping session_id to SessionFeatures
        
    Returns:
        Dictionary mapping feature names to percentile values (p25, p50, p75)
    """
    if not all_features:
        return {}
    
    # Collect all values for each feature
    durations = [f.session_duration for f in all_features.values()]
    tool_calls = [f.total_tool_calls for f in all_features.values()]
    llm_requests = [f.llm_request_count for f in all_features.values()]
    tokens = [f.total_tokens for f in all_features.values()]
    event_counts = [f.event_count for f in all_features.values()]
    avg_intervals = [f.avg_event_interval for f in all_features.values() if f.avg_event_interval > 0]
    
    percentiles = {}
    
    # Calculate 25th, 50th (median), 75th percentiles for each feature
    if durations:
        percentiles["session_duration"] = {
            "p25": float(np.percentile(durations, 25)),
            "p50": float(np.percentile(durations, 50)),
            "p75": float(np.percentile(durations, 75))
        }
    
    if tool_calls:
        percentiles["total_tool_calls"] = {
            "p25": float(np.percentile(tool_calls, 25)),
            "p50": float(np.percentile(tool_calls, 50)),
            "p75": float(np.percentile(tool_calls, 75))
        }
    
    if llm_requests:
        percentiles["llm_request_count"] = {
            "p25": float(np.percentile(llm_requests, 25)),
            "p50": float(np.percentile(llm_requests, 50)),
            "p75": float(np.percentile(llm_requests, 75))
        }
    
    if tokens:
        percentiles["total_tokens"] = {
            "p25": float(np.percentile(tokens, 25)),
            "p50": float(np.percentile(tokens, 50)),
            "p75": float(np.percentile(tokens, 75))
        }
    
    if event_counts:
        percentiles["event_count"] = {
            "p25": float(np.percentile(event_counts, 25)),
            "p50": float(np.percentile(event_counts, 50)),
            "p75": float(np.percentile(event_counts, 75))
        }
    
    if avg_intervals:
        percentiles["avg_event_interval"] = {
            "p25": float(np.percentile(avg_intervals, 25)),
            "p50": float(np.percentile(avg_intervals, 50)),
            "p75": float(np.percentile(avg_intervals, 75))
        }
    
    return percentiles


# ============================================================================
# Main Analysis Function (Section 3.6)
# ============================================================================

def analyze_agent_behavior(
    sessions: List[SessionData], 
    cached_percentiles: Optional[Dict[str, Dict[str, float]]] = None
) -> Tuple[BehavioralAnalysisResult, Optional[Dict[str, Dict[str, float]]]]:
    """Main entry point for behavioral analysis.
    
    SIMPLIFIED APPROACH - Signatures are computed ONCE per session and stored:
    1. Uses stored signatures for sessions that already have them
    2. Only computes signatures for newly-completed sessions without signatures
    3. Uses frozen percentiles after initial calculation (no recalculation)
    
    Args:
        sessions: List of session data to analyze
        cached_percentiles: Frozen percentiles from first calculation
        
    Returns:
        Tuple of (BehavioralAnalysisResult, frozen_percentiles)
    """
    # Filter to only completed sessions
    total_sessions = len(sessions)
    completed_sessions = [s for s in sessions if s.is_completed]
    active_sessions = total_sessions - len(completed_sessions)
    
    logger.info(f"[BEHAVIORAL ANALYSIS] Total sessions: {total_sessions}, "
                f"Completed: {len(completed_sessions)}, Active: {active_sessions}")
    
    if len(completed_sessions) < 2:
        result = BehavioralAnalysisResult(
            total_sessions=len(completed_sessions),
            num_clusters=0,
            num_outliers=0,
            stability_score=0.0,
            predictability_score=0.0,
            cluster_diversity=0.0,
            clusters=[],
            outliers=[],
            interpretation=f"Insufficient completed sessions for analysis (have {len(completed_sessions)}, need 2+). "
                          f"{active_sessions} sessions are still active.",
            error="Insufficient completed sessions"
        )
        return (result, cached_percentiles)
    
    # Step 1: Extract features and use/compute signatures
    # Key optimization: Only compute signatures for sessions that don't have them
    all_features = {}
    all_signatures = {}
    sessions_needing_signatures = []
    
    for session in completed_sessions:
        # Always need features for clustering
        if session.behavioral_features is None:
            features = extract_session_features(session)
            session.behavioral_features = features  # Cache on session
        else:
            features = session.behavioral_features
        
        all_features[session.session_id] = features
        
        # Use stored signature if available, otherwise mark for computation
        if session.behavioral_signature is not None:
            all_signatures[session.session_id] = session.behavioral_signature
        else:
            sessions_needing_signatures.append(session)
    
    # Step 2: Compute signatures ONLY for new sessions
    if sessions_needing_signatures:
        # Calculate or use frozen percentiles
        if cached_percentiles is None:
            # First time: calculate percentiles and freeze them
            percentiles = _calculate_feature_percentiles(all_features)
            logger.info(f"[SIGNATURE] Calculated and FROZE percentiles from {len(all_features)} sessions")
        else:
            # Use frozen percentiles for consistency
            percentiles = cached_percentiles
        
        # Compute signatures for new sessions only
        minhash = MinHashSignature(num_hashes=512)
        for session in sessions_needing_signatures:
            features = all_features[session.session_id]
            shingles = features_to_shingles(features, percentiles)
            signature = minhash.compute_signature(shingles)
            
            # Store signature on session (NEVER recalculate)
            session.behavioral_signature = signature
            all_signatures[session.session_id] = signature
        
        logger.info(f"[SIGNATURE] Computed signatures for {len(sessions_needing_signatures)} new sessions, "
                   f"reused {len(completed_sessions) - len(sessions_needing_signatures)} existing")
    else:
        # All sessions already have signatures
        percentiles = cached_percentiles  # Keep using frozen percentiles
        logger.info(f"[SIGNATURE] Reused ALL {len(completed_sessions)} existing signatures (no computation needed)")
    
    # Step 2: Cluster using LSH
    lsh = LSHClustering(num_bands=64, rows_per_band=8)
    clusters = lsh.cluster_sessions(all_signatures, threshold=0.40)

    # Step 3: Categorize clusters by confidence level
    # Normal confidence: 3+ sessions (statistically more reliable)
    # Low confidence: 2 sessions (pattern exists but needs validation)
    # Clusters with 1 session are ignored (treated as outliers)
    normal_clusters = [c for c in clusters if len(c) >= 3]
    low_confidence_clusters = [c for c in clusters if len(c) == 2]
    valid_clusters = normal_clusters + low_confidence_clusters

    # DEBUG: Log clustering results
    logger.info(f"[BEHAVIORAL ANALYSIS] Completed sessions analyzed: {len(completed_sessions)}")
    logger.info(f"[BEHAVIORAL ANALYSIS] Raw clusters from LSH: {len(clusters)}")
    logger.info(f"[BEHAVIORAL ANALYSIS] Normal clusters (≥3): {len(normal_clusters)}")
    for i, cluster in enumerate(normal_clusters):
        logger.info(f"  - Normal cluster {i+1}: {len(cluster)} sessions - {list(cluster)[:3]}...")
    logger.info(f"[BEHAVIORAL ANALYSIS] Low-confidence clusters (=2): {len(low_confidence_clusters)}")
    for i, cluster in enumerate(low_confidence_clusters):
        logger.info(f"  - Low-confidence cluster {i+1}: {len(cluster)} sessions - {list(cluster)}")

    # Step 4: Identify outliers (sessions not in any cluster)
    clustered_session_ids = set().union(*valid_clusters) if valid_clusters else set()
    outlier_session_ids = [
        sid for sid in all_signatures.keys()
        if sid not in clustered_session_ids
    ]

    # DEBUG: Log unclustered sessions
    logger.info(f"[BEHAVIORAL ANALYSIS] Clustered sessions: {len(clustered_session_ids)}")
    logger.info(f"[BEHAVIORAL ANALYSIS] Unclustered sessions: {len(outlier_session_ids)}")
    if outlier_session_ids:
        logger.info(f"[BEHAVIORAL ANALYSIS] Unclustered session IDs: {outlier_session_ids}")

    # Step 4.5: Calculate cluster centroids and distances
    cluster_ids = [f"cluster_{i+1}" for i in range(len(valid_clusters))]
    cluster_centroids = {}

    for i, cluster in enumerate(valid_clusters):
        cluster_id = cluster_ids[i]
        centroid = calculate_cluster_centroid(cluster, all_signatures)
        cluster_centroids[cluster_id] = centroid

    # Calculate inter-cluster distances
    centroid_distances = []
    if len(valid_clusters) > 1:
        centroid_distances = calculate_centroid_distances(
            valid_clusters, cluster_ids, all_signatures
        )

    # Step 5: Analyze outlier root causes with centroid distances
    outliers_with_causes = detect_outliers_multidimensional(
        all_features, clustered_session_ids, cluster_centroids, all_signatures
    )

    # Step 6: Calculate cluster characteristics
    cluster_summaries = []
    for i, cluster in enumerate(valid_clusters):
        summary = calculate_cluster_characteristics(cluster, all_features)
        cluster_size = len(cluster)
        cluster_summaries.append(ClusterInfo(
            cluster_id=cluster_ids[i],
            size=cluster_size,
            percentage=round((cluster_size / len(sessions)) * 100, 1),
            session_ids=list(cluster),
            characteristics=summary,
            insights=generate_cluster_insights(i, cluster_size, len(sessions), summary),
            confidence="low" if cluster_size == 2 else "normal"
        ))
    
    # Step 7: Calculate metrics
    # Metrics are calculated ONLY against completed sessions that have been analyzed
    # This ensures stability/predictability don't drop when new active sessions arrive
    # Stability score only considers normal-confidence clusters (≥3 sessions)
    # Low-confidence clusters (2 sessions) are too small to be reliable stability indicators
    stability_score = calculate_stability_score(normal_clusters, len(completed_sessions))
    predictability_score = calculate_predictability_score(len(outlier_session_ids), len(completed_sessions))
    cluster_diversity = calculate_cluster_diversity(len(valid_clusters), len(completed_sessions))
    
    # Step 8: Generate interpretation
    interpretation = generate_behavioral_interpretation(
        stability_score, predictability_score, len(valid_clusters), len(outlier_session_ids)
    )

    # DEBUG: Final summary
    sessions_in_clusters = len(clustered_session_ids)
    sessions_as_outliers = len(outliers_with_causes)
    sessions_unaccounted = len(completed_sessions) - sessions_in_clusters - sessions_as_outliers

    logger.info(f"[BEHAVIORAL ANALYSIS] === FINAL SUMMARY ===")
    logger.info(f"  Total sessions analyzed (completed): {len(completed_sessions)}")
    logger.info(f"  Active sessions (not analyzed): {active_sessions}")
    logger.info(f"  Sessions in clusters: {sessions_in_clusters}")
    logger.info(f"  Sessions marked as outliers: {sessions_as_outliers}")
    logger.info(f"  Sessions UNACCOUNTED FOR: {sessions_unaccounted}")
    if sessions_unaccounted > 0:
        logger.error(f"  ⚠️  {sessions_unaccounted} sessions are missing from the report!")

    result = BehavioralAnalysisResult(
        total_sessions=len(completed_sessions),  # Only count analyzed sessions
        num_clusters=len(valid_clusters),
        num_outliers=len(outlier_session_ids),
        stability_score=stability_score,
        predictability_score=predictability_score,
        cluster_diversity=cluster_diversity,
        clusters=cluster_summaries,
        outliers=outliers_with_causes,
        centroid_distances=centroid_distances,
        interpretation=interpretation
    )
    
    # Return both the result and the percentiles used (for caching)
    return (result, percentiles)


def calculate_cluster_characteristics(
    cluster: Set[str],
    all_features: Dict[str, SessionFeatures]
) -> ClusterCharacteristics:
    """Calculate statistical characteristics for a cluster."""
    cluster_features = [all_features[sid] for sid in cluster if sid in all_features]
    
    if not cluster_features:
        return ClusterCharacteristics(
            typical_duration_sec=0,
            typical_duration_range=[0, 0],
            typical_tool_calls=0,
            typical_tool_calls_range=[0, 0],
            typical_tokens=0,
            typical_tokens_range=[0, 0],
            common_tools=[],
            common_tool_sequence="",
            common_models=[]
        )
    
    # Duration statistics
    durations = [f.session_duration for f in cluster_features]
    duration_median = np.median(durations)
    duration_range = [float(np.min(durations)), float(np.max(durations))]
    
    # Tool call statistics
    tool_calls = [f.total_tool_calls for f in cluster_features]
    tool_median = int(np.median(tool_calls))
    tool_range = [int(np.min(tool_calls)), int(np.max(tool_calls))]
    
    # Token statistics
    tokens = [f.total_tokens for f in cluster_features]
    token_median = int(np.median(tokens))
    token_range = [int(np.min(tokens)), int(np.max(tokens))]
    
    # Common tools (tools used in >50% of cluster sessions)
    tool_counts = defaultdict(int)
    for f in cluster_features:
        for tool in f.tools_used:
            tool_counts[tool] += 1
    
    threshold = len(cluster_features) * 0.5
    common_tools = [tool for tool, count in tool_counts.items() if count >= threshold]
    
    # Common tool sequence (most frequent)
    sequence_counts = defaultdict(int)
    for f in cluster_features:
        if f.tool_sequences:
            seq_str = " → ".join(f.tool_sequences[:5])  # First 5 tools
            sequence_counts[seq_str] += 1
    
    common_sequence = ""
    if sequence_counts:
        common_sequence = max(sequence_counts.items(), key=lambda x: x[1])[0]
    
    # Common models
    model_counts = defaultdict(int)
    for f in cluster_features:
        for model in f.llm_models:
            model_counts[model] += 1
    
    common_models = [model for model, count in sorted(
        model_counts.items(), key=lambda x: x[1], reverse=True
    )][:3]
    
    return ClusterCharacteristics(
        typical_duration_sec=round(duration_median, 1),
        typical_duration_range=[round(d, 1) for d in duration_range],
        typical_tool_calls=tool_median,
        typical_tool_calls_range=tool_range,
        typical_tokens=token_median,
        typical_tokens_range=token_range,
        common_tools=common_tools,
        common_tool_sequence=common_sequence,
        common_models=common_models
    )


def generate_cluster_insights(
    cluster_idx: int,
    cluster_size: int,
    total_sessions: int,
    characteristics: ClusterCharacteristics
) -> str:
    """Generate human-readable insights for a cluster."""
    percentage = (cluster_size / total_sessions) * 100

    # Low-confidence cluster (only 2 sessions)
    if cluster_size == 2:
        return f"Low-confidence pattern ({percentage:.0f}% of sessions) - needs more data to validate"

    # Normal confidence clusters (3+ sessions)
    if cluster_idx == 0 and percentage > 70:
        return f"Largest cluster representing dominant behavior pattern ({percentage:.0f}% of sessions)"
    elif percentage < 10:
        return f"Small cluster representing edge case or specialized workflow ({percentage:.0f}% of sessions)"
    else:
        return f"Secondary behavior pattern ({percentage:.0f}% of sessions)"


def calculate_stability_score(clusters: List[Set[str]], total_sessions: int) -> float:
    """Calculate stability score (largest cluster % of total)."""
    if not clusters or total_sessions == 0:
        return 0.0
    
    largest_cluster_size = max(len(c) for c in clusters)
    return largest_cluster_size / total_sessions


def calculate_predictability_score(num_outliers: int, total_sessions: int) -> float:
    """Calculate predictability score (1.0 - outlier rate)."""
    if total_sessions == 0:
        return 0.0
    
    return 1.0 - (num_outliers / total_sessions)


def calculate_cluster_diversity(num_clusters: int, total_sessions: int) -> float:
    """Calculate cluster diversity (normalized by session count)."""
    if total_sessions == 0:
        return 0.0
    
    return num_clusters / math.sqrt(total_sessions)


def generate_behavioral_interpretation(
    stability_score: float,
    predictability_score: float,
    num_clusters: int,
    num_outliers: int
) -> str:
    """Generate human-readable interpretation of behavioral analysis."""
    stability_level = "Highly stable" if stability_score >= 0.8 else \
                     "Moderately stable" if stability_score >= 0.6 else "Unstable"
    
    predictability_level = "highly predictable" if predictability_score >= 0.9 else \
                          "moderately predictable" if predictability_score >= 0.7 else "unpredictable"
    
    if num_clusters == 0:
        return "No clear behavioral patterns detected - agent behavior is highly variable"
    elif num_clusters == 1:
        return f"{stability_level} agent with {predictability_level} behavior - single dominant pattern"
    else:
        return f"{stability_level} agent with {predictability_level} behavior - {num_clusters} distinct behavioral modes detected"

