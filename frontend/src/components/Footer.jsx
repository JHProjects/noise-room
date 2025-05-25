import { useState, useRef } from 'react'

import '../styles/Footer.css'

import Users from '../components/Users.jsx'
import Chat from '../components/Chat.jsx'
import Tempo from '../components/Tempo.jsx'

function Footer() {
    const [activeTabIndex, setActiveTabIndex] = useState(0)
    const [offsetX, setOffsetX] = useState(0)

    const touchStartX = useRef(0)
    const dragging = useRef(false)

    const carouselTabs = [<Users />, <Chat />, <Tempo />]

    function handleTouchStart(e) {
        dragging.current = true
        touchStartX.current = e.touches[0].clientX
    }

    function handleTouchMove(e) {
        if (!dragging.current) return
        const currentX = e.touches[0].clientX
        const deltaX = currentX - touchStartX.current
        setOffsetX(deltaX)
    }

    function handleTouchEnd() {
        dragging.current = false

        if (offsetX > 60 && activeTabIndex > 0) {
            setActiveTabIndex(prev => prev - 1)
        } else if (offsetX < -60 && activeTabIndex < carouselTabs.length - 1) {
            setActiveTabIndex(prev => prev + 1)
        }

        setOffsetX(0)
    }

    return (
        <footer>

            <div className='footer-desktop'>
                <Users />
                <Chat />
                <Tempo />
            </div>

            <div className='footer-mobile'
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                    className='footer-carousel'
                    style={{
                        transform: `translateX(calc(${-activeTabIndex * 100}% + ${offsetX}px))`,
                        transition: dragging.current ? 'none' : 'transform 0.3s ease'
                    }}
                >
                    {carouselTabs.map((Component, idx) => (
                        <div key={idx} className={`carousel-item ${activeTabIndex == idx ? 'active' : ''}`} >
                            {Component}
                        </div>
                    ))}
                </div>
                <div className='carousel-indicators'>
                    {carouselTabs.map((_, i) => (
                        <span onClick={(e) => setActiveTabIndex(i) }  key={i} className={i === activeTabIndex ? 'active '+i : i}></span>
                    ))}
                </div>
            </div>

        </footer>
    )
}

export default Footer