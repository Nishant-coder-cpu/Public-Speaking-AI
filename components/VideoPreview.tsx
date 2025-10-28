'use client';

import React, { useState } from 'react';
import { SlideUp } from '@/components/AnimationWrappers';
import { Play, FileVideo } from 'lucide-react';

interface VideoPreviewProps {
  videoUrl: string;
  videoPath: string;
}

export default function VideoPreview({ videoUrl, videoPath }: VideoPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <SlideUp className="w-full max-w-4xl mx-auto">
      <div className="group relative backdrop-blur-lg bg-white/5 border border-white/20 rounded-2xl shadow-lg p-4 md:p-6 transition-all duration-300 hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
        {/* Gradient border effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-cyan-500/20 transition-all duration-300 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Play className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg md:text-xl font-bold text-slate-50">
              Video Preview
            </h3>
          </div>
          
          {/* Video player container */}
          <div className="relative w-full aspect-video bg-slate-900/80 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            {/* Loading shimmer effect */}
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-shimmer bg-[length:200%_100%]" />
            )}
            
            <video
              src={videoUrl}
              controls
              className="relative z-10 w-full h-full object-contain"
              preload="metadata"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            >
              <p className="text-slate-300 text-center p-4">
                Your browser does not support the video tag or the video format is not supported.
              </p>
            </video>
          </div>
          
          {/* Metadata display */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <FileVideo className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <p className="truncate" title={videoPath}>
              {videoPath}
            </p>
          </div>
        </div>
      </div>
    </SlideUp>
  );
}
