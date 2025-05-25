import { useEffect, useState } from 'react'
import { socket } from './socket.js'
import { useUser } from './context/UserContext.jsx'
import { useSequencerCtx } from './context/SequencerContext.js'

import './styles/App.css'

import UserCursorsLayer from './components/UserCursorsLayer.jsx'
import UserLogin from './components/UserLogin.jsx'
import Header from './components/Header.jsx'
import Main from './components/Main.jsx'
import Footer from './components/Footer.jsx'

function App() {
  // Context
  const { userData, setUserData } = useUser()
  const { startPlayback, setPlaybackStarted } = useSequencerCtx()

  // states
  const [userLoggedIn, setUserLoggedIn] = useState(false)


  // Effects
  useEffect(() => {
    socket.on('login_success', (user) => {
      setUserLoggedIn(true)
      setUserData(user)
      console.log('Logged in as:', user.username)
    })

    return () => socket.off("login_success")
  }, [])

  useEffect(() => {
    socket.on("user_data_updated", (updatedUser) => {
      setUserData(updatedUser)
    })

    return () => socket.off("update_user_data")
  }, [])

  // Start playback only when user logs into an account
  useEffect(() => {
    if (userLoggedIn) {
      setPlaybackStarted(true)
      startPlayback()
    }
  }, [userLoggedIn])


  return (
    <div className="app">
      <UserCursorsLayer />
      {!userLoggedIn && (<UserLogin />)}
      <Header />
      <Main />
      <Footer />
    </div>
  )
}

export default App