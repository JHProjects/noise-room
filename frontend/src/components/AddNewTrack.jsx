import { useState, useEffect, useRef } from 'react'
import { useSequencerCtx } from '../context/SequencerContext.js'
import { useUser } from '../context/UserContext.jsx'

import SampleSearchResult from './SampleSearchResult.jsx'
import RecorderPopup from './RecorderPopup.jsx'
import '../styles/AddNewTrack.css'

function AddNewTrack() {
    const { userData, setUserData } = useUser()

    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [open, setOpen] = useState(false)
    const [isRecorderOpen, setIsRecorderOpen] = useState(false)
    const wrapperRef = useRef()
    const inputRef = useRef()

    const rewardForRecording = 1200

    // Context
    const {
        applySearchEffect,
        applyRecordEffect
    } = useSequencerCtx()


    // Effects
    useEffect(() => {
        if (!open) return

        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [open])

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
        applySearchEffect(open)
    }, [open])

    useEffect(() => {
        if (!isRecorderOpen && open) {
            applySearchEffect(open)
        } else {
            applyRecordEffect(isRecorderOpen)
        }
    }, [isRecorderOpen])



    // Fetch search query
    useEffect(() => {
        if (query.trim() === '') {
            setResults([])
            return
        }

        const controller = new AbortController()

        fetch(`http://localhost:3001/api/samples/search?query=${encodeURIComponent(query)}`, {
            signal: controller.signal
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.results)) {
                    setResults(data.results.slice(0, 7)) // max 6
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Search error:', err)
                }
            })

        return () => controller.abort()
    }, [query])


    return (
        <div
            ref={wrapperRef}
            className="add-new-track-container"
        >
            <i
                className={`icon add-new-track ${open ? 'hide' : ''}`}
                onClick={() => setOpen((prev) => !prev)}
            />

            {open && (
                <div className="add-new-track-panel panel">
                    <div className='input-container'>
                        <input
                            ref={inputRef}
                            className='search-sounds-input'
                            type="text"
                            placeholder='Search for sounds...'
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <i className='icon search' />
                    </div>

                    <div className='output-container'>
                        <ul>
                            {results.map((sample, i) => (
                                <SampleSearchResult key={i} sample={sample} author={'search'} setPanelOpen={setOpen} />
                            ))}
                        </ul>
                    </div>

                    <div className='record-sample-button-container' onClick={(e) => setIsRecorderOpen(true)}>
                        <div className='record-sample-button'>
                            <i className='icon record-sample' />
                            <div className='title-container'>
                                <span className='record-sample-button-title'>Add your own sample!</span>
                                <span className=
                                    'subtitle'>Record your own audio and get a reward</span>
                            </div>
                            <span className='reward-amount'>+{rewardForRecording} <i className='icon note' /></span>
                        </div>
                    </div>
                    
                    {userData.recordings.length > 0 && (<p className='your-samples-title'>Your recent audio files:</p>)}
                    <div className='output-container'>
                        <ul>
                            {userData?.recordings.slice(0, 4).map((sample, i) => (
                                <SampleSearchResult key={i} sample={sample} isUserAudio={true} setPanelOpen={setOpen} />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {isRecorderOpen && <RecorderPopup reward={rewardForRecording} onClose={() => setIsRecorderOpen(false)} />}
        </div>
    )
}

export default AddNewTrack