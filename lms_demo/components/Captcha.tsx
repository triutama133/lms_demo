import React, { useState, useEffect, useCallback } from 'react';

interface CaptchaProps {
  onChange: (value: string) => void;
  placeholder?: string;
}

const Captcha: React.FC<CaptchaProps> = ({ onChange, placeholder = 'Ketik kode di atas' }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    onChange(''); // Reset onChange
  }, [onChange]);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    onChange(value);
  };

  return (
    <div className="captcha-container">
      <div className="captcha-display" onClick={generateCaptcha} style={{ cursor: 'pointer', marginBottom: '8px' }}>
        <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="distort">
              <feTurbulence baseFrequency="0.05" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
            </filter>
          </defs>
          <text
            x="10"
            y="35"
            fontSize="24"
            fontFamily="Arial, sans-serif"
            fill="#333"
            filter="url(#distort)"
            style={{ userSelect: 'none' }}
          >
            {captchaText}
          </text>
        </svg>
      </div>
      <input
        type="text"
        value={userInput}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />
      <button type="button" onClick={generateCaptcha} className="text-sm text-blue-600 hover:underline mt-1">
        Refresh Captcha
      </button>
    </div>
  );
};

export default Captcha;