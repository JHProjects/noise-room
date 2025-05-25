import { useEffect, useState } from 'react'
import { socket } from '../socket.js'
import ChatMessage from './ChatMessage.jsx'

const MAX_MESSAGES = 5

function Chat() {
    const [chatMessages, setChatMessages] = useState([])

    useEffect(() => {
        socket.on("chat_history", (history) => {
            setChatMessages(
                history.slice(-MAX_MESSAGES).map(msg => ({
                    id: crypto.randomUUID(),
                    html: msg
                }))
            )
        })

        socket.on("chat_message", (msg) => {
            setChatMessages(prev => {
                const newMessages = [...prev, { id: crypto.randomUUID(), html: msg }]
                return newMessages.slice(-MAX_MESSAGES)
            })
        })

        return () => {
            socket.off("chat_history")
            socket.off("chat_message")
        }
    }, [])

    return (
        <div className="chat-container">
                {chatMessages.map((message, index) => (
                    <ChatMessage
                        key={message.id}
                        id={message.id}
                        html={message.html}
                        index={index}
                    />
                ))}
        </div>
    )
}


export default Chat