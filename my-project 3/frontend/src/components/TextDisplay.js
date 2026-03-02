import React from 'react';
import './TextDisplay.css';

const TextDisplay = ({ text, paragraphs }) => {
  return (
    <div className="text-display">
      <h2>Extracted Text</h2>
      
      {paragraphs && paragraphs.length > 0 ? (
        <div className="paragraphs">
          {paragraphs.map((paragraph, pIndex) => (
            <div key={`p-${pIndex}`} className="paragraph">
              <h3>Paragraph {pIndex + 1}</h3>
              <div className="sentences">
                {paragraph.sentences.map((sentence, sIndex) => (
                  <div key={`s-${pIndex}-${sIndex}`} className="sentence">
                    {sentence.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="raw-text">
          {text}
        </div>
      )}
      
      <div className="text-actions">
        <button 
          className="copy-button"
          onClick={() => navigator.clipboard.writeText(text)}
        >
          Copy Text
        </button>
      </div>
    </div>
  );
};

export default TextDisplay;
