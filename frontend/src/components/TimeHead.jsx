import { useEffect, useRef, useState } from 'react'
import { useSequencerCtx } from '../context/SequencerContext.js'
import { socket } from '../socket.js'

const data = 1

function TimeHead({ tracks, step }) {
    // Context
    const { composition } = useSequencerCtx()

    const [showInfo, setShowInfo] = useState(false)

    const addOneMeasure = () => {
        socket.emit("add_measure", (data))
    }


    return (
        <div className="time-head-grid">
            <div className="time-head-container">
                {tracks[0] && (<div className='notes-border head' />)}
                <div className="time-heads-groups">
                    {tracks.length > 0 &&
                        tracks[0].notes.map((group, groupIndex) =>
                            <div
                                key={groupIndex}
                                className={`time-head-group`}
                            >
                                {group.map((_, headIndex) => {
                                    const flatIndex = groupIndex * tracks[0].notes[0].length + headIndex
                                    const isActive = flatIndex === step
                                    return (
                                        <div
                                            key={`${groupIndex}-${headIndex}`}
                                            className={`time-head${isActive ? " active" : ""} ${flatIndex % 2 == 0 ? '' : 'semi-beat'} ${groupIndex % 2 ? " even-measure" : ""}`}
                                        >
                                            {flatIndex % 8 == 0 && <p className={`time-head-number ${flatIndex % 16 == 8 ? 'even': ''}`}>{groupIndex +1}</p>}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }
                </div>
                {/* <div className='notes-border end head' /> */}
                {tracks[0] && (
                    <div 
                        className='token-amount-to-add-measure'
                        >
                        <i className="icon add-measure" onClick={() => {setShowInfo((prev) => !prev)}}  onMouseEnter={() => {setShowInfo((prev) => !prev)}} onMouseLeave={() => {setShowInfo(false)}}/>
                        {showInfo && (
                            <div className='panel add-measure-panel' >
                                <p>For next measure all users together must spend <span>{composition.amountForNextMeasure - composition.tokensSpent} more</span> tokens.</p>
                                {composition.tokensSpent} / <span>{composition.amountForNextMeasure} <i className="icon note"/></span> 
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default TimeHead