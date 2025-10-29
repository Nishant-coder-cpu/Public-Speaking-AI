# Design Document: Feedback Chatbot

## Overview

The Feedback Chatbot feature adds an AI-powered conversational interface that provides personalized speaking improvement advice to users after they receive feedback on their uploaded videos. The chatbot will be context-aware, understanding the specific feedback the user received, and will offer actionable guidance through natural conversation.

This feature integrates seamlessly with the existing feedback display system, appearing alongside the FeedbackCard component on the dashboard. It leverages the Google Gemini AI API (already used for video analysis) to generate intelligent, coaching-style responses.

## Architecture

### High-Level Flow

1. User uploads and analyzes a video → receives feedback
2. Chatbot interface appears alongside feedback display
3. User types a question or clicks a suggested question
4. Frontend sends message + feedback context to API endpoint
5. API endpoint calls Gemini AI with coaching prompt + context
6. AI response is returned and displayed in chat
7. Message history is persisted to database for future reference

### Component Structure

```
Dashboard Page (app/dashboard/page.tsx)
├── FeedbackCard (displays AI feedback)
└── ChatbotInterface (new component)
    ├── ChatHeader (welcome message, clear button)
    ├── ChatMessages (message history display)
    │   ├── UserMessage (user's messages)
    │   └── BotMessage (chatbot responses)
    ├── SuggestedQuestions (clickable question chips)
    └── ChatInput (text input + send button)
```

### API Architecture

```
POST /api/chat
├── Validates request (message, feedbackSessionId)
├── Fetches feedback context from database
├── Constructs prompt with coaching instructions + context
├── Calls Gemini AI API
├── Stores message pair in database
└── Returns AI response
```

## Components and Interfaces

### 1. ChatbotInterface Component

**Location**: `components/ChatbotInterface.tsx`

**Props**:

```typescript
interface ChatbotInterfaceProps {
  feedbackSessionId: string;
  feedbackText: string;
  onClose?: () => void;
}
```

**State**:

```typescript
interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  error: string | null;
  suggestedQuestions: string[];
}
```

**Responsibilities**:

- Render chat UI with message history
- Handle user input and message submission
- Display loading states during AI processing
- Show suggested questions based on feedback
- Manage local chat state and sync with database

### 2. ChatMessage Component

**Location**: `components/ChatMessage.tsx`

**Props**:

```typescript
interface ChatMessageProps {
  message: ChatMessage;
  isUser: boolean;
}
```

**Responsibilities**:

- Render individual message bubbles
- Apply different styling for user vs bot messages
- Display timestamps
- Handle message animations

### 3. SuggestedQuestions Component

**Location**: `components/SuggestedQuestions.tsx`

**Props**:

```typescript
interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}
```

**Responsibilities**:

- Display clickable question chips
- Generate context-aware suggestions based on feedback
- Handle click events to auto-send questions

## Data Models

### ChatMessage Type

```typescript
interface ChatMessage {
  id: string;
  feedback_session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
```

### Database Schema

**New Table**: `chat_messages`

```sql
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  feedback_session_id uuid references feedback_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

-- Indexes for performance
create index if not exists idx_chat_messages_feedback_session_id
  on chat_messages(feedback_session_id);

create index if not exists idx_chat_messages_created_at
  on chat_messages(created_at asc);

-- RLS Policies
alter table chat_messages enable row level security;

-- Users can view messages for their own feedback sessions
create policy "Users can view own chat messages"
  on chat_messages
  for select
  using (
    exists (
      select 1 from feedback_sessions
      where feedback_sessions.id = chat_messages.feedback_session_id
      and feedback_sessions.user_id = auth.uid()
    )
  );

-- Users can insert messages for their own feedback sessions
create policy "Users can insert own chat messages"
  on chat_messages
  for insert
  with check (
    exists (
      select 1 from feedback_sessions
      where feedback_sessions.id = chat_messages.feedback_session_id
      and feedback_sessions.user_id = auth.uid()
    )
  );
```

### Updated Types File

Add to `lib/types.ts`:

```typescript
export interface ChatMessage {
  id: string;
  feedback_session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatRequest {
  feedbackSessionId: string;
  message: string;
}

export interface ChatResponse {
  success: boolean;
  message?: ChatMessage;
  error?: string;
}
```

## API Endpoints

### POST /api/chat

**Location**: `app/api/chat/route.ts`

**Request Body**:

```typescript
{
  feedbackSessionId: string;
  message: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  message?: {
    id: string;
    role: 'assistant';
    content: string;
    created_at: string;
  };
  error?: string;
}
```

**Implementation Flow**:

1. Validate request body
2. Authenticate user via Bearer token
3. Verify user owns the feedback session
4. Fetch feedback text from database
5. Fetch recent chat history (last 10 messages for context)
6. Construct Gemini prompt with:
   - System instructions (act as speaking coach)
   - Feedback context
   - Recent conversation history
   - User's new message
7. Call Gemini AI API
8. Store both user message and AI response in database
9. Return AI response to client

**Gemini Prompt Template**:

```
You are an expert public speaking coach providing personalized advice. A user has received the following feedback on their presentation:

[FEEDBACK_TEXT]

Previous conversation:
[CHAT_HISTORY]

User's question: [USER_MESSAGE]

Provide a helpful, constructive, and encouraging response. Be specific and actionable. Reference their actual performance when relevant. Keep responses concise (2-3 paragraphs max).
```

### GET /api/chat/history

**Location**: `app/api/chat/history/route.ts`

**Query Parameters**:

```typescript
{
  feedbackSessionId: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  messages?: ChatMessage[];
  error?: string;
}
```

**Implementation**:

- Authenticate user
- Verify ownership of feedback session
- Fetch all messages for the session ordered by created_at
- Return message array

## UI/UX Design

### Layout Integration

The chatbot will appear below the FeedbackCard component on the dashboard when feedback is displayed. On mobile devices, it can be toggled to maximize screen space.

**Desktop Layout** (>= 1024px):

```
┌─────────────────────────────────────┐
│         Video Preview               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│         Feedback Card               │
│  (AI analysis results)              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│      Chatbot Interface              │
│  ┌───────────────────────────────┐  │
│  │  Chat Messages                │  │
│  │  (scrollable history)         │  │
│  └───────────────────────────────┘  │
│  [Suggested Questions]              │
│  [Input Field] [Send Button]       │
└─────────────────────────────────────┘
```

**Mobile Layout** (< 768px):

```
┌─────────────────────┐
│   Video Preview     │
└─────────────────────┘
┌─────────────────────┐
│   Feedback Card     │
│   [Show Chat] btn   │
└─────────────────────┘
     ↓ (when opened)
┌─────────────────────┐
│  Chatbot Interface  │
│  (full width)       │
│  [Close] button     │
└─────────────────────┘
```

### Visual Design

**Color Scheme** (matching existing design system):

- User messages: Blue gradient (`from-blue-500 to-purple-600`)
- Bot messages: Dark glass morphism (`bg-white/5 border-white/10`)
- Suggested questions: Purple accent (`border-purple-400/50`)
- Input field: Glass morphism with focus ring

**Animations**:

- Message fade-in with slide-up (Framer Motion)
- Typing indicator with animated dots
- Smooth scroll to new messages
- Button hover effects with scale transform

### Suggested Questions Logic

Generate 3-4 questions based on feedback content analysis:

**Algorithm**:

1. Parse feedback text for key topics (pace, filler words, body language, etc.)
2. Identify areas marked as "improvement needed"
3. Generate questions like:
   - "How can I reduce my use of filler words?"
   - "What exercises can help me improve my pace?"
   - "Can you give me tips for better eye contact?"
   - "How should I practice to improve [specific weakness]?"

**Default Questions** (if parsing fails):

- "How can I improve my overall presentation skills?"
- "What should I focus on practicing first?"
- "Can you give me specific exercises to try?"

## Error Handling

### Client-Side Errors

1. **Empty Message**: Prevent submission, show inline validation
2. **Network Error**: Display retry button with error message
3. **Timeout**: Show timeout message after 30 seconds
4. **Rate Limiting**: Display "Please wait" message

### Server-Side Errors

1. **Invalid Session**: Return 404 with "Feedback session not found"
2. **Unauthorized**: Return 401 with "Authentication required"
3. **Gemini API Failure**: Return 503 with "AI service temporarily unavailable"
4. **Database Error**: Return 500 with "Failed to save message"

### Error UI

```typescript
{
  error && (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
      <p className="text-red-200 text-sm">{error}</p>
      <button onClick={handleRetry}>Retry</button>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests

1. **ChatbotInterface Component**

   - Renders with empty message history
   - Handles user input correctly
   - Submits messages on Enter key
   - Displays loading state during API call
   - Shows error messages appropriately

2. **SuggestedQuestions Component**

   - Generates relevant questions from feedback
   - Handles click events correctly
   - Disables during loading

3. **API Route (/api/chat)**
   - Validates request body
   - Authenticates user correctly
   - Verifies session ownership
   - Constructs proper Gemini prompt
   - Handles API failures gracefully
   - Stores messages in database

### Integration Tests

1. **End-to-End Chat Flow**

   - User sends message → receives response
   - Message appears in history
   - Suggested question click works
   - Chat history persists on page reload

2. **Database Operations**

   - Messages are stored correctly
   - RLS policies enforce ownership
   - History retrieval works

3. **AI Integration**
   - Gemini API responds appropriately
   - Context is properly included
   - Responses are relevant to feedback

### Manual Testing Checklist

- [ ] Chat appears after feedback is displayed
- [ ] Messages send and receive correctly
- [ ] Suggested questions are relevant
- [ ] Loading states display properly
- [ ] Error handling works for network issues
- [ ] Mobile responsive layout works
- [ ] Chat history persists across sessions
- [ ] Multiple feedback sessions have separate chats
- [ ] Clear chat functionality works
- [ ] Accessibility (keyboard navigation, screen readers)

## Performance Considerations

### Optimization Strategies

1. **Message Pagination**: Load initial 50 messages, lazy load older messages
2. **Debounced Input**: Prevent rapid-fire submissions
3. **Optimistic UI Updates**: Show user message immediately, update on confirmation
4. **Caching**: Cache suggested questions per feedback session
5. **Rate Limiting**: Limit to 10 messages per minute per user

### Database Indexes

Already included in schema:

- `idx_chat_messages_feedback_session_id` for fast session lookups
- `idx_chat_messages_created_at` for chronological ordering

### API Response Time

- Target: < 3 seconds for AI response
- Timeout: 30 seconds
- Show loading indicator after 1 second

## Security Considerations

### Authentication & Authorization

1. **Session Verification**: All API calls require valid Bearer token
2. **Ownership Check**: Verify user owns feedback session before allowing chat
3. **RLS Policies**: Database-level security prevents unauthorized access

### Input Validation

1. **Message Length**: Max 500 characters
2. **Content Filtering**: Sanitize input to prevent XSS
3. **Rate Limiting**: Prevent spam and abuse

### Data Privacy

1. **User Isolation**: RLS ensures users only see their own chats
2. **Secure Deletion**: Cascade delete when feedback session is deleted
3. **No PII in Logs**: Avoid logging message content

## Accessibility

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**

   - Tab through input, send button, suggested questions
   - Enter to send message
   - Escape to close mobile chat

2. **Screen Reader Support**

   - ARIA labels for all interactive elements
   - Live region for new messages
   - Role="log" for message history

3. **Visual Accessibility**

   - Sufficient color contrast (4.5:1 minimum)
   - Focus indicators on all interactive elements
   - Text size minimum 16px

4. **Reduced Motion**
   - Respect `prefers-reduced-motion` media query
   - Disable animations when requested

## Future Enhancements

1. **Voice Input**: Allow users to speak questions
2. **Export Chat**: Download chat history as PDF
3. **Smart Suggestions**: ML-based question recommendations
4. **Multi-language Support**: Translate chat interface
5. **Video Timestamps**: Link feedback to specific video moments
6. **Practice Plans**: Generate structured improvement plans
7. **Progress Tracking**: Track improvement over multiple sessions
