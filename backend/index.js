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


// Port
server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
})