import { useState } from 'react';

import '../styles/OverlayMobile.css'
import '../styles/UserInfoPanel.css'
import IconVolume from './IconVolume.jsx'
import HelpInfo from './HelpInfo.jsx'
import UserInfoPanel from './UserInfoPanel.jsx'

function OverlayMobile({ isOpen, Close }) {
    const [helpOpen, setHelpOpen] = useState(false)
    const [userOpen, setUserOpen] = useState(false)

    return (
        <div className={`fullscreen-overlay ${isOpen ? '' : 'closed'}`}>
            <nav className='overaly-nav'>
                <i className='icon close' onClick={Close}></i>
                <IconVolume className={'mobile'} />
                {/* <i className='icon user-samples'></i> */}
                <i className='icon user-profile' onClick={() => setUserOpen((prev) => !prev)}/>
                {userOpen && <UserInfoPanel type='mobile' open={userOpen} setOpen={setUserOpen} />}
            </nav>


            <div className='summary-text'>


                {helpOpen && (
                    <HelpInfo />
                )}
                <i
                    className={`icon help ${helpOpen ? 'quit' : ''}`}
                    onClick={() => setHelpOpen((prev) => !prev)}
                />
            </div>
        </div>
    )
}

export default OverlayMobile