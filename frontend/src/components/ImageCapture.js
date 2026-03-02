import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

const ImageCapture = ({ onCapture, isLoading }) => {
  const fileInputRef = useRef(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const webcamRef = useRef(null);

  // Global key listeners: 'u' for file upload, 'c' to toggle webcam capture
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (fileInputRef.current) fileInputRef.current.click();
      }
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setUseWebcam(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const handleLocalKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (useWebcam) {
        // In webcam mode, let the Capture button handle it.
      } else {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onCapture(file);
  };

  const captureWebcam = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "webcam_capture.png", { type: "image/png" });
          onCapture(file);
          setUseWebcam(false);
        });
    }
  };

  return (
    <div 
      role="button" 
      tabIndex="0" 
      onKeyDown={handleLocalKeyDown} 
      style={{ border: '1px solid #ccc', padding: '10px', cursor: 'pointer' }}
    >
      {isLoading 
        ? 'Processing...' 
        : (useWebcam 
            ? 'Webcam Mode: Press Capture button or C to exit'
            : 'Press U to upload an image or C to capture from webcam'
          )
      }
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      {useWebcam && (
        <div style={{ marginTop: '10px' }}>
          <Webcam audio={false} ref={webcamRef} screenshotFormat="image/png" />
          <div>
            <button onClick={captureWebcam}>Capture</button>
            <button onClick={() => setUseWebcam(false)}>Exit Webcam</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCapture;
