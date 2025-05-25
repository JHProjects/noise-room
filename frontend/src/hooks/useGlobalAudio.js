import { useState, useCallback } from 'react'
import * as Tone from 'tone'

export default function useGlobalAudio() {
    const [volume, setVolume] = useState(0)

    const setGlobalVolume = useCallback((value) => {
        const db = parseFloat(value)
        setVolume(db)
        Tone.getContext().destination.volume.value = db;
    }, [])

    return { volume, setGlobalVolume }
}