import React from 'react';

interface VideoPreviewProps {
  videoUrl: string;
  videoPath: string;
}

export default function VideoPreview({ videoUrl, videoPath }: VideoPreviewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
          Video Preview
        </h3>
        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <p className="text-white text-center p-4">
              Your browser does not support the video tag or the video format is not supported.
            </p>
          </video>
        </div>
        <p className="mt-3 text-sm text-gray-500 truncate" title={videoPath}>
          {videoPath}
        </p>
      </div>
    </div>
  );
}
