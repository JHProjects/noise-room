const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { createWaveform, downsamplePeaks } = require('../helperFunctions.js')
const { userAccounts, saveUserAccounts } = require("../dataStore.js")

const router = express.Router()

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = path.join(__dirname, '..', 'uploads', 'audio')
        cb(null, folder)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const safeBase = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
        const uniqueName = `${safeBase}_${Date.now()}${ext}`
        cb(null, uniqueName)
    }
})

const upload = multer({ storage })

// === Upload sample ===
router.post('/upload', upload.single('file'), async (req, res) => {
    const { duration, uploadedBy, name } = req.body
    const file = req.file

    if (!file || !duration || !name) {
        return res.status(400).json({ error: 'Missing file, duration, or name' })
    }

    const isSample = parseFloat(duration) < 3
    const type = isSample ? 'sample' : 'audio'

    const filePath = path.join(__dirname, '..', 'uploads', 'audio', file.filename)
    console.log(filePath)

    
    const fullPeaks = await createWaveform(filePath)
    const waveform = downsamplePeaks(fullPeaks, 18)

    const newEntry = {
        filename: file.filename,
        displayName: name.trim(),
        uploadedBy: uploadedBy || 'anonymous',
        createdAt: new Date().toISOString(),
        type,
        waveform
    }

    try {
        const libraryPath = path.join(__dirname, '..', 'uploads', 'library.json')
        const library = fs.existsSync(libraryPath)
            ? JSON.parse(fs.readFileSync(libraryPath, 'utf-8'))
            : []

        library.push(newEntry)
        fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2))
    } catch (err) {
        console.error('Failed to update library:', err)
        return res.status(500).json({ error: 'Failed to update library' })
    }

    res.json({ success: true, file: newEntry })
})


// === Search library ===
router.get('/search', (req, res) => {
    const { query, type, uploadedBy } = req.query
    const libraryPath = path.join(__dirname, '..', 'uploads', 'library.json')

    let library = []
    try {
        if (fs.existsSync(libraryPath)) {
            const raw = fs.readFileSync(libraryPath)
            library = JSON.parse(raw)
        }
    } catch (err) {
        console.error('Failed to read library:', err)
        return res.status(500).json({ error: 'Failed to read library' })
    }

    const results = library.filter(entry => {
        const matchName = query ? entry.displayName.toLowerCase().includes(query.toLowerCase()) : true
        const matchType = type ? entry.type === type : true
        const matchUploader = uploadedBy ? entry.uploadedBy === uploadedBy : true
        return matchName && matchType && matchUploader
    })

    res.json({ results })
})

module.exports = router
