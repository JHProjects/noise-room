import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
const uploadsURL = `${backendUrl}/uploads/`

function SampleSearchResult({ sample, setPanelOpen, isUserAudio }) {
    const [isAudio, setIsAudio] = useState(false)

    // Effects
    useEffect(() => {
        if (sample.type == 'audio') setIsAudio(true)
    }, [sample])

    // Preview Sample
    const previewSample = async () => {
        await Tone.start()

        let folder = 'audio'
        // if (sample.type == 'audio') folder = 'audio'

        const player = new Tone.Player({
            url: `${uploadsURL}${folder}/${sample.filename}`, // adjust this if needed
            autostart: true
        }).toDestination()

        player.onstop = () => player.dispose()
    }

    const handleDragStart = (e) => {
        // document.body.style.cursor = 'grabbing'
        e.dataTransfer.setData("application/json", JSON.stringify(sample))
        e.dataTransfer.effectAllowed = "copy"

        // Create preview element
        const dragPreview = document.createElement("div")
        dragPreview.style.position = "absolute"
        dragPreview.style.top = "-1000px"
        dragPreview.style.display = "flex"
        dragPreview.style.alignItems = "center"
        dragPreview.style.gap = "6px"
        dragPreview.style.padding = "6px 20px"
        dragPreview.style.background = "var(--primary-dark)"
        dragPreview.style.color = e.target.style.color
        dragPreview.style.fontSize = e.target.style.fontSize
        dragPreview.style.fontFamily = 'Familjen Grotesk, Avenir, Helvetica, Arial, sans-serif'
        dragPreview.style.fontFamily = "Familjen Grotesk"
        dragPreview.style.borderTop = "var(--border-thin-top)"
        dragPreview.style.borderLeft = "var(--border-thin-left)"
        dragPreview.style.fontFamily = "sans-serif"
        dragPreview.style.borderRadius = "8px"
        dragPreview.style.boxShadow = "0 6px 24px rgba(0,0,0,0.5)"
        dragPreview.style.zIndex = "9999"
        dragPreview.style.pointerEvents = "none"

        // Optional: use any icon class you already use
        const icon = document.createElement("i")
        icon.className = "icon eq" // or whatever your sample icon is
        icon.style.display = "inline-block"
        icon.style.width = "22px"
        icon.style.height = "22px"
        icon.style.marginLeft = "-6px"

        let notePrice = -30
        const price = document.createElement("div")
        price.innerHTML = `${notePrice} <i class="icon note"></i>`
        price.style.display = "flex"
        price.style.alignItems = "center"
        price.style.marginLeft = "10px"
        price.style.color = "var(--primary-med)"
        price.style.fontFamily = "Familjen Grotesk"

        const label = document.createElement("span")
        label.innerText = sample.displayName
        label.style.fontFamily = "Familjen Grotesk"
        label.style.color = "var(--primary-grey)"


        dragPreview.appendChild(icon)
        dragPreview.appendChild(label)
        dragPreview.appendChild(price)
        
        document.body.appendChild(dragPreview)
        e.dataTransfer.setDragImage(dragPreview, 0, 0)

        setTimeout(() => {
            document.body.removeChild(dragPreview)
            setPanelOpen(false)
        }, 0)
    }

    const handleDragEnd = () => {
        document.body.style.cursor = ''
    }

    // Custom Clamp() function
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value))
    }


    return (
        <li
            className={`search-result ${isAudio ? 'type-audio' : ''}`}
            draggable
            onDragStart={handleDragStart}
            
        // onDragEnd={handleDragEnd}
        >
            <div className="left-side">
                <i className="icon eq"  onClick={previewSample}/>
                <div className='title-container'  onClick={previewSample}>
                    <span className='record-sample-button-title'>{sample.displayName}</span>
                    <span className='subtitle'>Uploaded by {isUserAudio ? 'You' : sample.uploadedBy}</span>
                </div>
            </div>
            <div className="waveform">
                <span  onClick={previewSample} className='preview-waveform' >
                    {sample.waveform?.map((v, i) => (
                        <div
                            key={i}
                            className="bar"
                            style={{
                                height: `${clamp(v * 100, 10, 100)}%`
                            }}
                        />
                    ))}
                </span>
                <i className="icon add" />
            </div>
        </li>
    )
}

export default SampleSearchResult