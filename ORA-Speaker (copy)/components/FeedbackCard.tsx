'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save } from 'lucide-react';
import { shimmer } from '@/lib/animations';

interface FeedbackCardProps {
  feedback: string;
  isLoading?: boolean;
  onSave?: () => void;
  analysisType?: string;
  analysisLabel?: string;
}

export default function FeedbackCard({
  feedback,
  isLoading = false,
  onSave,
  analysisType,
  analysisLabel,
}: FeedbackCardProps) {
  // Parse feedback into sections for structured rendering
  const parseFeedback = (text: string) => {
    const lines = text.split('\n');
    const sections: { title: string; content: string[] }[] = [];
    let currentSection: { title: string; content: string[] } | null = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Check if line is a section header (ends with : or is all caps)
      if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: trimmedLine.replace(':', ''),
          content: [],
        };
      } else if (trimmedLine.length > 0 && currentSection) {
        currentSection.content.push(trimmedLine);
      } else if (trimmedLine.length > 0 && !currentSection) {
        // Content before any section header
        if (sections.length === 0) {
          currentSection = { title: '', content: [trimmedLine] };
        }
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ title: '', content: [text] }];
  };

  const sections = parseFeedback(feedback);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg relative overflow-hidden"
      >
        {/* Gradient accent border on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500"></div>
        
        <div className="pl-2">
          {/* Loading header with animated spinner */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
              <div className="h-8 w-8 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-0 h-8 w-8 rounded-full bg-blue-500/20 blur-md"></div>
            </div>
            <p className="text-slate-200 font-medium">Analyzing your video...</p>
          </div>
          
          {/* Skeleton loaders for content sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <div className="space-y-4">
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-6 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-lg w-1/3 bg-[length:200%_100%]"
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%]"
                style={{ animationDelay: '0.1s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] w-5/6"
                style={{ animationDelay: '0.2s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] w-4/6"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
            
            {/* Section 2 */}
            <div className="space-y-4">
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-6 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-lg w-2/5 bg-[length:200%_100%]"
                style={{ animationDelay: '0.4s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] w-11/12"
                style={{ animationDelay: '0.5s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] w-4/5"
                style={{ animationDelay: '0.6s' }}
              />
            </div>
            
            {/* Section 3 */}
            <div className="space-y-4">
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-6 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-lg w-1/4 bg-[length:200%_100%]"
                style={{ animationDelay: '0.7s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%]"
                style={{ animationDelay: '0.8s' }}
              />
              <motion.div
                variants={shimmer}
                animate="animate"
                className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] w-3/4"
                style={{ animationDelay: '0.9s' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="loaded"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-lg overflow-hidden relative hover:border-white/20 hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-900"
      >
        {/* Gradient accent border on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500"></div>
        
        <div className="p-8 pl-10">
          {/* Title with icon */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center space-x-3 mb-8"
          >
            <div className="relative group">
              <Sparkles className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <div className="absolute inset-0 w-6 h-6 bg-blue-400/30 blur-md group-hover:bg-blue-400/50 transition-all"></div>
            </div>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              {analysisLabel || 'AI Feedback'}
            </h3>
          </motion.div>

          {/* Feedback sections */}
          <div className="space-y-8">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + sectionIndex * 0.1, duration: 0.4 }}
                className="space-y-4"
              >
                {/* Section title */}
                {section.title && (
                  <h4 className="text-lg font-semibold text-slate-200 border-b border-white/10 pb-2 hover:border-white/20 transition-colors">
                    {section.title}
                  </h4>
                )}

                {/* Section content */}
                <div className="space-y-3">
                  {section.content.map((line, lineIndex) => {
                    // Check if line is a bullet point
                    const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');
                    
                    if (isBullet) {
                      const content = line.replace(/^[-•*]\s*/, '');
                      return (
                        <motion.div
                          key={lineIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + sectionIndex * 0.1 + lineIndex * 0.05, duration: 0.3 }}
                          className="flex items-start space-x-3 group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-all duration-200"
                        >
                          {/* Custom bullet marker with gradient */}
                          <div className="flex-shrink-0 mt-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 group-hover:w-2 group-hover:h-2 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-200"></div>
                          </div>
                          <p className="text-slate-300 leading-relaxed flex-1 group-hover:text-slate-200 transition-colors">
                            {content}
                          </p>
                        </motion.div>
                      );
                    }
                    
                    return (
                      <motion.p
                        key={lineIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + sectionIndex * 0.1 + lineIndex * 0.05, duration: 0.3 }}
                        className="text-slate-300 leading-relaxed hover:text-slate-200 transition-colors"
                      >
                        {line}
                      </motion.p>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Save Button with enhanced styling */}
          {onSave && (
            <motion.button
              onClick={onSave}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 relative overflow-hidden min-h-[44px]"
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              
              <span className="relative flex items-center space-x-2">
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Save Feedback</span>
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
