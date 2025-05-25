import { useEffect, useState, useRef } from 'react'
import { socket } from '../socket.js'
import { useUser } from '../context/UserContext.jsx'

import PlaybackControl from './PlaybackControl.jsx'

function Tempo() {
    const { userData, removeTokens } = useUser()

    const [serverBPM, setServerBPM] = useState(123)
    const [BPM, setBPM] = useState(serverBPM)

    const minBPM = 30
    const maxBPM = 300
    const changeBPMcost = 200

    useEffect(() => {
        socket.on("tracks_update", (data) => {
            const bpm = data?.BPM
            if (typeof bpm === "number") setServerBPM(bpm)
        })
        return () => socket.off("tracks_update")
    }, [])

    useEffect(() => {
        setBPM(serverBPM)
    }, [serverBPM])

    function changeBPM(amount) {
        setBPM((prev) => {
          const newBPM = prev + amount
          if (newBPM < minBPM) return minBPM
          if (newBPM > maxBPM) return maxBPM
          return newBPM
        })
    }

    function sendBPM() {
        const success = removeTokens(changeBPMcost)
        if (!success) return

        socket.emit("edit_BPM", { BPM, changeBPMcost })
    }
    
    return (
        <div className='tempo'>
            <PlaybackControl />
        <div className='tempo-inner'>
            <span className='tempo-input'>
                <i className='icon up' onClick={() => changeBPM(+1)}></i>
                <input
                    className={BPM !== serverBPM ? "" : "input-not-changed"}
                    type="number"
                    value={BPM}
                    onChange={(e) => setBPM(Number(e.target.value))}
                    onBlur={(e) => {
                        let value = Number(e.target.value)
                        if (value < minBPM) value = minBPM
                        if (value > maxBPM) value = maxBPM
                        setBPM(value)
                    }}
                />
                <i className='icon down' onClick={() => changeBPM(-1)}></i>
            </span>
            <button
                className={BPM !== serverBPM ? "" : "input-not-changed"}
                onClick={(e) => sendBPM()}>
                Set BPM
                <span className='token-amount'><span>{changeBPMcost}</span><i className='icon note'></i></span>

            </button>
        </div>
        </div>
    )
}

export default Tempo