
import React, { useState, useCallback } from 'react';
import { getPresentationFeedback } from './services/geminiService';
import type { StructuredFeedback } from './types';
import { CameraIcon, DocumentTextIcon, LightBulbIcon, PresentationChartBarIcon, SparklesIcon } from './components/Icons';

// Helper function defined outside the component to prevent re-creation on re-renders
const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string; name: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      resolve({ mimeType, data, name: file.name });
    };
    reader.onerror = (error) => reject(error);
  });
};


// Child component defined outside the parent component
const FileInput: React.FC<{
  id: string;
  label: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, accept, icon, file, onFileChange }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <label htmlFor={id} className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-colors">
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        {icon}
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span></p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{file ? file.name : accept}</p>
      </div>
      <input id={id} type="file" className="sr-only" accept={accept} onChange={onFileChange} />
    </label>
  </div>
);

// Child component for displaying feedback
const FeedbackDisplay: React.FC<{ feedback: StructuredFeedback }> = ({ feedback }) => (
  <div className="space-y-6">
    {Object.entries(feedback).map(([key, value]) => (
      <div key={key} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
        {key === 'actionableSummary' && Array.isArray(value) ? (
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            {value.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{value}</p>
        )}
      </div>
    ))}
  </div>
);


const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);
  const [feedbackRequest, setFeedbackRequest] = useState('');
  const [presentationContext, setPresentationContext] = useState('');
  const [feedback, setFeedback] = useState<StructuredFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) {
      setError('Please upload a presentation video.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const videoData = await fileToBase64(videoFile);
      const slidesData = slidesFile ? await fileToBase64(slidesFile) : null;

      const result = await getPresentationFeedback(videoData, slidesData, feedbackRequest, presentationContext);
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating feedback. Please check the console and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [videoFile, slidesFile, feedbackRequest, presentationContext]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Public Speaking Coach AI</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
          {/* Input Form Section */}
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-8 lg:mb-0">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Analyze Your Presentation</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FileInput
                id="video-upload"
                label="1. Upload Presentation Video*"
                accept="video/*"
                icon={<CameraIcon className="w-10 h-10 mb-3 text-gray-400" />}
                file={videoFile}
                onFileChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
              />

              <FileInput
                id="slides-upload"
                label="2. Upload Slides (Optional)"
                accept=".pdf,.ppt,.pptx"
                icon={<PresentationChartBarIcon className="w-10 h-10 mb-3 text-gray-400" />}
                file={slidesFile}
                onFileChange={(e) => setSlidesFile(e.target.files ? e.target.files[0] : null)}
              />

              <div>
                <label htmlFor="feedback-request" className="block text-sm font-medium text-gray-700 dark:text-gray-300">3. What feedback are you looking for?</label>
                <textarea
                  id="feedback-request"
                  rows={4}
                  className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  placeholder="e.g., 'Focus on my hand gestures and whether I use too many filler words.'"
                  value={feedbackRequest}
                  onChange={(e) => setFeedbackRequest(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="presentation-context" className="block text-sm font-medium text-gray-700 dark:text-gray-300">4. Presentation Context (Optional)</label>
                <textarea
                  id="presentation-context"
                  rows={3}
                  className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                  placeholder="e.g., 'This is for a final year project presentation to my class.'"
                  value={presentationContext}
                  onChange={(e) => setPresentationContext(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !videoFile}
                className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : 'Get Feedback'}
              </button>
            </form>
          </div>

          {/* Feedback Section */}
          <div className="h-full">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">AI Feedback</h2>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-md" role="alert">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              
              {isLoading && (
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <div className="flex justify-center items-center mb-4">
                     <LightBulbIcon className="h-12 w-12 text-yellow-400 animate-pulse" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Analyzing your presentation...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a few moments. Great presentations take time to perfect!</p>
                </div>
              )}

              {!isLoading && !feedback && !error && (
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Your feedback will appear here</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Complete the form to get started.</p>
                </div>
              )}

              {feedback && <FeedbackDisplay feedback={feedback} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
