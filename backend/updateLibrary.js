const fs = require('fs')
const path = require('path')
const mm = require('music-metadata')
const { createWaveform, downsamplePeaks } = require('./helperFunctions')

const uploadsDir = path.join(__dirname, 'uploads')
const audioDir = path.join(uploadsDir, 'audio')
const libraryPath = path.join(uploadsDir, 'library.json')

async function syncLibrary() {
    const existing = fs.existsSync(libraryPath)
        ? JSON.parse(fs.readFileSync(libraryPath, 'utf-8'))
        : []

    const libraryMap = new Map(existing.map(entry => [entry.filename, entry]))

    if (!fs.existsSync(audioDir)) return

    const audioFiles = await Promise.all(
        fs.readdirSync(audioDir)
            .filter(f => /\.(mp3|wav|ogg|webm)$/i.test(f))
            .map(async filename => {
                if (libraryMap.has(filename)) return libraryMap.get(filename)

                const filePath = path.join(audioDir, filename)

                // ⏱ Get duration in seconds
                let duration = 0
                try {
                    const metadata = await mm.parseFile(filePath)
                    duration = metadata.format.duration || 0
                } catch (err) {
                    console.warn(`⚠️ Could not read metadata for ${filename}`, err)
                }

                // Decide type based on duration (e.g. 8s threshold)
                const type = duration > 5 ? 'audio' : 'sample'

                const fullPeaks = await createWaveform(filePath)
                const waveform = downsamplePeaks(fullPeaks, 18)

                return {
                    filename,
                    displayName: path.basename(filename, path.extname(filename)),
                    uploadedBy: 'System',
                    createdAt: new Date().toISOString(),
                    type,
                    duration,
                    waveform
                }
            })
    )

    fs.writeFileSync(libraryPath, JSON.stringify(audioFiles, null, 2))
    console.log(`✅ Synced ${audioFiles.length} entries to library.json`)
}

module.exports = syncLibrary
