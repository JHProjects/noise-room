import { useState, useRef, useEffect } from 'react'
import { useUser } from '../context/UserContext.jsx'
import '../styles/UserInfoPanel.css'

function UserInfoPanel({ type, open, setOpen }) {
    const { userData, setUserData } = useUser()

    const handleLogout = () => {
        setUserData(null)
        window.location.reload()
    }

    const wrapperRef = useRef(null)

    useEffect(() => {
        if (!open) return // nothing to do if slider is closed

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

    if (!open) return null

    return (

        <div ref={wrapperRef} className={`panel user-info-panel ${type}`}>
            <div className='user-data'>
                <div className='top-row'>
                    <div
                        className='user-icon'
                        style={{
                            background: userData?.image?.startsWith('data:image')
                                ? `url(${userData.image})`
                                : `var(${userData.color})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                    <div className='user-text'>
                        <div className='user-title'>{userData?.username}</div>
                        <div className='change-picture-flex'>
                            <i className='icon edit' />
                            <p className='change-picture-text'>Change picture </p>
                        </div>
                    </div>
                </div>
                <div className='bottom-row'>
                    <div className='user-text'>
                        <div className='user-title'>Tokens 
                            <span className='user-points'> {userData?.tokens} <i className='icon note' /></span>
                        </div>
                    
                        <div className='user-title'>Recordings 
                            <span className='user-points sample-count'> {userData?.recordings.length} <i className='icon eq' /></span>
                        </div>

                        <div className='user-title'>Most Used 
                            <span className='user-points sample-count'> '{userData?.mostUsed ? userData?.mostUsed : 'none'}' </span>
                        </div>

                    
                    </div>
                </div>
            </div>
            <button className='logout-btn' onClick={handleLogout}>Logout</button>
        </div>

    )
}

export default UserInfoPanel