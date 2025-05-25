import React, { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { socket } from './socket.js'

import { SequencerContext } from './context/SequencerContext.js'

import App from './App.jsx'

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

const fftResolution = 64
const fftCutoff = 7

function MusicLogic() {
    // States
    const [composition, setComposition] = useState({ tracks: [] }) 
    const [step, setStep] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackStarted, setPlaybackStarted] = useState(false)
    const [audioData, setAudioData] = useState({
        fft: new Array(fftResolution - fftCutoff).fill(0),
        volume: 0
    })

    // Refs
    const loopRef = useRef(null)
    const playersRef = useRef({})
    const currentStepRef = useRef(0)
    const compositionRef = useRef(composition)
    const masterVolumeRef = useRef(null)
    const lowpassRef = useRef(null)
    const fftRef = useRef(null)
    const meterRef = useRef(null)


    // Socket.io inbound
    useEffect(() => {
        socket.on("tracks_update", (comp) => {
            setComposition(comp)
            compositionRef.current = comp
            if (comp.BPM) changeBPM(comp.BPM)
            console.log(comp)
        })
        return () => socket.off("tracks_update")
    }, [])


    // EFFECTS //
    // Syncup compositionRef with composition
    useEffect(() => {
        compositionRef.current = composition
    }, [composition])


    // Create FFT analyzer with 64 or 128 bins (adjust for performance/detail)
    useEffect(() => {
        fftRef.current = new Tone.FFT(fftResolution) 
        meterRef.current = new Tone.Meter()
        
        if (masterVolumeRef.current) {
            masterVolumeRef.current.connect(fftRef.current)
            masterVolumeRef.current.connect(meterRef.current)
        }

        return () => { 
            fftRef.current?.dispose() 
            meterRef.current?.dispose()
        }
    }, [masterVolumeRef.current])

    useEffect(() => {
        let animationId

        const updateFFT = () => {
            if (fftRef.current) {
            const values = fftRef.current.getValue() // array of floats [-100..0 dB]
            const filteredValues = values.slice(0, values.length - fftCutoff)
            const volume = meterRef.current.getValue()
            setAudioData({ volume: volume, fft: filteredValues })
            }
            animationId = requestAnimationFrame(updateFFT)
        }

        updateFFT()
        return () => { cancelAnimationFrame(animationId) }
    }, [])

    // Create or update players when composition updates
    useEffect(() => {
        composition.tracks.forEach(track => {
            const existing = playersRef.current[track.id]
            
            if (!existing) {
                // Create new player with volume and pan
                const vol = normVolumeDb(track.volume)
                const pan = track.pan / 10
                const volume = new Tone.Volume(vol ?? 0)
                const panner = new Tone.Panner(pan ?? 0)
                const player = new Tone.Player({
                    url: `${backendUrl}${track.sampleUrl}`,
                    autostart: false
                }).connect(volume)

                volume.connect(panner)
                panner.connect(masterVolumeRef.current)

                playersRef.current[track.id] = { player, panner, volume }
            } else {
                // Update volume and pan on existing players
                if (typeof track.pan === 'number') {
                    existing.panner.pan.rampTo(track.pan / 10, 0.2)
                }
                if (typeof track.volume === 'number') {
                    existing.volume.volume.rampTo(normVolumeDb(track.volume), 0.1)
                }
            }
        })
    }, [composition.tracks])

    // Loop responsible for playing the notes in time
    useEffect(() => {
        loopRef.current = new Tone.Loop((time) => {
            const comp = compositionRef.current
            const { tracks, beatsPerMeasure, measures } = comp
            
            const currentStep = currentStepRef.current || 0
            if (isNaN(currentStep)) {
                console.warn('currentStepRef.current is NaN, resetting to 0')
                currentStepRef.current = 0
                return
            }

            tracks.forEach((track) => {
                const notes = track.notes
                const measureIndex = Math.floor(currentStep / beatsPerMeasure)
                const stepIndex = currentStep % beatsPerMeasure

                const playerObj = playersRef.current[track.id]
                const stepNote = notes?.[measureIndex]?.[stepIndex]

                if (playerObj?.player && stepNote?.on) {
                    playerObj.player.stop(time - 0.001)
                    playerObj.player.start(time)
                }
            })

            setStep(currentStep)
            currentStepRef.current = (currentStep + 1) % (beatsPerMeasure * measures)
        }, '32n')

        return () => {
            loopRef.current?.stop()
            loopRef.current?.dispose()
        }
    }, [])

    // Setup audio master bus
    useEffect(() => {
        const lowpass = new Tone.Filter(20000, "lowpass").toDestination()
        const masterVolume = new Tone.Volume(0).connect(lowpass)

        masterVolumeRef.current = masterVolume
        lowpassRef.current = lowpass
    }, [])


    // Functions
    const startPlayback = async () => {
        if (isPlaying) return
        await Tone.start()
        loopRef.current.start(currentStepRef.current)
        Tone.getTransport().start()
        setIsPlaying(true)
    }

    const stopPlayback = () => {
        Tone.getTransport().stop()
        Tone.getTransport().position = 0
        setIsPlaying(false)
        console.log('stopped')
    }

    const togglePlayback = () => {
        if (!playbackStarted) return
        if (isPlaying) stopPlayback()
        else startPlayback()
    }

    const resetPlayback = () => {
        currentStepRef.current = 0
        setStep(0)
    }

    const changeBPM = (BPM) => {
        Tone.getTransport().bpm.rampTo(BPM, 0.1)
    }

    const goNextMeasure = () => {
        const beatsPerMeasure = compositionRef.current.beatsPerMeasure
        const measures = compositionRef.current.measures
        let nextMeasure = (Math.floor(currentStepRef.current / beatsPerMeasure) + 1) * beatsPerMeasure
        if (nextMeasure >= (beatsPerMeasure * measures)) nextMeasure = 0
        currentStepRef.current = nextMeasure
        setStep(currentStepRef.current)
    }

     const normVolumeDb = (val) => {
        const clamped = Math.max(0, Math.min(100, val))
        // If val = 8 → 0 dB
        return (clamped / 100) * 60 - 60
    }

    const applySearchEffect = (enabled) => {
        if (!masterVolumeRef.current || !lowpassRef.current) return

        if (enabled) {
            // Quiet + underwater
            masterVolumeRef.current.volume.rampTo(-11, 0.3)
            lowpassRef.current.frequency.rampTo(510, 0.3)
            lowpassRef.current.Q.value = 2
        } else {
            // Back to normal
            masterVolumeRef.current.volume.rampTo(0, 0.6)
            lowpassRef.current.frequency.rampTo(20000, 0.6)
            lowpassRef.current.Q.value = 1
        }
    }

    const applyRecordEffect = (enabled) => {
        if (!masterVolumeRef.current || !lowpassRef.current) return

        // togglePlayback(!enabled)
        if (enabled) {
            // Quiet + underwater
            masterVolumeRef.current.volume.rampTo(-40, 0.3)
            lowpassRef.current.frequency.rampTo(100, 0.3)
            lowpassRef.current.Q.value = 2
        } else {
            // Back to normal
            masterVolumeRef.current.volume.rampTo(0, 1 )
            lowpassRef.current.frequency.rampTo(20000, 1)
            lowpassRef.current.Q.value = 1
        }
    }


    return (
        <SequencerContext.Provider value={{
            composition, setComposition,
            step, setStep,
            startPlayback,
            stopPlayback,
            resetPlayback,
            changeBPM,
            goNextMeasure,
            isPlaying, setIsPlaying,
            togglePlayback,
            applySearchEffect,
            applyRecordEffect,
            setPlaybackStarted,
            audioData
        }}>
            <App />
        </SequencerContext.Provider>
    )
}

export default MusicLogic