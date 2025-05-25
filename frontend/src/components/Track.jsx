import { useEffect, useState, useRef } from 'react'
import { socket } from '../socket.js'
import { useUser } from '../context/UserContext.jsx'

import '../styles/Track.css'

function Track({ track, index, currentStepIndex, scrollX }) {
    const { userData, removeTokens } = useUser()

    const [pan, setPan] = useState(0);
    const [volume, setVolume] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const titleRef = useRef()
    const panelRef = useRef()
    const posRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

    const deletePrice = 400

    const toggleNote = (groupIndex, stepIndex, noteCost) => {
        const success = removeTokens(noteCost)
        if (!success) return // not enough money
        socket.emit("toggle_note", {
            trackId: track.id,
            groupIndex,
            stepIndex,
            noteCost
        })
    }

    const editTrack = (type) => {
        socket.emit("edit_track_properties", {
            trackId: track.id,
            type: type,
            panValue: pan,
            volumeValue: volume
        })
    }

    const deleteTrack = () => {
        const success = removeTokens(deletePrice)
        if (!success) {
            console.log('not enough money to delte a track...')
            return
        }
        const trackId = track.id
        socket.emit("delete_track", { trackId, deletePrice })
    }

    useEffect(() => {
        setPan(track.pan)
        setVolume(track.volume)
    }, [track])

    // fix Track Title staying in place when scrolling when the scrollX changes.
    useEffect(() => {
        titleRef.current.style.transform = `translateX(${scrollX}px)`
    }, [scrollX])

    useEffect(() => {
        const panel = panelRef.current
        const handle = panel // or use a child div if you only want part of it draggable
        if (!handle) return
    
        const isInteractive = (el) => {
            const tag = el.tagName.toLowerCase()
            return ['input', 'button', 'textarea', 'select', 'label', 'i'].includes(tag)
        }
    
        const onMouseDown = (e) => {
            if (isInteractive(e.target)) return
            posRef.current.offsetX = e.clientX - panel.offsetLeft
            posRef.current.offsetY = e.clientY - panel.offsetTop
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        }
    
        const onMouseMove = (e) => {
            const x = e.clientX - posRef.current.offsetX
            const y = e.clientY - posRef.current.offsetY
            posRef.current.x = x
            posRef.current.y = y
            panel.style.left = `${x}px`
            panel.style.top = `${y}px`
        }
    
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }
    
        const onTouchStart = (e) => {
            if (isInteractive(e.target)) return
            const touch = e.touches[0]
            posRef.current.offsetX = touch.clientX - panel.offsetLeft
            posRef.current.offsetY = touch.clientY - panel.offsetTop
            document.addEventListener('touchmove', onTouchMove)
            document.addEventListener('touchend', onTouchEnd)
        }
    
        const onTouchMove = (e) => {
            const touch = e.touches[0]
            const x = touch.clientX - posRef.current.offsetX
            const y = touch.clientY - posRef.current.offsetY
            posRef.current.x = x
            posRef.current.y = y
            panel.style.left = `${x}px`
            panel.style.top = `${y}px`
        }
    
        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove)
            document.removeEventListener('touchend', onTouchEnd)
        }
    
        handle.addEventListener('mousedown', onMouseDown)
        handle.addEventListener('touchstart', onTouchStart)
    
        return () => {
            handle.removeEventListener('mousedown', onMouseDown)
            handle.removeEventListener('touchstart', onTouchStart)
        }
    }, [])
    

    return (
        <div className='track'>
            <div
                ref={panelRef}
                className={`panel track-context-settings ${isSettingsOpen ? '' : 'closed'}`}

            >
                <div className='track-settings'>
                    <p className='title'><span className='context-menu-index'>{index+1}</span> {track.name}</p>

                    <p className='panning-title'>Panning</p>
                    <span className='track-pan-audio'>
                        <input
                            className='slider'
                            type="range"
                            value={pan}
                            onChange={(e) => setPan(Number(e.target.value))}
                            onMouseUp={() => editTrack('pan')}
                            min={-10} max={10}
                        />
                        <p>{pan}</p>
                    </span>

                    <p className='panning-title volume-slider'>Volume</p>
                    <span className='track-pan-audio'>
                        <input
                            className='slider'
                            type="range"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            onMouseUp={() => editTrack('volume')}
                            min={0} max={100}
                        />
                        <p>{volume}</p>
                    </span>

                    <button onClick={() => setConfirmDelete(true)}><i className='delete icon track-delete' />Delete</button>

                </div>
                <i className='icon close' onClick={() => setIsSettingsOpen(prev => !prev)} />
            </div>
            <div className='track-title' ref={titleRef}>
                <p>{track.name}</p>
                <div className='track-settings-icons'>
                    <p className='track-index'>{index+1}</p>
                    <i className='settings icon' onClick={() => setIsSettingsOpen(prev => !prev)} />
                    <i className='delete icon track-delete small-delete' onClick={() => setConfirmDelete(true)} />
                </div>
            </div>
            <div className='track-timeline'>
                {/* <div className='notes-border' /> */}

                <div className='track-notes'>
                    {track.notes.map((group, groupIndex) => (
                        <div
                            key={groupIndex}
                            className={`note-group ${groupIndex % 2 === 0 ? 'even' : 'odd'}`}
                        >
                            {group.map((step, stepIndex) => {
                                const flatIndex = groupIndex * track.notes[0].length + stepIndex
                                const isActive = flatIndex === currentStepIndex
                                return (
                                    <div
                                        title={`price: ${step.noteCost}`}
                                        key={stepIndex}
                                        className={`note-step ${step.on ? 'on' : 'off'} ${isActive ? 'active' : ''} ${stepIndex % 2 == 0 ? '' : 'semi-beat'}`}
                                        onClick={() => toggleNote(groupIndex, stepIndex, step.noteCost)}
                                    >
                                        <span className="note-cost">
                                            {[...Array(Math.min(10, parseInt(step.toggleCount / 10)))].map((_, i) => (
                                                <div key={i}  />
                                            ))}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
                <div className='notes-border end' />
            </div>
            {confirmDelete && (
                <div   
                    className='delete-confirm-modal modal'
                    onClick={e => {if (e.target.classList.contains('delete-confirm-modal')) setConfirmDelete(false)}}>
                    <div className='delete-confirm-panel panel'>
                        <div className='head'>
                            <h2>Delete <span>{track.name}</span> from the composition?</h2>
                            <i className='icon close' onClick={() => setConfirmDelete(false)} />
                        </div>
                        <div className='body'>
                            <p>You can always add this track back from the searchbar...</p>
                            <div className='buttons-delete'>
                                <button onClick={deleteTrack}>Delete for <span className='price'> {deletePrice} <i className='icon note' /></span></button>
                                <button  className='secondary' onClick={() => {setConfirmDelete(false)}}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Track
