'use client';

interface FeedbackCardProps {
  feedback: string;
  isLoading?: boolean;
  onSave?: () => void;
}

export default function FeedbackCard({
  feedback,
  isLoading = false,
  onSave,
}: FeedbackCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
        <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          <p className="ml-3 text-gray-600">Analyzing your video...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">AI Feedback</h3>

      {/* Feedback Text */}
      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
        {feedback}
      </div>

      {/* Save Button */}
      {onSave && (
        <button
          onClick={onSave}
          className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Save
        </button>
      )}
    </div>
  );
}
