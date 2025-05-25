import { useEffect, useState } from 'react'
import { socket } from '../socket.js'
import '../styles/UserCursorsLayer.css'


function UserCursorsLayer() {
    const [cursors, setCursors] = useState({})

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX / window.innerWidth
            const y = e.clientY / window.innerHeight
            socket.emit('cursor_move', { x, y })
        }

        const handleTouchMove = (e) => {
            if (!e.touches || e.touches.length === 0) return
            const touch = e.touches[0]
            const x = touch.clientX / window.innerWidth
            const y = touch.clientY / window.innerHeight
            socket.emit('cursor_move', { x, y })
        }

        const handleCursorUpdate = ({ id, position, username, color, image }) => {
            setCursors(prev => ({ 
                ...prev, 
                [id]: {
                    position,
                    username,
                    color,
                    image
                } 
            }))
        }

        const handleCursorRemove = (id) => {
            setCursors(prev => {
                const copy = { ...prev }
                delete copy[id]
                return copy
            })
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchmove', handleTouchMove)
        socket.on('cursors_update', handleCursorUpdate)
        socket.on('cursor_remove', handleCursorRemove)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchmove', handleTouchMove)
            socket.off('cursors_update', handleCursorUpdate)
            socket.off('cursor_remove', handleCursorRemove)
        }
    }, [])

    return (
        <div className="user-cursors-layer">
            {Object.entries(cursors).map(([id, data]) => (
                <div
                    key={id}
                    className="user-cursor"
                    title={data.username}
                    style={{
                        left: `${data.position.x * window.innerWidth}px`,
                        top: `${data.position.y * window.innerHeight}px`,
                        background: data?.image?.startsWith('data:image')
                            ? `url(${data.image})`
                            : `var(${data.color})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                    }}
                />
            ))}
        </div>
    )
}

export default UserCursorsLayer