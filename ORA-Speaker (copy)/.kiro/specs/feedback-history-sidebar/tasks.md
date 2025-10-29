# Implementation Plan

- [x] 1. Create utility functions for feedback history

  - Create `utils/feedbackHistory.ts` with helper functions
  - Implement `formatRelativeDate()` to convert timestamps to relative format (e.g., "2 days ago")
  - Implement `truncateFilename()` to shorten long filenames with ellipsis
  - Implement `extractFilename()` to extract filename from S3 path
  - _Requirements: 1.4, 4.1, 4.2_

- [x] 2. Create FeedbackHistoryItem component

  - Create `components/FeedbackHistoryItem.tsx` with session prop and click handler
  - Implement glassmorphic card design with `bg-white/10` background and `border-white/20` border
  - Display video icon, truncated filename, and relative date
  - Add hover state with `bg-white/15` and subtle x-axis translation animation
  - Add selected state with `bg-blue-500/20` background and `border-blue-400/50` border
  - Use Framer Motion for smooth transitions respecting `prefers-reduced-motion`
  - Ensure minimum 44px touch target height for accessibility
  - _Requirements: 1.3, 1.4, 1.5, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3. Create FeedbackHistoryList component

  - Create `components/FeedbackHistoryList.tsx` with feedbackSessions array and selection handler
  - Implement scrollable container with `max-h-96` on desktop and custom scrollbar styling
  - Render list of FeedbackHistoryItem components in reverse chronological order
  - Add stagger animation for list items using Framer Motion variants
  - Implement loading skeleton with pulsing animation when `isLoading` is true
  - Display "No feedback yet" empty state when feedbackSessions array is empty
  - Pass `isSelected` prop to items based on `selectedId`
  - _Requirements: 1.1, 1.2, 1.6, 1.7, 2.1, 2.2, 4.7_

- [x] 4. Update Sidebar component to include feedback history section

  - Modify `components/Sidebar.tsx` to accept new props: `feedbackHistory`, `selectedFeedbackId`, `onSelectFeedback`, `isLoadingHistory`
  - Add "Recent Feedback" section between navigation menu and user section
  - Include Clock icon and section header with `text-sm font-semibold text-slate-300` styling
  - Integrate FeedbackHistoryList component with conditional rendering (only show when feedbackHistory.length > 0)
  - Ensure feedback section is scrollable while header and footer remain fixed
  - Update layout to use flexbox with `flex-1` for scrollable middle section
  - _Requirements: 1.1, 1.6, 4.7_

- [x] 5. Add feedback history state management to Dashboard

  - Modify `app/dashboard/page.tsx` to add new state fields: `feedbackHistory`, `selectedFeedbackId`, `isLoadingHistory`, `historyError`
  - Implement `fetchFeedbackHistory()` function to query Supabase for user's feedback sessions
  - Query `feedback_sessions` table with filters: `eq('user_id', userId)`, `order('created_at', { ascending: false })`, `limit(10)`
  - Add `useEffect` hook to call `fetchFeedbackHistory()` when `userId` is available
  - Handle loading and error states appropriately
  - Pass feedback history props to Sidebar component
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

- [x] 6. Implement feedback selection and video loading

  - Add `handleSelectFeedback()` function in `app/dashboard/page.tsx`
  - Update state to set `selectedFeedbackId`, clear `uploadedVideo` and `showUploadBox`
  - Set `feedback` to `session.feedback_text` from selected session
  - Call `/api/preview-url` endpoint to generate pre-signed S3 URL for the video
  - Update `uploadedVideo` state with path and URL once loaded
  - Handle errors gracefully with user-friendly error messages
  - Close mobile sidebar after selection (check window width < 1024px)
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 5.5, 7.4_

- [x] 7. Update analyze video flow to refresh feedback history

  - Modify `handleAnalyzeVideo()` function in `app/dashboard/page.tsx`
  - After successful feedback generation, call `fetchFeedbackHistory()` to refresh the sidebar list
  - Set `selectedFeedbackId` to the newly created feedback session ID
  - Ensure the new feedback appears at the top of the sidebar list
  - _Requirements: 3.6, 5.4_

- [x] 8. Implement state transitions between upload and view modes

  - Update `handleUploadClick()` to clear `selectedFeedbackId` when entering upload mode
  - Modify "My Videos" navigation button click handler to clear selection and show upload interface
  - Ensure smooth transitions using AnimatePresence when switching between modes
  - Maintain proper state consistency across mode changes
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 9. Add responsive behavior for mobile and tablet

  - Update FeedbackHistoryList to show only 5 items on mobile (<768px) instead of 10
  - Adjust `max-h-80` for tablet (768px-1024px) and `max-h-64` for mobile
  - Ensure feedback items have adequate touch targets (minimum 44px height)
  - Test sidebar close behavior on mobile after feedback selection
  - Verify scrolling works smoothly on touch devices
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 10. Add animations and polish

  - Implement list entry stagger animation using Framer Motion variants
  - Add hover animations to feedback items with x-axis translation
  - Add smooth background and border color transitions for selected state
  - Implement loading skeleton with pulsing opacity animation
  - Ensure all animations respect `prefers-reduced-motion` setting
  - Test animation performance and smoothness
  - _Requirements: 4.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Optimize performance and caching

  - Memoize FeedbackHistoryItem component using React.memo
  - Use useCallback for `onSelectFeedback` handler to prevent unnecessary re-renders
  - Cache video preview URLs in state to avoid regenerating on re-selection
  - Ensure feedback history is only fetched once on mount and after new analysis
  - Test that rapid feedback selections don't cause multiple concurrent API calls
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 12. Verify integration with existing dashboard functionality

  - Test that uploading new video clears selected feedback and shows upload interface
  - Test that analyzing video adds new feedback to sidebar list automatically
  - Test that logout clears feedback history state
  - Test that all existing upload, preview, and analyze functionality still works
  - Test error handling for failed feedback history fetches
  - Test empty state when user has no feedback sessions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 3.5, 3.7_
