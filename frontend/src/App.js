import React, { useState, useEffect } from 'react';
import './App.css';
import ImageCapture from './components/ImageCapture';
import TextDisplay from './components/TextDisplay';
import AudioPlayer from './components/AudioPlayer';
import VoiceGuidance from './components/VoiceGuidance';
import { processImage, verifyAudioUrl } from './services/api';

function App() {
  const [extractedText, setExtractedText] = useState('');
  const [paragraphs, setParagraphs] = useState([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [mergedData, setMergedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioVerified, setAudioVerified] = useState(false);

  useEffect(() => {
    if (audioUrl) {
      const verifyAudio = async () => {
        try {
          const isValid = await verifyAudioUrl(audioUrl);
          setAudioVerified(isValid);
        } catch (err) {
          setAudioVerified(false);
        }
      };
      verifyAudio();
    } else {
      setAudioVerified(false);
    }
  }, [audioUrl]);

  const handleImageCapture = async (imageFile) => {
    setIsLoading(true);
    setError('');
    setAudioUrl('');
    setMergedData(null);
    try {
      const response = await processImage(imageFile);
      setExtractedText(response.text);
      setParagraphs(response.paragraphs || []);
      if (response.audio_url) setAudioUrl(response.audio_url);
      if (response.merged_data) setMergedData(response.merged_data);
    } catch (err) {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>OCR & TTS Application</h1>
        <p>Capture an image with Bengali text to extract and hear it</p>
      </header>
      
      <main className="App-main">
        <VoiceGuidance />
        <div className="capture-section">
          <ImageCapture onCapture={handleImageCapture} isLoading={isLoading} />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="results-section">
          {extractedText && (
            <>
              <TextDisplay text={extractedText} paragraphs={paragraphs} />
              {audioUrl && mergedData && (
                <AudioPlayer audioUrl={audioUrl} mergedData={mergedData} defaultSpeed={1.0} />
              )}
            </>
          )}
        </div>
      </main>
      
      <footer className="App-footer">
        <p>OCR-TTS Application &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
