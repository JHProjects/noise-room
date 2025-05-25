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
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


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


// Port
const PORT = 3001
server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
})