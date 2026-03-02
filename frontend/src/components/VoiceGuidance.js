import { useEffect } from 'react';

const VoiceGuidance = () => {
  // Global listener: whenever spacebar is pressed anywhere, toggle guidance.
  useEffect(() => {
    const handleKey = (e) => {
      // Use capture mode so that even if another element is focused, we still get the event.
      if (e.code === "Tab") {
        // Prevent default only if you want to override (you can remove preventDefault if it conflicts)
        e.preventDefault();
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        } else {
          const instructions = `
          Welcome to the OCR and Text to Speech application.
          To upload an image, press the U key.
          To capture an image from your webcam, press the C key.
          Once your image is processed, use Space to play or pause audio.
          Use Arrow keys to navigate words, Up/Down arrows to navigate sentences.
          Use Page Up/Page Down keys to move between paragraphs.
          Hold Shift and press Arrow keys to skip 5 seconds.
          Use the equal and minus keys to adjust playback speed.
          `;
          const utterance = new SpeechSynthesisUtterance(instructions);
          utterance.lang = 'en-US';
          utterance.rate = 1;
          window.speechSynthesis.speak(utterance);
        }
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, []);

  return null;
};

export default VoiceGuidance;
