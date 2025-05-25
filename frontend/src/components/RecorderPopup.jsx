import { useState, useRef, useEffect } from 'react'
import { socket } from '../socket.js'
import { useUser } from '../context/UserContext.jsx'
import * as Tone from 'tone'
import '../styles/RecorderPopup.css'

function RecorderPopup({ onClose, reward }) {
    const { userData, addTokens } = useUser()

    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [trimmedAudioURL, setTrimmedAudioURL] = useState(null)
    const [trimmedBlob, setTrimmedBlob] = useState(null)
    const [waveform, setWaveform] = useState([])
    const [trimStart, setTrimStart] = useState(.15)
    const [trimEnd, setTrimEnd] = useState(1)
    const [audioName, setAudioName] = useState('')
    const [audioDuration, setAudioDuration] = useState(0)
    const [audioOriginalDuration, setAudioOriginalDuration] = useState(0)
    const [loading, setLoading] = useState(false)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])


    const nameInput = useRef(null)


    const getWaveformData = async (url, resolution = 64) => {
        const buffer = await new Tone.ToneAudioBuffer().load(url)
        const channelData = buffer.getChannelData(0)
        const samplesPerBucket = Math.floor(channelData.length / resolution)
        const waveform = Array.from({ length: resolution }, (_, i) => {
            let sum = 0
            for (let j = 0; j < samplesPerBucket; j++) {
                const sample = channelData[i * samplesPerBucket + j]
                sum += (Math.abs(sample))

            }
            return sum / samplesPerBucket
        })
        return waveform
    }

    const handleTrim = async () => {
        const sourceURL = trimmedAudioURL || audioURL
        const trimmedBlob = await trimAudioBlob(sourceURL, trimStart, trimEnd)
        const trimmedURL = URL.createObjectURL(trimmedBlob)
        setTrimmedAudioURL(trimmedURL)
        setTrimmedBlob(trimmedBlob)

        // Decode trimmedBlob to get accurate duration
        const audioCtx = new AudioContext()
        const arrayBuffer = await trimmedBlob.arrayBuffer()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        const duration = audioBuffer.duration

        setAudioDuration(duration)
    }

    const revertAudio = () => {
        setTrimmedAudioURL(null)
        setAudioDuration(audioOriginalDuration)
        getWaveformData(audioURL).then(setWaveform)
    }

    const startRecording = async () => {
        setAudioURL(null)
        setWaveform([])
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        recordedChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data)
            }
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
            setTimeout(async () => {
                const url = URL.createObjectURL(blob)
                setAudioURL(url)
                const duration = await checkDuration(url)
                setAudioDuration(duration)
                setAudioOriginalDuration(duration)
            }, 0)
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)
    }

    const stopRecording = () => {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
    }

    const saveRecording = async () => {
        if (audioName.length < 3) {
            nameInput.current.style.outline = `var(--tertiary) 1px solid`
            return
        }

        const blob = trimmedBlob || new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()

        formData.append('file', blob, 'user-recording.webm')
        formData.append('duration', audioDuration.toFixed(2))
        formData.append('name', audioName)
        formData.append('uploadedBy', userData?.username || 'anonymous')

        const res = await fetch('http://localhost:3001/api/samples/upload', {
            method: 'POST',
            body: formData,
        })

        const data = await res.json()

        if (data.success) {
            addTokens(reward)

            const newAudio = data.file
            socket.emit("upload_audio", { newAudio, reward })
            setLoading(true)
            setTimeout(e => {
                setLoading(false)
                onClose()
            }, 800)
        } else {
            console.error('Upload failed:', data)
        }
    }


    async function trimAudioBlob(audioUrl, startRatio, endRatio) {
        const ctx = new AudioContext()
        const res = await fetch(audioUrl)
        const arrayBuffer = await res.arrayBuffer()
        const originalBuffer = await ctx.decodeAudioData(arrayBuffer)

        const startTime = originalBuffer.duration * startRatio
        const endTime = originalBuffer.duration * endRatio
        const frameStart = Math.floor(startTime * originalBuffer.sampleRate)
        const frameCount = Math.floor((endTime - startTime) * originalBuffer.sampleRate)

        const trimmedBuffer = ctx.createBuffer(
            originalBuffer.numberOfChannels,
            frameCount,
            originalBuffer.sampleRate
        )

        for (let ch = 0; ch < originalBuffer.numberOfChannels; ch++) {
            const channelData = originalBuffer.getChannelData(ch).slice(frameStart, frameStart + frameCount)
            trimmedBuffer.copyToChannel(channelData, ch)
        }

        // Convert trimmed buffer back to blob (via OfflineAudioContext)
        const offlineCtx = new OfflineAudioContext(
            trimmedBuffer.numberOfChannels,
            trimmedBuffer.length,
            trimmedBuffer.sampleRate
        )
        const source = offlineCtx.createBufferSource()
        source.buffer = trimmedBuffer
        source.connect(offlineCtx.destination)
        source.start(0)
        const rendered = await offlineCtx.startRendering()

        const wavBlob = await bufferToWaveBlob(rendered)
        return wavBlob
    }

    async function bufferToWaveBlob(audioBuffer) {
        const numOfChan = audioBuffer.numberOfChannels
        const sampleRate = audioBuffer.sampleRate
        const numSamples = audioBuffer.length

        const buffer = new ArrayBuffer(numSamples * numOfChan * 2 + 44)
        const view = new DataView(buffer)

        // WAV header
        let offset = 0
        const writeString = (s) => {
            for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
            offset += s.length
        }

        writeString('RIFF')
        view.setUint32(offset, 36 + numSamples * numOfChan * 2, true); offset += 4
        writeString('WAVE')
        writeString('fmt ')
        view.setUint32(offset, 16, true); offset += 4
        view.setUint16(offset, 1, true); offset += 2
        view.setUint16(offset, numOfChan, true); offset += 2
        view.setUint32(offset, sampleRate, true); offset += 4
        view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4
        view.setUint16(offset, numOfChan * 2, true); offset += 2
        view.setUint16(offset, 16, true); offset += 2
        writeString('data')
        view.setUint32(offset, numSamples * numOfChan * 2, true); offset += 4

        // WAV body
        const channels = []
        for (let i = 0; i < numOfChan; i++) channels.push(audioBuffer.getChannelData(i))

        for (let i = 0; i < audioBuffer.length; i++) {
            for (let ch = 0; ch < numOfChan; ch++) {
                let sample = Math.max(-1, Math.min(1, channels[ch][i]))
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
                view.setInt16(offset, sample, true)
                offset += 2
            }
        }

        return new Blob([buffer], { type: 'audio/wav' })
    }


    // Custom Clamp() function
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value))
    }
    
    // Function for checking duration
    const checkDuration = async (url) => {
        const audioCtx = new AudioContext()
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        return audioBuffer.duration
    }

    function updateTrimStart(num) {
        if (num > trimEnd) {
            setTrimStart(trimEnd)
        } else {
            setTrimStart(num)
        }
    }

    function updateTrimEnd(num) {
        if (num < trimStart) {
            setTrimEnd(trimStart)
        } else {
            setTrimEnd(num)
        }
    }

    useEffect(() => {
        if (audioURL) {
            getWaveformData(audioURL).then(setWaveform)
        }
    }, [audioURL])

    useEffect(() => {
        if (trimmedAudioURL) {
            getWaveformData(trimmedAudioURL).then(setWaveform)
            setTrimStart(0)
            setTrimEnd(1)
        }
    }, [trimmedAudioURL])


    return (
        <div className='modal-overlay' onClick={e => {
            if (e.target.classList.contains('modal-overlay')) onClose()
        }}>
            {!loading && (<div className="panel recorder-popup">
                <div className='container'>

                    <div className="header">
                        <h2>Record audio</h2>
                        <i className='icon close' onClick={onClose} />
                    </div>

                    <div className="content">

                        <div className='columns'>
                            <div className='left-side'>
                                <i className='icon mic' />
                            </div>

                            <div className='right-side'>
                                <p>Press to start recording</p>
                                {!isRecording && <div className='record-button' onClick={startRecording}> <i className='icon record' /></div>}
                                {isRecording && <div className='record-button' onClick={stopRecording}> <i className='icon stop-record' /></div>}

                                <div className={`trimmer ${waveform.length ? '' : 'disabled'}`}>
                                    <input className='trim-start' type="range" min={0} max={1} step={0.01} value={trimStart} onChange={e => updateTrimStart(Number(e.target.value))} />
                                    <div className='waveform-trim-background start' style={{ width: `${trimStart * 100}%` }} />
                                    <div className="waveform-bar-container">
                                        {waveform.map((v, i) => (
                                            <div
                                                key={i}
                                                className="bar"
                                                style={{
                                                    height: `${clamp(v * 800, 5, 110)}%`
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className='waveform-trim-background end' style={{ width: `${(1 - trimEnd) * 100}%` }} />
                                    <input className='trim-end' type="range" min={0} max={1} step={0.01} value={trimEnd} onChange={e => updateTrimEnd(Number(e.target.value))} />
                                </div>

                                <div className={`audio-name-section ${audioURL ? '' : 'unactive'}`}>
                                    <p>Audio name:</p>
                                    <input type="text" onClick={() => {nameInput.current.style.outline = `none`}} ref={nameInput} maxLength={12} value={audioName} placeholder='Enter your audio title' onChange={e => setAudioName(e.target.value)} />
                                </div>


                                <div className={`after-record-buttons ${audioURL ? '' : 'unactive'}`}>
                                    <button className={`${trimmedAudioURL ? '' : 'disabled'}`} onClick={revertAudio}><i className={`icon replay`} /></button>
                                    <button onClick={handleTrim}><i className='icon cut' />Trim</button>
                                    <button 
                                        className={`upload-button 
                                            ${audioDuration < 3 ? 'sample' : 'audio'}
                                            ${audioName.length > 2 ? '' : 'no-name'}`}
                                        onClick={saveRecording}>
                                            <i className={`icon upload-cloud`} />Upload as {audioDuration < 3 ? 'Sample' : 'Audio'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <audio src={trimmedAudioURL || audioURL} controls className={`${audioURL ? '' : 'unactive'}`} />
                        {isRecording && <div className='record-animation' />}

                    </div>
                </div>
                <p className='recording-info'>audio over 3 seconds is gonna upload as a <span>type: audio,</span> not <span>type: sample!</span></p>
            </div>)}
            {loading && (<i className='icon spinner' />)}
        </div>
    )
}

export default RecorderPopup