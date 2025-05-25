import { useEffect, useRef } from 'react'

function ChatMessage({ id, html, index }) {

    return (
        <p
            key={id}
            className={`chat-message 
                ${index === 0 ? 'last' : ''} 
                ${index === 1 ? 'pre-last' : ''} 
                ${index === 2 ? 'second' : ''} 
                ${index === 3 ? 'first' : ''} 
                animation`}
            style={index === 0 ? { opacity: 0 } : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}

export default ChatMessage