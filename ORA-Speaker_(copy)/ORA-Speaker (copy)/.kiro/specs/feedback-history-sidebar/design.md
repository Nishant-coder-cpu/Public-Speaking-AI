# Design Document

## Overview

This design document outlines the implementation of a feedback history feature in the dashboard sidebar. Users will be able to view their past video analysis sessions as a scrollable list in the sidebar, click on any item to view the full feedback and video, and seamlessly navigate between different feedback sessions. The feature integrates with the existing Supabase database schema and maintains the current glassmorphic design aesthetic.

### Design Goals

1. Provide quick access to past feedback sessions without cluttering the main content area
2. Enable seamless navigation between different feedback sessions
3. Maintain the existing glassmorphic design aesthetic and animations
4. Optimize performance with efficient data fetching and caching
5. Ensure responsive behavior across all device sizes
6. Integrate smoothly with existing dashboard functionality

## Architecture

### Component Structure

```
Dashboard (page.tsx)
├── DashboardLayout
│   └── Sidebar Component (modified)
│       ├── Logo/Brand Section
│       ├── Navigation Menu
│       │   └── My Videos
│       ├── Feedback History Section (NEW)
│       │   ├── Section Header
│       │   └── FeedbackHistoryList (NEW)
│       │       └── FeedbackHistoryItem[] (NEW)
│       └── User Section
│
└── Main Content Area
    ├── MainHeader
    └── Content Section
        ├── EmptyState (conditional)
        ├── UploadBox (conditional)
        ├── VideoPreview (conditional)
        └── FeedbackCard (conditional - now also shows historical feedback)
```

### Data Flow

```
1. Dashboard loads → Fetch user's feedback history from Supabase
2. Feedback history displayed in sidebar as list items
3. User clicks feedback item → Load feedback details and video preview
4. Main content area updates to show selected feedback
5. New feedback generated → Automatically added to sidebar list
```

### State Management

The dashboard will manage the following additional state:

```typescript
interface DashboardState {
  // Existing state...
  uploadedVideo: { path: string; url: string } | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  feedback: string | null;
  error: string | null;
  showUploadBox: boolean;
  
  // New state for feedback history
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  isLoadingHistory: boolean;
  historyError: string | null;
}
```

## Components and Interfaces

### 1. FeedbackHistoryList Component

**New Component**: `components/FeedbackHistoryList.tsx`

```typescript
interface FeedbackHistoryListProps {
  feedbackSessions: FeedbackSession[];
  selectedId: string | null;
  onSelectFeedback: (session: FeedbackSession) => void;
  isLoading: boolean;
}

interface FeedbackSession {
  id: string;
  user_id: string;
  video_path: string;
  feedback_text: string | null;
  created_at: string;
}
```

**Responsibilities**:
- Display list of feedback sessions in reverse chronological order
- Highlight currently selected feedback item
- Handle click events to load feedback details
- Show loading skeleton when fetching data
- Display empty state when no feedback exists

**Styling**:
- Scrollable container with max height
- Glassmorphic cards for each item
- Smooth hover and active states
- Consistent spacing and typography

**Features**:
- Display up to 10 most recent sessions
- Truncate long video filenames
- Show relative dates (e.g., "2 days ago")
- Video icon for each item
- Blue accent for selected item

### 2. FeedbackHistoryItem Component

**New Component**: `components/FeedbackHistoryItem.tsx`

```typescript
interface FeedbackHistoryItemProps {
  session: FeedbackSession;
  isSelected: boolean;
  onClick: () => void;
}
```

**Responsibilities**:
- Render individual feedback session item
- Display video filename (truncated to 25 chars)
- Display relative date
- Show video icon
- Handle click interaction
- Provide visual feedback for hover and selected states

**Styling**:
- Glassmorphic card design matching sidebar aesthetic
- Background: `bg-white/10` (normal), `bg-white/20` (hover), `bg-blue-500/20` (selected)
- Border: `border-white/20` (normal), `border-blue-400/50` (selected)
- Padding: `p-3`
- Rounded corners: `rounded-xl`
- Smooth transitions for all state changes

**Layout**:
```
┌─────────────────────────────┐
│ 🎥  Video filename...       │
│     2 days ago              │
└─────────────────────────────┘
```

### 3. Modified Sidebar Component

**Updated Component**: `components/Sidebar.tsx`

**New Props**:
```typescript
interface SidebarProps {
  userEmail: string | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  // New props
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  onSelectFeedback: (session: FeedbackSession) => void;
  isLoadingHistory: boolean;
}
```

**Changes**:
- Add "Recent Feedback" section between navigation and user section
- Integrate FeedbackHistoryList component
- Make feedback section scrollable while keeping header/footer fixed
- Add conditional rendering (only show when feedbackHistory.length > 0)

**Layout Structure**:
```
┌─────────────────────┐
│ Logo + Close Button │ ← Fixed
├─────────────────────┤
│ My Videos           │ ← Fixed
├─────────────────────┤
│ Recent Feedback     │ ← Fixed header
│ ┌─────────────────┐ │
│ │ Feedback Item 1 │ │
│ │ Feedback Item 2 │ │ ← Scrollable
│ │ Feedback Item 3 │ │
│ └─────────────────┘ │
├─────────────────────┤
│ User Email          │ ← Fixed
│ Sign Out            │
└─────────────────────┘
```

### 4. Modified Dashboard Page

**Updated Component**: `app/dashboard/page.tsx`

**New Functions**:

```typescript
// Fetch feedback history on mount
const fetchFeedbackHistory = async () => {
  if (!userId) return;
  
  setState(prev => ({ ...prev, isLoadingHistory: true }));
  
  try {
    const { data, error } = await supabase
      .from('feedback_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    setState(prev => ({
      ...prev,
      feedbackHistory: data || [],
      isLoadingHistory: false,
      historyError: null,
    }));
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    setState(prev => ({
      ...prev,
      isLoadingHistory: false,
      historyError: 'Failed to load feedback history',
    }));
  }
};

// Handle feedback selection from sidebar
const handleSelectFeedback = async (session: FeedbackSession) => {
  setState(prev => ({
    ...prev,
    selectedFeedbackId: session.id,
    feedback: session.feedback_text,
    uploadedVideo: null, // Clear current upload
    showUploadBox: false, // Hide upload box
  }));
  
  // Generate pre-signed URL for the video
  try {
    const response = await fetch('/api/preview-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPath: session.video_path }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      setState(prev => ({
        ...prev,
        uploadedVideo: {
          path: session.video_path,
          url: data.url,
        },
      }));
    }
  } catch (error) {
    console.error('Error loading video preview:', error);
    setState(prev => ({
      ...prev,
      error: 'Failed to load video preview',
    }));
  }
  
  // Close mobile sidebar after selection
  if (window.innerWidth < 1024) {
    // Trigger sidebar close if needed
  }
};

// Update feedback history after new analysis
const handleAnalyzeVideo = async () => {
  // ... existing analysis logic ...
  
  // After successful analysis, refresh feedback history
  await fetchFeedbackHistory();
};
```

**Changes**:
- Add `useEffect` to fetch feedback history on mount
- Pass feedback history props to Sidebar
- Implement `handleSelectFeedback` function
- Update `handleAnalyzeVideo` to refresh history after new feedback
- Handle state transitions between upload mode and view mode

## Data Models

### Existing FeedbackSession Interface

Already defined in `lib/types.ts`:

```typescript
export interface FeedbackSession {
  id: string;
  user_id: string;
  video_path: string;
  feedback_text: string | null;
  created_at: string;
}
```

### Extended Dashboard State

```typescript
interface DashboardState {
  // Existing fields
  uploadedVideo: { path: string; url: string } | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  feedback: string | null;
  error: string | null;
  showUploadBox: boolean;
  
  // New fields for feedback history
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  isLoadingHistory: boolean;
  historyError: string | null;
}
```

## Error Handling

### Feedback History Loading Errors

- **Network errors**: Display error message in sidebar, provide retry button
- **Empty state**: Show "No feedback yet" message when history is empty
- **Database errors**: Log error, show user-friendly message

### Video Preview Loading Errors

- **S3 URL generation fails**: Display error message, allow retry
- **Video not found**: Show placeholder with error message
- **Expired pre-signed URL**: Automatically regenerate URL

### State Management Errors

- **Invalid feedback selection**: Gracefully handle and log error
- **Concurrent state updates**: Use functional setState to avoid race conditions

## Testing Strategy

### Unit Tests

1. **FeedbackHistoryList Component**
   - Renders list of feedback sessions
   - Displays loading skeleton when isLoading is true
   - Shows empty state when no sessions
   - Calls onSelectFeedback when item clicked
   - Highlights selected item correctly

2. **FeedbackHistoryItem Component**
   - Renders session data correctly
   - Truncates long filenames
   - Displays relative dates
   - Shows correct styling for selected state
   - Handles click events

3. **Sidebar Component**
   - Renders feedback history section when sessions exist
   - Hides feedback section when no sessions
   - Passes correct props to FeedbackHistoryList
   - Maintains scrollable behavior

### Integration Tests

1. **Feedback History Flow**
   - Dashboard loads and fetches feedback history
   - Feedback items display in sidebar
   - Clicking feedback item loads video and feedback
   - New feedback analysis updates sidebar list
   - Selected item highlights correctly

2. **State Management**
   - Switching between upload mode and view mode
   - Clearing selection when uploading new video
   - Maintaining selection across re-renders

3. **Responsive Behavior**
   - Sidebar closes on mobile after selection
   - Feedback list scrolls properly
   - Touch targets are adequate on mobile

### API Integration Tests

1. **Supabase Queries**
   - Fetch feedback history with correct filters
   - Order by created_at descending
   - Limit to 10 results
   - Handle RLS policies correctly

2. **S3 Pre-signed URLs**
   - Generate valid URLs for historical videos
   - Handle expired URLs gracefully
   - Regenerate URLs when needed

## Design System

### Color Palette

Maintaining existing glassmorphic design:

**Feedback History Items**:
- Normal: `bg-white/10 border-white/20`
- Hover: `bg-white/15 border-white/25`
- Selected: `bg-blue-500/20 border-blue-400/50`
- Text: `text-white` (primary), `text-slate-300` (secondary)

### Typography

**Feedback History Section**:
- Section header: `text-sm font-semibold text-slate-300 uppercase tracking-wide`
- Video filename: `text-sm font-medium text-white`
- Date: `text-xs text-slate-400`

### Spacing

**Feedback History Section**:
- Section padding: `px-4 py-3`
- Item spacing: `space-y-2`
- Item padding: `p-3`
- Icon-text gap: `gap-3`

### Icons

**New Icons** (from lucide-react):
- `Clock`: For "Recent Feedback" section header
- `Video`: For each feedback item

### Animations

**Feedback History Animations**:

1. **List Entry Animation**:
```typescript
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};
```

2. **Item Hover**:
```typescript
whileHover={!prefersReducedMotion ? {
  x: 4,
  transition: { duration: 0.2 }
} : {}}
```

3. **Item Selection**:
```typescript
animate={{
  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
  borderColor: isSelected ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255, 255, 255, 0.2)',
}}
transition={{ duration: 0.2 }}
```

4. **Loading Skeleton**:
```typescript
<motion.div
  className="h-16 bg-white/5 rounded-xl"
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ duration: 1.5, repeat: Infinity }}
/>
```

## Accessibility

### Keyboard Navigation

- Tab through feedback items in sidebar
- Enter/Space to select feedback item
- Arrow keys to navigate list
- Focus indicators on all interactive elements

### Screen Readers

- Semantic HTML: `<nav>`, `<ul>`, `<li>`, `<button>`
- ARIA labels: `aria-label="Recent feedback"` for section
- ARIA current: `aria-current="true"` for selected item
- Announce selection changes with live regions

### Color Contrast

- All text meets WCAG AA standards
- Selected state has sufficient contrast
- Focus indicators are clearly visible

## Performance Optimization

### Data Fetching

1. **Initial Load**:
   - Fetch feedback history in parallel with auth check
   - Limit query to 10 most recent items
   - Use Supabase indexes for fast queries

2. **Caching**:
   - Cache feedback history in component state
   - Only refetch after new analysis
   - Use SWR or React Query for advanced caching (future enhancement)

3. **Pre-signed URLs**:
   - Generate URLs on-demand when feedback selected
   - Cache URLs in state to avoid regeneration
   - Handle expiration gracefully

### Rendering Optimization

1. **Memoization**:
   - Memoize FeedbackHistoryItem components
   - Use `React.memo` to prevent unnecessary re-renders
   - Memoize callback functions with `useCallback`

2. **Virtualization** (future enhancement):
   - Use react-window for lists > 20 items
   - Render only visible items
   - Improve scroll performance

### Network Optimization

1. **Lazy Loading**:
   - Don't fetch video URLs until feedback selected
   - Load thumbnails on-demand (future enhancement)

2. **Debouncing**:
   - Debounce rapid feedback selections
   - Prevent multiple concurrent API calls

## Responsive Design

### Desktop (>1024px)

- Full sidebar visible with feedback history
- Feedback list max height: `max-h-96` (384px)
- Scrollable with custom scrollbar styling

### Tablet (768px-1024px)

- Sidebar remains visible
- Feedback list max height: `max-h-80` (320px)
- Slightly reduced padding

### Mobile (<768px)

- Feedback history in collapsible sidebar
- Close sidebar after feedback selection
- Show only 5 most recent items to reduce scrolling
- Full-width feedback items for easier tapping

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Create FeedbackHistoryItem and FeedbackHistoryList components
2. **Phase 2**: Update Sidebar to include feedback history section
3. **Phase 3**: Update Dashboard to fetch and manage feedback history state
4. **Phase 4**: Implement feedback selection and video loading
5. **Phase 5**: Add animations and polish
6. **Phase 6**: Test responsive behavior and accessibility

### Database Queries

**Fetch Feedback History**:
```typescript
const { data, error } = await supabase
  .from('feedback_sessions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

**Insert New Feedback** (already implemented in `/api/analyze`):
```typescript
const { data, error } = await supabase
  .from('feedback_sessions')
  .insert({
    user_id: userId,
    video_path: videoPath,
    feedback_text: feedback,
  })
  .select()
  .single();
```

### Utility Functions

**Format Relative Date**:
```typescript
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return date.toLocaleDateString();
}
```

**Truncate Filename**:
```typescript
export function truncateFilename(filename: string, maxLength: number = 25): string {
  if (filename.length <= maxLength) return filename;
  
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
  
  return `${truncatedName}...${extension}`;
}
```

**Extract Filename from S3 Path**:
```typescript
export function extractFilename(s3Path: string): string {
  // s3Path format: "user_<uuid>/<timestamp>_<filename>"
  const parts = s3Path.split('/');
  const filenameWithTimestamp = parts[parts.length - 1];
  // Remove timestamp prefix (e.g., "1234567890_video.mp4" -> "video.mp4")
  const filename = filenameWithTimestamp.substring(filenameWithTimestamp.indexOf('_') + 1);
  return filename;
}
```

### State Transitions

**Upload Mode → View Mode**:
- User clicks feedback item in sidebar
- Clear `uploadedVideo` and `showUploadBox`
- Set `selectedFeedbackId`
- Load video URL and feedback text
- Update main content area

**View Mode → Upload Mode**:
- User clicks "Upload New Video" or "My Videos"
- Clear `selectedFeedbackId`
- Clear `feedback` and `uploadedVideo`
- Show upload interface

**After New Analysis**:
- Insert feedback into database
- Refresh feedback history
- Set `selectedFeedbackId` to new feedback
- Keep video and feedback visible

## Future Enhancements

1. **Search and Filter**: Search feedback by video name or date range
2. **Delete Feedback**: Allow users to delete old feedback sessions
3. **Feedback Categories**: Tag feedback by presentation type
4. **Thumbnails**: Generate and display video thumbnails
5. **Infinite Scroll**: Load more than 10 items with pagination
6. **Feedback Comparison**: Compare feedback across multiple sessions
7. **Export Feedback**: Download feedback as PDF or text file
8. **Feedback Analytics**: Show trends and improvements over time
