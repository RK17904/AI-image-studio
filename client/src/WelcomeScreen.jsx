import React, { useState, useEffect } from 'react';

// internal component: Floating Image
const FloatingImage = ({ url, size, style }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div 
      className="floating-image-container"
      style={{ 
        ...style,
        width: size,
        height: size,
        boxShadow: isLoaded ? '0 0 20px 5px rgba(255,255,255,0.2)' : 'none',
        opacity: isLoaded ? 1 : 0, 
        transition: 'opacity 0.5s ease-in-out'
      }}
    >
      <img
        src={url}
        alt=""
        onLoad={() => setIsLoaded(true)}
        className="floating-img-content"
      />
    </div>
  );
};

// --- HELPER: Perfect Shuffle (Fisher-Yates) ---
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// MAIN COMPONENT 
const WelcomeScreen = ({ onStart }) => {
  const [bgImages, setBgImages] = useState([]);

  // CONFIGURATION
  // Define base images
  const sourceImages = [
    '1.png', '2.png', '3.png', '4.png', '5.png','6.png', '7.png', '8.png','9.png', '10.png', '11.png', '12.png', '13.png', 
    '14.png', '15.png', '16.png', '17.png', '18.png', '19.png', '20.png', '21.png'
  ];

  useEffect(() => {
    // CREATE A BIG DECK
    let bigDeck = [];
    while (bigDeck.length < 15) {
      bigDeck = [...bigDeck, ...sourceImages];
    }

    // SHUFFLE THE BIG DECK
    const shuffledDeck = shuffleArray(bigDeck);

    // DEAL THEM OUT
    // Each slot gets exactly one unique card from the shuffled deck
    const images = Array.from({ length: 15 }).map((_, i) => {
      
      const imgName = shuffledDeck[i]; // DIRECT ASSIGNMENT

      // Random size
      const randomSize = Math.floor(Math.random() * 200) + 150 + 'px';

      return {
        id: i,
        url: `/backgrounds/${imgName}`, 
        size: randomSize,
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 90}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${10 + Math.random() * 10}s`, 
      };
    });
    setBgImages(images);
  }, []);

  return (
    <div className="welcome-screen">
      <div className="welcome-bg">
        {bgImages.map((img) => (
          <FloatingImage
            key={img.id}
            url={img.url}
            size={img.size}
            style={{
              left: img.left,
              top: img.top,
              animationDelay: img.animationDelay,
              animationDuration: img.animationDuration
            }}
          />
        ))}
        {/* Dark Tint Overlay */}
        <div className="blur-overlay"></div>
      </div>

      <div className="welcome-content text-center text-white">
        <h1 className="welcome-title fw-bold display-1 mb-4">
          {"WELCOME".split("").map((letter, index) => (
            <span 
              key={index} 
              className="pop-letter" 
              style={{ animationDelay: `${index * 0.1 + 0.5}s` }}
            >
              {letter}
            </span>
          ))}
        </h1>

        <p className="lead mb-5 opacity-75 animate-fade-up" style={{ animationDelay: '1.2s' }}>
          Explore the gallery of AI creativity with <b>AI Image Studio</b>.
        </p>
        
        <button 
          onClick={onStart}
          className="btn btn-light btn-lg rounded-pill px-5 fw-bold shadow-lg animate-fade-up get-started-btn"
          style={{ animationDelay: '1.5s' }}
        >
          Get Started <i className="bi bi-arrow-right ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;