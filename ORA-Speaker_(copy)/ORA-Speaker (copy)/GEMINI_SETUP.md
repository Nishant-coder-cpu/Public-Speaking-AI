# Gemini Integration Setup Guide

This guide will help you set up Google Gemini API for video analysis in the Speaking Coach application.

## Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Add API Key to Environment Variables

Create a `.env.local` file in the project root (if it doesn't exist):

```bash
cp .env.local.example .env.local
```

Then add your Gemini API key:

```bash
GEMINI_API_KEY=your-actual-api-key-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Test the Integration

1. Start the development server:
```bash
npm run dev
```

2. Upload a video through the UI
3. Click "Analyze Video"
4. Wait for Gemini to analyze and return feedback (usually 5-15 seconds)

## How It Works

### Video Analysis Flow

1. **User uploads video** → Stored in AWS S3
2. **User clicks "Analyze"** → Triggers `/api/analyze` endpoint
3. **Download from S3** → Server downloads video using signed URL
4. **Upload to Gemini** → Video uploaded to Gemini File API
5. **Process video** → Gemini processes and analyzes the video
6. **Generate feedback** → AI-generated speaking feedback
7. **Save to database** → Stored in Supabase `feedback_sessions` table
8. **Display to user** → Shown in FeedbackCard component
9. **Cleanup** → Temporary files removed from Gemini

### What Gemini Analyzes

- **Speaking pace and clarity**
- **Filler words** (um, uh, like, etc.)
- **Body language** (posture, gestures)
- **Eye contact** with camera/audience
- **Tone and volume**
- **Overall presentation skills**

## Model Selection

We're using **Gemini 1.5 Flash** because:
- ✅ Supports video input (up to 1 hour)
- ✅ Fast processing (5-15 seconds)
- ✅ Cost-effective ($0.075 per 1M tokens)
- ✅ Good quality for speaking analysis

### Alternative: Gemini 1.5 Pro

For higher quality analysis, you can switch to Gemini 1.5 Pro:

```typescript
// In app/api/analyze/route.ts
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
```

### Available Models
- `gemini-1.5-flash-latest` - Fast and cost-effective (current)
- `gemini-1.5-pro-latest` - Higher quality, slower
- `gemini-1.5-flash-8b-latest` - Fastest, lower quality

**Trade-offs:**
- Better quality analysis
- Slower processing (15-30 seconds)
- Higher cost ($1.25 per 1M tokens)

## Pricing

### Gemini 1.5 Flash (Current)
- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens
- **Typical 5-min video**: ~$0.01-0.03 per analysis

### Free Tier
- 15 requests per minute
- 1,500 requests per day
- Perfect for development and demos

## Troubleshooting

### Error: "AI service is not configured"
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

### Error: "Failed to analyze video"
- Verify your API key is valid
- Check that the video is in MP4 format
- Ensure video is under 150MB
- Check API quota limits

### Slow Analysis
- Normal processing time: 15-30 seconds for 5-min video
- Includes: download from S3 → upload to Gemini → processing → analysis
- Longer videos take more time
- Consider using Gemini 1.5 Flash (faster) vs Pro (slower but better)

### API Quota Exceeded
- Free tier: 15 requests/min, 1,500/day
- Wait a few minutes and try again
- Consider upgrading to paid tier for production

## Future: Custom Model Integration

When your custom model is ready, you can:

1. **Option A**: Replace Gemini entirely
   - Update `/app/api/analyze/route.ts` to call your model
   - Remove Gemini dependency

2. **Option B**: Two-stage approach (Recommended)
   - Your model extracts metrics (pace, filler words, etc.)
   - Gemini generates natural language feedback
   - Best of both worlds: accuracy + natural language

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [Video Analysis Guide](https://ai.google.dev/tutorials/video_quickstart)
- [API Key Management](https://aistudio.google.com/app/apikey)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs (`npm run dev` output)
3. Verify all environment variables are set
4. Test with a small video file first (< 1 minute)
