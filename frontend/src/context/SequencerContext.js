import { createContext, useContext } from "react"

export const SequencerContext = createContext(null)

export const useSequencerCtx = () => {
    const ctx = useContext(SequencerContext)
    if (!ctx) throw new Error('useSequencerCtx must be used within a SequencerProvider')
    return ctx
}