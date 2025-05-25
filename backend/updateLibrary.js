const fs = require('fs')
const path = require('path')
const { createWaveform, downsamplePeaks } = require('./helperFunctions')

const uploadsDir = path.join(__dirname, 'uploads')
const audioDir = path.join(uploadsDir, 'audio') // only this folder now
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

                const type = 'sample'
                const filePath = path.join(audioDir, filename)
                const fullPeaks = await createWaveform(filePath)
                const waveform = downsamplePeaks(fullPeaks, 18)

                return {
                    filename,
                    displayName: path.basename(filename, path.extname(filename)),
                    uploadedBy: 'System',
                    createdAt: new Date().toISOString(),
                    type,
                    waveform
                }
            })
    )

    fs.writeFileSync(libraryPath, JSON.stringify(audioFiles, null, 2))
    console.log(`✅ Synced ${audioFiles.length} entries to library.json`)
}

module.exports = syncLibrary