import React, { useState, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import ColorThief from 'colorthief';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [borderGradient, setBorderGradient] = useState('linear-gradient(45deg, #f093fb 0%, #f5576c 100%)');
  
  const [gallery, setGallery] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [theme, setTheme] = useState('light');

  const imageRef = useRef(null);
  const colorThief = new ColorThief();

  // Load saved data
  useEffect(() => {
    const savedGallery = JSON.parse(localStorage.getItem('ai-gallery')) || [];
    setGallery(savedGallery);
    const savedTheme = localStorage.getItem('ai-theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // Save theme changes
  useEffect(() => {
    localStorage.setItem('ai-theme', theme);
  }, [theme]);

  // Extract colors
  useEffect(() => {
    if (!image || !imageRef.current) return;
    const img = imageRef.current;
    
    const handleImageLoad = () => {
      try {
        const palette = colorThief.getPalette(img, 3);
        const color1 = `rgb(${palette[0].join(',')})`;
        const color2 = `rgb(${palette[1].join(',')})`;
        const color3 = `rgb(${palette[2].join(',')})`;
        setBorderGradient(`linear-gradient(45deg, ${color1}, ${color2}, ${color3})`);
      } catch (error) {
        console.error("Could not extract colors", error);
      }
    };

    if (img.complete) handleImageLoad();
    else img.addEventListener('load', handleImageLoad);
    return () => img.removeEventListener('load', handleImageLoad);
  }, [image]);

  const generateImage = async () => {
    if (!prompt) return alert("Please enter a text prompt!");

    setLoading(true);
    setImage(null);
    setBorderGradient('linear-gradient(45deg, #f093fb 0%, #f5576c 100%)');

    const seed = Math.floor(Math.random() * 1000000);

    try {
      const response = await fetch('https://ai-backend-nvog.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, seed }),
      });

      const data = await response.json();

      if (data.photo) {
        setImage(`data:image/jpeg;base64,${data.photo}`);
        const newItem = { prompt, seed, timestamp: Date.now() };
        const newGallery = [newItem, ...gallery];
        setGallery(newGallery);
        localStorage.setItem('ai-gallery', JSON.stringify(newGallery));
      } else {
        alert("Failed to get image data.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setIsResetting(true);
    setPrompt('');
    setImage(null);
    setBorderGradient('linear-gradient(45deg, #f093fb 0%, #f5576c 100%)');
    setTimeout(() => {
        setIsResetting(false);
    }, 300);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const downloadImage = async (imgUrl, filename) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `ai-generated-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(imgUrl, '_blank');
    }
  };

  const clearGallery = () => {
    if(window.confirm("Are you sure you want to delete all history?")) {
      setGallery([]);
      localStorage.removeItem('ai-gallery');
    }
  };

  return (
    <div className={`min-vh-100  p-3 position-relative overflow-hidden ${isResetting ? 'animate-flash' : ''} ${theme === 'dark' ? 'dark-mode' : ''}`}>
      
      <div 
        className={`sidebar-overlay ${showGallery ? 'active' : ''}`} 
        onClick={() => setShowGallery(false)}
      ></div>

      {/* SIDEBAR */}
      <div className={`gallery-sidebar ${showGallery ? 'open' : ''}`}>
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light sticky-top">
          <h5 className="mb-0 fw-bold text-primary">
            <i className="bi bi-clock-history me-2"></i>History ({gallery.length})
          </h5>
          <button onClick={() => setShowGallery(false)} className="btn btn-sm btn-close"></button>
        </div>

        <div className="p-3">
          {gallery.length === 0 ? (
            <div className="text-center text-muted mt-5">
              <i className="bi bi-images fs-1 opacity-25"></i>
              <p className="mt-2">No images yet.<br/>Start dreaming!</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <button onClick={clearGallery} className="btn btn-outline-danger btn-sm w-100 mb-2">
                <i className="bi bi-trash me-1"></i> Clear All
              </button>

              {gallery.map((item, index) => (
                <div key={index} className="gallery-card bg-white rounded-3 p-2 shadow-sm position-relative">
                  <div className="ratio ratio-1x1 rounded-2 overflow-hidden mb-2 bg-light">
                    <img 
                      src={`https://image.pollinations.ai/prompt/${encodeURIComponent(item.prompt)}?seed=${item.seed}&width=512&height=512&nologo=true`}
                      className="object-fit-cover w-100 h-100"
                      alt={item.prompt}
                      loading="lazy"
                    />
                  </div>
                  <p className="gallery-prompt mb-2 text-truncate-3">
                    {item.prompt}
                  </p>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <small className="text-muted" style={{fontSize: '0.7rem'}}>
                      {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </small>
                    <button 
                      className="btn btn-sm btn-light text-primary hover-scale"
                      title="Download High Res"
                      onClick={() => {
                        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.prompt)}?seed=${item.seed}&width=1024&height=1024&nologo=true`;
                        downloadImage(url, `saved-${item.seed}.jpg`);
                      }}
                    >
                      <i className="bi bi-download"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container animate-slide-up">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            
            <div className="card shadow-lg border-0 rounded-4"> 
              <div className="card-header bg-primary text-white py-4 rounded-top-4 position-relative">
                <div className="text-center">
                  <h1 className="h3 fw-bold mb-0">AI Image Studio</h1>
                  <small className="opacity-75">Turn ideas into visuals instantly</small>
                </div>

                {/* ---THEME BUTTON --- */}
                <button 
                  onClick={toggleTheme}
                  className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-4 shadow-sm rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '50px', height: '50px' }} 
                  title="Toggle Dark Mode"
                >
                  {theme === 'light' ? (
                    <i className="bi bi-moon-fill text-dark fs-4"></i> 
                  ) : (
                    <i className="bi bi-sun-fill text-warning fs-4"></i> 
                  )}
                </button>

                {/* --- GALLERY BUTTON --- */}
                <button 
                  onClick={() => setShowGallery(true)}
                  className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-4 fw-bold shadow-sm d-flex align-items-center gap-2 px-4 py-2" // Added padding, removed btn-sm
                >
                  <i className="bi bi-grid-3x3-gap-fill text-primary fs-5"></i> 
                  <span className="d-none d-sm-inline fs-6">Gallery</span>
                </button>
              </div>

              <div className="card-body p-4 p-md-5">
                <div className="row g-5">
                  
                  {/*--Inputs--*/}
                  <div className="col-md-6 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-bold text-secondary mb-0">Describe your vision:</label>
                        <button 
                            onClick={resetApp} 
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            title="Start fresh"
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i> Reset
                        </button>
                    </div>

                    <TextareaAutosize
                      minRows={3}
                      maxRows={8}
                      className="form-control form-control-lg border-2 shadow-sm mb-4 textarea-no-resize" 
                      placeholder="An astronaut riding a horse on Mars, realistic 8k..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button
                      onClick={generateImage}
                      disabled={loading}
                      className={`btn btn-lg w-100 fw-bold py-3 btn-transition ${
                        loading ? 'btn-secondary' : 'btn-primary shadow'
                      }`}
                    >
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Dreaming...</>
                      ) : '✨ Generate Image'}
                    </button>
                  </div>

                  {/*-- Right Column: Result--*/}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-secondary">Your Result:</label>
                    <div 
                      className={`position-relative rounded-3 mb-3 ${image ? 'glowing-border' : ''}`}
                      style={{ '--border-gradient': borderGradient }}
                    >
                      <div className="d-flex align-items-center justify-content-center rounded-3 border border-2 border-dashed border-secondary-subtle overflow-hidden image-box">
                        {loading ? (
                          <div className="text-center text-primary">
                            <div className="spinner-grow mb-3 spinner-large" role="status"></div>
                            <p className="mb-0 fw-bold animate-pulse">AI is working...</p>
                          </div>
                        ) : image ? (
                          <img 
                            ref={imageRef}
                            src={image} 
                            alt="AI Generated" 
                            className="img-fluid rounded shadow-sm w-100 h-100 object-fit-contain image-fade-in" 
                            crossOrigin="anonymous" 
                          />
                        ) : (
                          <div className="text-center text-muted opacity-50">
                            <i className="bi bi-image fs-1 d-block mb-2"></i>
                            <p>Image will appear here</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => downloadImage(image)} 
                      disabled={!image} 
                      className={`btn w-100 fw-bold py-2 shadow-sm btn-transition ${
                        !image ? 'btn-secondary opacity-50' : 'btn-success'
                      }`}
                    >
                      <i className="bi bi-download me-2"></i> Download Image
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
