import { createContext, useState, useContext, useEffect } from 'react'
import { socket } from '../socket.js'

const UserContext = createContext()

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null)

  const setTokens = (amount) => {
    if (!userData) return
    setUserData({ ...userData, tokens: amount })
  }

  const addTokens = (delta) => {
    if (!userData) return
    setUserData({ ...userData, tokens: (userData.tokens || 0) + delta })
  }

  const removeTokens = (amount) => {
    if (!userData || (userData.tokens ?? 0) < amount) {
      return false // not enough tokens
    }
    setUserData({ ...userData, tokens: userData.tokens - amount })
    socket.emit("user_spent_tokens", {amount, userData})
    return true // success
  }


  return (
    <UserContext.Provider value={{ userData, setUserData, setTokens, addTokens, removeTokens }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}