/**
 * Centralized Page Icons
 *
 * Single source of truth for all page and navigation icons.
 * These icons are used in:
 * - App.tsx sidebar navigation
 * - PageHeader components in individual pages
 * - Section titles
 *
 * IMPORTANT: When adding a new page, add its icon here and import from this file.
 * Do NOT import lucide-react icons directly for page/section headers.
 */
import {
  BarChart3,
  FileText,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Monitor,
  Plug,
  Shield,
  Target,
} from 'lucide-react';

// ============================================================================
// Navigation Icons (Sidebar)
// ============================================================================

/** Start Here / Home page */
export const HomeIcon = Home;

/** Overview page */
export const OverviewIcon = BarChart3;

/** System Prompts / Portfolio page */
export const SystemPromptsIcon = LayoutDashboard;

/** Sessions list page */
export const SessionsIcon = History;

/** Recommendations page */
export const RecommendationsIcon = Lightbulb;

// ============================================================================
// Security Checks Icons (Sidebar Timeline)
// ============================================================================

/** Dev Connection / IDE Connection page */
export const DevConnectionIcon = Monitor;

/** Static Analysis page */
export const StaticAnalysisIcon = Shield;

/** Dynamic Analysis page */
export const DynamicAnalysisIcon = Shield;

/** Production (locked) */
export const ProductionIcon = Lock;

// ============================================================================
// Reports Section Icons
// ============================================================================

/** Reports page */
export const ReportsIcon = FileText;

/** Attack Surface page */
export const AttackSurfaceIcon = Target;

// ============================================================================
// Footer Icons
// ============================================================================

/** Connect / How to Connect page */
export const ConnectIcon = Plug;
