# Implementation Plan

- [x] 1. Create Sidebar component

  - Create `components/Sidebar.tsx` with logo section, navigation menu (My Videos), and user section (email + sign out button)
  - Implement white/light gray background with right border
  - Add fixed width (192px) and full height styling
  - Include video camera icon for "My Videos" navigation item
  - Add hover states for navigation items and sign out button
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Create MainHeader component

  - Create `components/MainHeader.tsx` with title, subtitle, and action button props
  - Implement white background with bottom border
  - Add flex layout with space-between for title and button alignment
  - Style "Upload New Video" button with blue background and white text
  - Add responsive padding and text sizing
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 3. Create EmptyState component

  - Create `components/EmptyState.tsx` with upload icon, heading, description, and CTA button
  - Implement centered card design with white background and subtle shadow
  - Add upload icon from lucide-react with gray color
  - Include "No videos yet" heading and descriptive text
  - Style "Upload Video" button with blue background
  - Add max-width constraint and center alignment
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Create DashboardLayout component

  - Create `components/DashboardLayout.tsx` that wraps Sidebar and main content area
  - Implement flex layout with sidebar and main content sections
  - Add light gray background to overall layout
  - Pass userEmail and onLogout props to Sidebar
  - Ensure proper spacing and full-height layout
  - _Requirements: 2.1, 5.1, 5.2, 5.3_

- [x] 5. Update Dashboard page to use new layout structure

  - Modify `app/dashboard/page.tsx` to use DashboardLayout wrapper
  - Remove existing gradient background and header section
  - Integrate MainHeader component with page title and upload button
  - Add conditional rendering: show EmptyState when no video, show existing upload/video components when video exists
  - Connect upload button handlers from both MainHeader and EmptyState to existing upload logic
  - Update background colors to match new design (white/light gray)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 6. Add responsive behavior for mobile and tablet

  - Add responsive classes to Sidebar for mobile collapse (hidden on mobile, visible on desktop)
  - Implement hamburger menu button for mobile sidebar toggle
  - Add responsive padding and text sizing to MainHeader
  - Ensure EmptyState card is properly sized on mobile
  - Test layout on mobile (<768px), tablet (768-1024px), and desktop (>1024px) breakpoints
  - Ensure touch targets are appropriately sized for mobile (minimum 44px)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Add animations and transitions

  - Add fade-in animation to EmptyState component using Framer Motion
  - Add hover transitions to Sidebar navigation items
  - Add hover scale effect to MainHeader upload button
  - Add smooth transitions when switching between empty and populated states using AnimatePresence
  - Ensure all transitions respect prefers-reduced-motion
  - _Requirements: 6.2_

- [x] 8. Verify all existing functionality works

  - Test authentication flow and redirect behavior
  - Test video upload from both header button and empty state button
  - Test video preview display after upload
  - Test analyze video functionality
  - Test feedback display
  - Test error handling and validation
  - Test logout functionality from sidebar
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 9. Polish visual design and consistency
  - Ensure consistent color usage across all new components (blue-500 for primary actions, gray scale for neutrals)
  - Verify typography consistency (font sizes, weights, line heights)
  - Check spacing consistency (padding, margins, gaps)
  - Ensure border radius consistency across cards and buttons
  - Verify shadow usage is consistent
  - Add proper focus states for keyboard navigation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
