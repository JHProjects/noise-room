import { useState, useRef, useEffect } from 'react'
import useGlobalAudio from '../hooks/useGlobalAudio.js'

function IconVolume({ className }) {
  const { volume, setGlobalVolume } = useGlobalAudio()
  const [open, setOpen] = useState(false)

  /* 1 ─ keep a reference to the whole widget */
  const wrapperRef = useRef(null)

  /* 2 ─ hide slider when user clicks elsewhere */
  useEffect(() => {
    if (!open) return // nothing to do if slider is closed

    const handleClickOutside = (e) => {
      // if the click target is NOT inside the wrapper → close
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    // use both mouse & touch to cover all devices
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    // 3 ─ clean-up when component unmounts or slider closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className={`local-volume-settings ${className}`}>
      <i
        className={`icon volume ${
          volume < -59 ? 'volume-muted' : volume < -20 ? 'volume-mid' : ''
        }`}
        onClick={() => setOpen((prev) => !prev)}
      />

      {open && (
        <div className="local-volume-slider">
          <i className="icon volume-muted" />
          <input
            type="range"
            min={-60}
            max={0}
            step={1}
            value={volume}
            onChange={(e) => setGlobalVolume(Number(e.target.value))}
            title="Global volume"
          />
          <i className="icon volume" />
        </div>
      )}
    </div>
  )
}

export default IconVolume