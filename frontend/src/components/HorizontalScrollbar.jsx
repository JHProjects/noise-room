import { useEffect, useRef, useState } from 'react'

function HorizontalScrollbar({ targetRef, customClass, comp }) {
  const thumbRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const container = targetRef?.current
    if (!container) return
  
    const thumb = thumbRef.current
    const track = trackRef.current
    if (!thumb || !track) return
  
    const updateThumb = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      const trackWidth = track.offsetWidth
      const thumbWidth = Math.max((clientWidth / scrollWidth) * trackWidth, 40)
      const scrollRatio = scrollLeft / (scrollWidth - clientWidth)
      const maxThumbLeft = trackWidth - thumbWidth
  
      thumb.style.width = `${thumbWidth}px`
      thumb.style.left = `${scrollRatio * maxThumbLeft}px`
  
      // Hide scrollbar when no overflow
      track.style.visibility = scrollWidth <= clientWidth ? 'hidden' : 'visible'
    }
  
    updateThumb()
  
    const onMouseDown = (e) => {
      e.preventDefault()
      const startX = e.clientX
      const startScrollLeft = container.scrollLeft
      const thumbWidth = thumb.offsetWidth
      const trackWidth = track.offsetWidth
      const maxThumbLeft = trackWidth - thumbWidth
      const scrollableWidth = container.scrollWidth - container.clientWidth
      const scrollRatio = scrollableWidth / maxThumbLeft
  
      const onMouseMove = (e) => {
        const deltaX = e.clientX - startX
        container.scrollLeft = startScrollLeft + deltaX * scrollRatio
      }
  
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        document.body.style.userSelect = ''
      }
  
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      document.body.style.userSelect = 'none'
    }
  
    const onTouchStart = (e) => {
      e.preventDefault()
      const startX = e.touches[0].clientX
      const startScrollLeft = container.scrollLeft
      const thumbWidth = thumb.offsetWidth
      const trackWidth = track.offsetWidth
      const maxThumbLeft = trackWidth - thumbWidth
      const scrollableWidth = container.scrollWidth - container.clientWidth
      const scrollRatio = scrollableWidth / maxThumbLeft
  
      const onTouchMove = (e) => {
        const deltaX = e.touches[0].clientX - startX
        container.scrollLeft = startScrollLeft + deltaX * scrollRatio
      }
  
      const onTouchEnd = () => {
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('touchend', onTouchEnd)
        document.body.style.userSelect = ''
      }
  
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onTouchEnd)
      document.body.style.userSelect = 'none'
    }
  
    thumb.addEventListener('mousedown', onMouseDown)
    thumb.addEventListener('touchstart', onTouchStart)
    container.addEventListener('scroll', updateThumb)
    window.addEventListener('resize', updateThumb)
  
    return () => {
      thumb.removeEventListener('mousedown', onMouseDown)
      thumb.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('scroll', updateThumb)
      window.removeEventListener('resize', updateThumb)
    }
  }, [targetRef, comp])

  

  return (
      <div className={`custom-scroll horizontal ${customClass}`} ref={trackRef} >
          <div className='scroll-thumb' ref={thumbRef} >| | |</div>
      </div>
  )
}

export default HorizontalScrollbar