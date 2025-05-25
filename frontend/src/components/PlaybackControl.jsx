import { useEffect } from 'react'
import { useSequencerCtx } from '../context/SequencerContext.js'


function PlaybackControl() {
    const {
        resetPlayback,
        goNextMeasure,
        isPlaying,
        togglePlayback
    } = useSequencerCtx()



    // Add event listeners to play/pause using spacebar and arrow keys
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return // avoid messing with form inputs

            switch (e.code) {
                case 'Space':
                    e.preventDefault()
                    togglePlayback()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    resetPlayback()
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    goNextMeasure()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [togglePlayback, resetPlayback, goNextMeasure])


    return (
        <div className='playback-controls'>
            <i
                className={`icon to-start`}
                onClick={resetPlayback}
            />
            <i
                className={`icon play  ${isPlaying ? 'pause' : ''}`}
                onClick={togglePlayback}
            />
            <i
                className={`icon to-next`}
                onClick={goNextMeasure}
            />
        </div>
    )
}

export default PlaybackControl