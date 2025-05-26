const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const ffmpegPath = 'ffmpeg'
const { getAudioPeaks } = require('node-audio-peaks')
const { firstValueFrom } = require('rxjs')

const { chatHistory, MAX_HISTORY } = require("./dataStore")

const tempDir = path.join(__dirname, 'uploads', '.temp')
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
}

function addChatMessage(message) {
    chatHistory.push(message)
    if (chatHistory.length > MAX_HISTORY) {
        chatHistory = chatHistory.slice(-MAX_HISTORY)
    }
}


async function convertToWav(inputPath, outputPath) {
    return await new Promise((resolve, reject) => {
        execFile(ffmpegPath, [
            '-y',
            '-i', inputPath,
            '-ac', '1',
            '-ar', '44100',
            '-f', 'wav',
            outputPath
        ], (err) => {
            if (err) return reject(err)
            resolve()
        })
    })
}


async function createWaveform(originalPath) {
    const ext = path.extname(originalPath).toLowerCase();
    let wavPath = originalPath;
    let isTemp = false;

    if (ext !== '.wav') {
        const tempFilename = path.basename(originalPath, ext) + '_temp.wav';
        wavPath = path.join(tempDir, tempFilename);
        await convertToWav(originalPath, wavPath);
        isTemp = true;
    }

    // getAudioPeaks returns an observable - use firstValueFrom to await the first emitted value
    try {
        const peaks$ = getAudioPeaks(wavPath);
        const peaks = await firstValueFrom(peaks$);

        if (isTemp && fs.existsSync(wavPath)) {
            fs.unlinkSync(wavPath); // cleanup temp file
        }

        return peaks;
    } catch (err) {
        if (isTemp && fs.existsSync(wavPath)) {
            fs.unlinkSync(wavPath); // cleanup temp file
        }
        throw err;
    }
}

function downsamplePeaks(peaks, targetPoints) {
  if (peaks.length <= targetPoints) return peaks

  const chunkSize = Math.floor(peaks.length / targetPoints)
  const downsampled = []

  for (let i = 0; i < targetPoints; i++) {
    const start = i * chunkSize
    const end = start + chunkSize
    const chunk = peaks.slice(start, end)
    const avg = chunk.reduce((sum, val) => sum + val, 0) / chunk.length
    downsampled.push(avg)
  }

  return downsampled
}


module.exports = {
    addChatMessage,
    createWaveform,
    convertToWav,
    downsamplePeaks
}