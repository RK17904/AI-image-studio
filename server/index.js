import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Allow JSON data to be received

// Test Route
app.get('/', (req, res) => {
  res.send('Hello from the AI Image Generator Server!');
});

// Image Generation Route
app.post('/api/generate', async (req, res) => {
  try {
    // Get the Prompt AND the Seed from the frontend
    const { prompt, seed } = req.body;
    
    console.log(`Generating: "${prompt}" with Seed: ${seed}`);

    // Construct the Pollinations.ai URL
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=512&height=512&nologo=true`;

    // Fetch the image from the AI provider
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Convert the raw image data to Base64 string
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Send the Base64 string back to the client
    res.status(200).json({ photo: base64Image });

  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ message: 'Something went wrong on the server' });
  }
});

// Start Server
const PORT = 8080;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));