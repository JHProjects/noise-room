import { useEffect, useState, useRef } from 'react'
import { socket } from '../socket.js'
import { createAndAddTrack } from '../utils/compositionHelper.js'

import TimeHead from './TimeHead.jsx'
import Track from './Track.jsx'
import VerticalScrollbar from './VerticalScrollbar.jsx'
import HorizontalScrollbar from './HorizontalScrollbar.jsx'
import VFXbackground from './VFXbackground.jsx'
import '../styles/Main.css'

import { useSequencerCtx } from '../context/SequencerContext.js'
import { useUser } from '../context/UserContext.jsx'

const priceForAddingTrack = 150

function Main() {
    // States
    const [sampleHovering, setSampleHovering] = useState(false)
    const [scrollX, setScrollX] = useState(0)

    // References
    const compositionContainerRef = useRef(null)
    const tracksContainerRef = useRef(null)

    // Context
    const {
        composition,
        setComposition,
        step,
        totalTokensSpent
    } = useSequencerCtx()

    const { removeTokens } = useUser()



    // Functions
    const handleDropSample = (e) => {
        e.preventDefault()
        setSampleHovering(false)

        const success = removeTokens(priceForAddingTrack)
        if (!success) {
            console.log("not enough money.")
            return
        }

        const data = e.dataTransfer.getData("application/json")
        if (!data) return

        const sample = JSON.parse(data)

        createAndAddTrack({ sample, composition, setComposition, socket, priceForAddingTrack })


        // e.preventDefault()
        // setSampleHovering(false)

        // const data = e.dataTransfer.getData("application/json")
        // if (!data) return

        // const sample = JSON.parse(data)
        // let folder = 'audio'
        // const samplePath = `/uploads/${folder}/${sample.filename}`

        // const newTrack = {
        //     id: crypto.randomUUID(),
        //     name: sample.displayName,
        //     type: sample.type,
        //     sampleUrl: samplePath,
        //     sampleUploadedBy: sample.uploadedBy,
        //     pan: 0,
        //     volume: 80,
        //     notes: Array(composition.measures).fill().map(() =>
        //         Array(composition.beatsPerMeasure).fill().map(() => ({ 
        //             on: false, 
        //             toggleCount: 0,
        //             noteCost: 1
        //         }))
        //     ),
        // }

        // const updatedCompLocal = {
        //     ...composition,
        //     tracks: [...composition.tracks, newTrack],
        // }
        // setComposition(updatedCompLocal)

        // socket.emit("add_track", newTrack)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setSampleHovering(true)
    }


    // Sync scroll position
    useEffect(() => {
        const container = document.querySelector('.composition-container')
        if (!container) return
        const handleScroll = () => requestAnimationFrame(() => setScrollX(container.scrollLeft))
        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
    }, [])


    return (
        <main>
            {composition.tracks.length > 0 && (
                <>
                    <VerticalScrollbar targetRef={tracksContainerRef} customClass={'tracks-scrollbar'} comp={composition} />
                    <HorizontalScrollbar targetRef={compositionContainerRef} customClass={'composition-scrollbar'} comp={composition} />
                </>
            )}

            <div className={`drop-here-icon ${sampleHovering ? 'visible' : ''}`}></div>

            <div
                ref={compositionContainerRef}
                className='composition-container'
                onDragOver={(e) => { handleDragOver(e) }}
                onDragExit={(e) => setSampleHovering(false)}
                onDrop={handleDropSample}
            >

                <TimeHead tracks={composition.tracks} step={step} totalTokensSpent={totalTokensSpent} />

                <div className="tracks-container" ref={tracksContainerRef}>
                    {composition.tracks?.map((track, index) => (
                        <Track
                            key={track.id}
                            track={track}
                            index={index}
                            currentStepIndex={step}
                            scrollX={scrollX}
                        />
                    ))}
                </div>

                {Array.isArray(composition.tracks) && composition.tracks.length === 0 && (
                    <div className='composition-empty-panel panel'>
                        <h2>I'm soooo empty... 😭</h2>
                        <p>please, start by searching and dragging and audio track into me!</p>
                    </div>
                )}
            </div>

            {composition && (<VFXbackground />)}
        </main>
    )
}

export default Main