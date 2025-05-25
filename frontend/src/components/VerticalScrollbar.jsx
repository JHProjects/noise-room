import { useEffect, useRef, useState } from 'react'

function VerticalScrollbar({ targetRef, customClass, comp }) {
    const thumbRef = useRef(null)
    const trackRef = useRef(null)

    useEffect(() => {
        const container = targetRef?.current
        if (!container) return

        const thumb = thumbRef.current
        const track = trackRef.current
        if (!thumb || !track) return

        const updateThumb = () => {
            const { scrollTop, scrollHeight, clientHeight } = container
            const trackHeight = track.offsetHeight
            const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, 20)
            const scrollRatio = scrollTop / (scrollHeight - clientHeight)
            const maxThumbTop = trackHeight - thumbHeight

            thumb.style.height = `${thumbHeight}px`
            thumb.style.top = `${scrollRatio * maxThumbTop}px`

            if (scrollHeight <= clientHeight) {
                track.style.display = 'none' // Hide the scrollbar
            } else {
                track.style.display = 'block' // Show the scrollbar
            }
        }

        updateThumb()

        const onTouchStart = (e) => {
            e.preventDefault()
            const startY = e.touches[0].clientY
            const startScrollTop = container.scrollTop
            const thumbHeight = thumb.offsetHeight
            const trackHeight = track.offsetHeight
            const maxThumbTop = trackHeight - thumbHeight
            const scrollableHeight = container.scrollHeight - container.clientHeight
            const scrollRatio = scrollableHeight / maxThumbTop

            const onTouchMove = (e) => {
                const deltaY = e.touches[0].clientY - startY
                container.scrollTop = startScrollTop + deltaY * scrollRatio
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

        const onMouseDown = (e) => {
            e.preventDefault()
            const startY = e.clientY
            const startScrollTop = container.scrollTop
            const thumbHeight = thumb.offsetHeight
            const trackHeight = track.offsetHeight
            const maxThumbTop = trackHeight - thumbHeight
            const scrollableHeight = container.scrollHeight - container.clientHeight
            const scrollRatio = scrollableHeight / maxThumbTop

            const onMouseMove = (e) => {
                const deltaY = e.clientY - startY
                container.scrollTop = startScrollTop + deltaY * scrollRatio
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

        thumb.addEventListener('mousedown', onMouseDown)
        thumb.addEventListener('touchstart', onTouchStart)
        container.addEventListener('scroll', updateThumb)
        window.addEventListener('resize', updateThumb)

        updateThumb()

        return () => {
            thumb.removeEventListener('mousedown', onMouseDown)
            container.removeEventListener('scroll', updateThumb)
            window.removeEventListener('resize', updateThumb)
        }
    }, [targetRef, comp])

    

    return (
        <div className={`custom-scroll vertical ${customClass}`} ref={trackRef} >
            <div className='scroll-thumb' ref={thumbRef} ><div>&ndash; &ndash; &ndash;</div></div>
        </div>
    )
}

export default VerticalScrollbar