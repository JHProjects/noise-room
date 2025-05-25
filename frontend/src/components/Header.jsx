import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext.jsx'

import OverlayMobile from './OverlayMobile.jsx'
import IconVolume from './IconVolume.jsx'
import AddNewTrack from './AddNewTrack.jsx'
import HelpInfo from './HelpInfo.jsx'
import UserInfoPanel from './UserInfoPanel.jsx'
import PlaybackControl from './PlaybackControl.jsx'

import '../styles/Header.css'

function Header() {
    const [isOverlayOpen, setIsOverlayOpen] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)
    const [animateTokens, setAnimateTokens] = useState(false)
    const [animateTokensLoss, setAnimateTokensLoss] = useState(false)
    const [prevTokens, setPrevTokens] = useState(undefined)

    const { userData, setUserData } = useUser()

    useEffect(() => {
        if (!userData || !userData.tokens) return
        // why its saying on line 24........
        if (prevTokens) {
            if (userData.tokens < prevTokens) {
                setAnimateTokensLoss(true)
            } else {
                setAnimateTokens(true)
            }
            
            const timeout = setTimeout(() => {
                setAnimateTokens(false)
                setAnimateTokensLoss(false)
            }, 500) // animation duration
            return () => clearTimeout(timeout)
        }
        setPrevTokens(userData.tokens)
    }, [userData?.tokens])

    return (
        <header>
            <div className='header-left'>
                <img className='header-image' src="/site_logo.svg" alt="NoiseRoom Logo" />
                <h1>NoiseRoom</h1>
            </div>

            <div className='header-center'>
                <AddNewTrack />
            </div>

            <div className='header-right'>
                <nav className='desktop-menu'>
                    <i 
                        className='icon help' 
                        onMouseEnter={() => setHelpOpen(true)}
                        onMouseLeave={() => setHelpOpen(false)}
                    > {helpOpen && (
                        <div className='panel'>
                            <HelpInfo />
                        </div>
                    )} </i>
                    <IconVolume />
                    {/* <i className='icon user-samples'></i> */}
                    <i className='icon user-profile' onClick={() => {
                        if (!userOpen) setUserOpen(true)
                    }}></i>
                    <UserInfoPanel type='dt' open={userOpen} setOpen={setUserOpen} />
                </nav>
                
                <span className='tokens'>
                    <span className={`header-tokens ${animateTokens ? "animate" : ""}  ${animateTokensLoss ? "animate-loss" : ""}`}>{userData ? userData.tokens.toLocaleString('cs-CZ') : '0'}</span>
                    <i className='icon token'></i>
                </span>
                <i className='menu-burger' onClick={() => setIsOverlayOpen(true)}></i>
            </div>

            <OverlayMobile isOpen={isOverlayOpen} Close={() => setIsOverlayOpen(false)} />
        </header>
    )
}

export default Header