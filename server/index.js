import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet'; 

const app = express();

// --- SECURITY ACTION 1: SECURE HEADERS ---
app.use(helmet()); 

// --- SECURITY ACTION 2: RESTRICT ACCESS (CORS) ---
const allowedOrigins = [
  'https://ai-image-studio-lake.vercel.app', 
  'http://localhost:5173' 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy: Access Denied'), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json({ limit: '10kb' })); // Limit body size to prevent huge payloads

// --- SECURITY ACTION 3: RATE LIMITING ---
const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 20, 
    message: { message: "Too many requests, please cool down." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/generate', limiter);

app.get('/', (req, res) => {
  res.send('Secure AI Server is Running');
});

app.post('/api/generate', async (req, res) => {
  try {
    let { prompt, seed } = req.body; 
    
    // --- SECURITY ACTION 4: INPUT SANITIZATION ---
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Invalid prompt" });
    }

    // Cut off prompt if it's too long (max 500 chars)
    if (prompt.length > 500) {
        prompt = prompt.substring(0, 500);
    }

    console.log(`Generating: "${prompt}"`);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=512&height=512&nologo=true`;

    const response = await fetch(imageUrl);
    
    if (!response.ok) {
        throw new Error(`AI Provider Error: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    res.status(200).json({ photo: base64Image });

  } catch (error) {
    // --- SECURITY ACTION 5: ERROR HIDING ---
    console.error("Server Error:", error.message);
    // Don't send the real error details to the user
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Secure Server started on port ${PORT}`));
