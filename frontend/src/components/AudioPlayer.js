import React, { useRef, useEffect, useState } from 'react';

const AudioPlayer = ({ audioUrl, mergedData, defaultSpeed = 1.0 }) => {
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [playbackRate, setPlaybackRate] = useState(defaultSpeed);
  // We maintain a pointer for word navigation
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Extract separate arrays from mergedData
  const words = mergedData.words; // each word: { start_time_sec, end_time_sec, ... }
  const sentences = mergedData.sentences; // each sentence: { start_time_sec, end_time_sec, text, sentence_idx, paragraph_idx }
  const paragraphs = mergedData.paragraphs; // each paragraph: { start_time_sec, end_time_sec, text, paragraph_idx }

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus();
  }, []);

  // Helper: Jump audio to a given time
  const jumpToTime = (timeSec) => {
    if (audioRef.current) audioRef.current.currentTime = timeSec;
  };

  // Navigation functions (using currentWordIndex as base)
  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      const nextIdx = currentWordIndex + 1;
      setCurrentWordIndex(nextIdx);
      jumpToTime(words[nextIdx].start_time_sec);
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      const prevIdx = currentWordIndex - 1;
      setCurrentWordIndex(prevIdx);
      jumpToTime(words[prevIdx].start_time_sec);
    }
  };

  const nextSentence = () => {
    const currentSentence = sentences.find(s => s.sentence_idx === words[currentWordIndex].sentence_idx &&
                                                   s.paragraph_idx === words[currentWordIndex].paragraph_idx);
    const currentStart = currentSentence ? currentSentence.start_time_sec : 0;
    const nextSentence = sentences.find(s => s.start_time_sec > currentStart);
    if (nextSentence) {
      // Find first word in that sentence
      const nextWord = words.find(w => w.sentence_idx === nextSentence.sentence_idx && w.paragraph_idx === nextSentence.paragraph_idx);
      if (nextWord) {
        // Update word index accordingly
        const newIndex = words.findIndex(w => w.start_time_sec === nextWord.start_time_sec);
        setCurrentWordIndex(newIndex);
        jumpToTime(nextWord.start_time_sec);
      }
    }
  };

  const prevSentence = () => {
    const currentSentence = sentences.find(s => s.sentence_idx === words[currentWordIndex].sentence_idx &&
                                                   s.paragraph_idx === words[currentWordIndex].paragraph_idx);
    const currentStart = currentSentence ? currentSentence.start_time_sec : 0;
    // Find the last sentence that ends before currentStart
    const prevSentenceCandidates = sentences.filter(s => s.end_time_sec < currentStart);
    if (prevSentenceCandidates.length > 0) {
      const prevSentence = prevSentenceCandidates[prevSentenceCandidates.length - 1];
      // Find first word of that sentence
      const nextWord = words.find(w => w.sentence_idx === prevSentence.sentence_idx && w.paragraph_idx === prevSentence.paragraph_idx);
      if (nextWord) {
        const newIndex = words.findIndex(w => w.start_time_sec === nextWord.start_time_sec);
        setCurrentWordIndex(newIndex);
        jumpToTime(nextWord.start_time_sec);
      }
    }
  };

  const nextParagraph = () => {
    const currentParagraph = paragraphs.find(p => p.paragraph_idx === words[currentWordIndex].paragraph_idx);
    const currentStart = currentParagraph ? currentParagraph.start_time_sec : 0;
    const nextParagraph = paragraphs.find(p => p.start_time_sec > currentStart);
    if (nextParagraph) {
      // Find first word of that paragraph
      const nextWord = words.find(w => w.paragraph_idx === nextParagraph.paragraph_idx);
      if (nextWord) {
        const newIndex = words.findIndex(w => w.start_time_sec === nextWord.start_time_sec);
        setCurrentWordIndex(newIndex);
        jumpToTime(nextWord.start_time_sec);
      }
    }
  };

  const prevParagraph = () => {
    const currentParagraph = paragraphs.find(p => p.paragraph_idx === words[currentWordIndex].paragraph_idx);
    const currentStart = currentParagraph ? currentParagraph.start_time_sec : 0;
    const prevParagraphCandidates = paragraphs.filter(p => p.end_time_sec < currentStart);
    if (prevParagraphCandidates.length > 0) {
      const prevParagraph = prevParagraphCandidates[prevParagraphCandidates.length - 1];
      // Find first word of that paragraph
      const nextWord = words.find(w => w.paragraph_idx === prevParagraph.paragraph_idx);
      if (nextWord) {
        const newIndex = words.findIndex(w => w.start_time_sec === nextWord.start_time_sec);
        setCurrentWordIndex(newIndex);
        jumpToTime(nextWord.start_time_sec);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!audioRef.current) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause();
    } else if (e.code === 'ArrowRight' && !e.shiftKey) {
      e.preventDefault();
      nextWord();
    } else if (e.code === 'ArrowLeft' && !e.shiftKey) {
      e.preventDefault();
      prevWord();
    } else if (e.code === 'ArrowDown') {
      e.preventDefault();
      nextSentence();
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      prevSentence();
    } else if (e.code === 'PageDown') {
      e.preventDefault();
      nextParagraph();
    } else if (e.code === 'PageUp') {
      e.preventDefault();
      prevParagraph();
    } else if (e.shiftKey && e.code === 'ArrowRight') {
      e.preventDefault();
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
    } else if (e.shiftKey && e.code === 'ArrowLeft') {
      e.preventDefault();
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    } else if (e.key === '=') {
      e.preventDefault();
      let newRate = Math.round((audioRef.current.playbackRate + 0.1) * 10) / 10;
      audioRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    } else if (e.key === '-') {
      e.preventDefault();
      let newRate = audioRef.current.playbackRate - 0.1;
      if (newRate < 0.1) newRate = 0.1;
      newRate = Math.round(newRate * 10) / 10;
      audioRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  // Optionally update the current word pointer on timeupdate events
  const handleTimeUpdate = () => {
    // (Optional: you might update currentWordIndex by finding the word whose end_time_sec is just greater than current time)
  };

  return (
    <div 
      ref={containerRef}
      tabIndex="0" 
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
    >
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="auto" 
        onTimeUpdate={handleTimeUpdate}
      />
      <div style={{ marginTop: '10px' }}>
        <p><strong>Keyboard Controls:</strong></p>
        <ul>
          <li>Space: Play/Pause</li>
          <li>Arrow Right: Next Word</li>
          <li>Arrow Left: Previous Word</li>
          <li>Arrow Down: Next Sentence</li>
          <li>Arrow Up: Previous Sentence</li>
          <li>PageDown: Next Paragraph</li>
          <li>PageUp: Previous Paragraph</li>
          <li>Shift + Right Arrow: Skip +5s</li>
          <li>Shift + Left Arrow: Skip -5s</li>
          <li>= : Increase speed</li>
          <li>- : Decrease speed</li>
        </ul>
        <p>Current playback rate: {playbackRate}</p>
      </div>
    </div>
  );
};

export default AudioPlayer;
