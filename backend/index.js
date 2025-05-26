require("dotenv").config()
const express = require("express")
const http = require("http")
const cors = require("cors")
const path = require("path")
const { Server } = require("socket.io")
const sampleRoutes = require('./routes/samples')
const syncLibrary = require("./updateLibrary")
const setupSocketHandlers = require("./socketHandlers")

const app = express()
const server = http.createServer(app)

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173"
const PORT = process.env.PORT || 3001

console.log("CLIENT_URL:", CLIENT_URL)
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL, // full UR
        methods: ["GET", "POST"]
    }
})

app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.static(path.join(__dirname, 'public')));


// Example REST route
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend!" })
})


// Update library.json
syncLibrary()

// Mount the samples.js route
app.use('/api/samples', sampleRoutes)


// Set up socket.io handlers
setupSocketHandlers(io)

const frontendPath = path.join(__dirname, 'public')
// Catch-all route to serve frontend
try {
    app.get('/*any', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'))
    })
} catch (err) {
    console.error('Error in catch-all route:', err)
}

const testPath = path.join(__dirname, '..', 'uploads', 'audio')


// Check if folder exists, create if not
if (!fs.existsSync(testPath)) {
  fs.mkdirSync(testPath, { recursive: true })
  console.log('Created uploads/audio folder')
}

// Check write access tp a test folder
fs.access(testPath, fs.constants.W_OK, (err) => {
  if (err) {
    console.error('No write permission to uploads/audio folder:', err)
  } else {
    console.log('uploads/audio folder is writable')
  }
})

// check if server can use ffmpeg directly
const { exec } = require('child_process');
exec('ffmpeg -version', (err, stdout, stderr) => {
  if (err) {
    console.error('ffmpeg not found');
  } else {
    console.log('ffmpeg version:', stdout);
  }
})


// Port
server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
})