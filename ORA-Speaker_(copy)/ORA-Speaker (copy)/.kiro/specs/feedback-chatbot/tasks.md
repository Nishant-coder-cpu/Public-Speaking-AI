# Implementation Plan

- [ ] 1. Set up database schema and types
  - Create migration SQL for `chat_messages` table with proper indexes and RLS policies
  - Add `ChatMessage`, `ChatRequest`, and `ChatResponse` interfaces to `lib/types.ts`
  - _Requirements: 1.3, 3.1, 3.2, 3.3_

- [ ] 2. Implement chat API endpoint
- [ ] 2.1 Create POST /api/chat route handler
  - Implement request validation for feedbackSessionId and message
  - Add authentication check using Bearer token from headers
  - Verify user owns the feedback session by querying feedback_sessions table
  - Fetch feedback text and recent chat history (last 10 messages) from database
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2.2 Integrate Gemini AI for chat responses
  - Construct coaching prompt with system instructions, feedback context, chat history, and user message
  - Call Gemini AI API (gemini-2.5-flash model) with the constructed prompt
  - Handle API errors with appropriate error messages and status codes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2.3 Persist chat messages to database
  - Insert user message into chat_messages table
  - Insert AI response into chat_messages table
  - Return AI response with message ID and timestamp to client
  - _Requirements: 3.1, 3.2_

- [ ] 3. Create chat history API endpoint
- [ ] 3.1 Create GET /api/chat/history route handler
  - Implement query parameter validation for feedbackSessionId
  - Add authentication and ownership verification
  - Fetch all messages for the session ordered by created_at ascending
  - Return messages array with proper error handling
  - _Requirements: 3.2, 3.3_

- [ ] 4. Build ChatMessage component
- [ ] 4.1 Create ChatMessage component with styling
  - Implement message bubble UI with different styles for user vs bot messages
  - Add timestamp display with proper formatting
  - Apply glass morphism styling consistent with existing design system
  - Add fade-in animation using Framer Motion
  - _Requirements: 1.3, 1.4_

- [ ] 5. Build SuggestedQuestions component
- [ ] 5.1 Create SuggestedQuestions component
  - Implement clickable question chips with purple accent styling
  - Add click handler to auto-send selected question
  - Implement disabled state during loading
  - Add hover and focus animations
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5.2 Implement question generation logic
  - Parse feedback text to identify key topics (pace, filler words, body language, etc.)
  - Generate 3-4 context-aware questions based on identified weaknesses
  - Provide fallback default questions if parsing fails
  - _Requirements: 5.1, 5.4_

- [ ] 6. Build ChatbotInterface component
- [ ] 6.1 Create ChatbotInterface component structure
  - Set up component with props interface (feedbackSessionId, feedbackText)
  - Initialize state for messages, inputValue, isLoading, error, suggestedQuestions
  - Implement useEffect to fetch chat history on mount
  - Add auto-scroll to bottom when new messages arrive
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 3.3_

- [ ] 6.2 Implement chat input and message submission
  - Create text input field with 500 character limit validation
  - Add send button with loading state
  - Implement Enter key handler for message submission
  - Prevent empty message submission with inline validation
  - Disable input during loading to prevent multiple simultaneous requests
  - _Requirements: 1.2, 1.3, 7.1, 7.2_

- [ ] 6.3 Implement message display and history
  - Render message list using ChatMessage component
  - Display welcome message when chat is empty
  - Show typing indicator with animated dots during AI processing
  - Implement optimistic UI update (show user message immediately)
  - _Requirements: 1.3, 1.4, 1.5, 7.1_

- [ ] 6.4 Add error handling and loading states
  - Display error messages with retry button
  - Show loading indicator after 1 second of processing
  - Handle network errors with user-friendly messages
  - Implement 30-second timeout with appropriate message
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6.5 Implement clear chat functionality
  - Add "Clear Chat" button to chat header
  - Show confirmation dialog before clearing
  - Clear messages from UI state (keep in database for history)
  - Reset to welcome message and suggested questions after clearing
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 7. Integrate chatbot into dashboard
- [ ] 7.1 Add ChatbotInterface to dashboard page
  - Import ChatbotInterface component in `app/dashboard/page.tsx`
  - Render chatbot below FeedbackCard when feedback is displayed
  - Pass feedbackSessionId and feedbackText as props
  - Add conditional rendering to only show when feedback exists
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 7.2 Implement mobile responsive layout
  - Add toggle button to show/hide chat on mobile (< 768px)
  - Implement full-width chat overlay on mobile with close button
  - Ensure input field stays visible above keyboard on mobile
  - Add smooth transitions for mobile chat open/close
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7.3 Apply consistent styling and animations
  - Match glass morphism design from FeedbackCard
  - Use blue-purple gradient for user messages
  - Add Framer Motion animations for message appearance
  - Implement smooth scroll behavior for message list
  - Ensure proper spacing and layout with existing components
  - _Requirements: 1.1, 1.3, 1.4, 8.3_

- [ ] 8. Add accessibility features
- [ ] 8.1 Implement keyboard navigation
  - Ensure Tab key navigates through input, send button, and suggested questions
  - Add Enter key handler for sending messages
  - Implement Escape key to close mobile chat
  - Add visible focus indicators on all interactive elements
  - _Requirements: 8.1, 8.2_

- [ ] 8.2 Add ARIA labels and screen reader support
  - Add ARIA labels to all buttons and input fields
  - Implement role="log" for message history container
  - Add aria-live region for new messages announcement
  - Ensure proper heading hierarchy
  - _Requirements: 8.1, 8.2_

- [ ] 8.3 Ensure visual accessibility
  - Verify color contrast meets WCAG 2.1 AA standards (4.5:1 minimum)
  - Set minimum text size to 16px
  - Add focus visible styles for keyboard navigation
  - Test with reduced motion preferences
  - _Requirements: 8.1, 8.2_
