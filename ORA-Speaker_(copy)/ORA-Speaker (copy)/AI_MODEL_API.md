# AI Model API Integration Guide

This document describes the expected request and response format for the external AI model endpoint used by the Speaking Coach application.

## Overview

The Speaking Coach application sends video URLs to an external AI model endpoint for analysis. The AI model processes the video and returns feedback on the user's speaking performance.

## Configuration

Set the AI model endpoint URL in your environment variables:

```bash
AI_MODEL_ENDPOINT=https://your-model-endpoint.com/analyze
```

## API Contract

### Request Format

**Endpoint**: `POST {AI_MODEL_ENDPOINT}`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "videoUrl": "https://signed-s3-url.amazonaws.com/video.mp4?signature=..."
}
```

**Request Body Schema**:
- `videoUrl` (string, required): A pre-signed S3 URL to the video file
  - The URL is valid for 10 minutes
  - The video is in MP4 format
  - Maximum file size: 150MB

### Response Format

**Success Response** (HTTP 200):

```json
{
  "feedback": "Great job on your presentation! Here are some observations:\n\n1. Pace: Your speaking pace was well-controlled...\n2. Clarity: Your articulation was clear...\n3. Body Language: Consider maintaining more eye contact..."
}
```

**Response Body Schema**:
- `feedback` (string, required): The AI-generated feedback text
  - Can include line breaks (`\n`) for formatting
  - Should provide actionable insights on speaking performance
  - Typical areas covered: pace, tone, clarity, body language, filler words, etc.

**Error Response** (HTTP 4xx/5xx):

The AI model endpoint should return appropriate HTTP status codes for errors:
- `400 Bad Request`: Invalid request format or missing required fields
- `422 Unprocessable Entity`: Video format not supported or processing failed
- `500 Internal Server Error`: Server-side processing error
- `503 Service Unavailable`: Service temporarily unavailable

## Example Request

```bash
curl -X POST https://your-model-endpoint.com/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://speaking-coach-videos.s3.amazonaws.com/user_123/video.mp4?X-Amz-Signature=..."
  }'
```

## Example Response

```json
{
  "feedback": "Excellent presentation! Here's my analysis:\n\n**Strengths:**\n- Clear articulation and good volume control\n- Well-paced delivery with appropriate pauses\n- Confident body language\n\n**Areas for Improvement:**\n- Reduce filler words (um, uh) - counted 12 instances\n- Maintain more consistent eye contact with the camera\n- Consider varying your tone more to emphasize key points\n\n**Overall:** You demonstrated strong public speaking fundamentals. Focus on eliminating filler words and you'll see significant improvement."
}
```

## Integration in Application

The Speaking Coach application handles the AI model integration as follows:

1. **Video Upload**: User uploads video to AWS S3
2. **Analysis Request**: User clicks "Analyze Video" button
3. **Signed URL Generation**: Backend generates a 10-minute pre-signed S3 URL
4. **AI Model Call**: Backend sends POST request to AI_MODEL_ENDPOINT with the signed URL
5. **Response Processing**: Backend receives feedback and stores it in the database
6. **Display**: Frontend displays the feedback to the user

## Error Handling

The application handles various error scenarios:

- **Missing AI_MODEL_ENDPOINT**: Returns 500 error with message "AI service is not configured"
- **AI Service Unavailable**: Returns 503 error with message "AI service is temporarily unavailable"
- **Invalid AI Response**: Returns 500 error with message "Invalid response from AI service"
- **Network Timeout**: Returns 503 error with message "Failed to analyze video. Please try again later."

## Testing

### Mock AI Endpoint for Development

For local development and testing, you can create a mock AI endpoint that returns sample feedback:

```javascript
// Example mock endpoint (Node.js/Express)
app.post('/analyze', (req, res) => {
  const { videoUrl } = req.body;
  
  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      feedback: "Mock feedback: Your presentation shows good potential!\n\n**Pace:** Moderate and easy to follow\n**Clarity:** Clear articulation\n**Suggestions:** Practice maintaining eye contact and reduce filler words."
    });
  }, 2000);
});
```

### Testing Checklist

- [ ] Verify AI_MODEL_ENDPOINT is set in environment variables
- [ ] Test with valid video URL - should return feedback
- [ ] Test with missing videoUrl - should return 400 error
- [ ] Test with invalid video URL - should handle gracefully
- [ ] Test with AI service down - should return 503 error
- [ ] Verify feedback is stored in database correctly
- [ ] Verify feedback displays correctly in UI

## TypeScript Types

The application uses the following TypeScript interfaces for type safety:

```typescript
// Request type
export interface AIModelRequest {
  videoUrl: string;
}

// Response type
export interface AIModelResponse {
  feedback: string;
}
```

These types are defined in `/lib/types.ts` and used throughout the application.

## Security Considerations

- **Pre-signed URLs**: Videos are accessed via temporary pre-signed URLs (10-minute expiration)
- **Private Storage**: Videos are stored in a private S3 bucket, not publicly accessible
- **No Direct Access**: The AI model never receives permanent access to videos
- **HTTPS Only**: All communication should use HTTPS
- **Rate Limiting**: Consider implementing rate limiting on the AI endpoint to prevent abuse

## Support

For issues related to the AI model integration:
1. Check that AI_MODEL_ENDPOINT is correctly configured
2. Verify the AI service is accessible from your deployment environment
3. Check application logs for detailed error messages
4. Ensure the AI endpoint follows the expected request/response format
