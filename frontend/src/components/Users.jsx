import { useState, useEffect } from 'react'
import { socket } from '../socket.js'

import CompositionMeasureProgress from '../components/CompositionMeasureProgress.jsx'

function Users() {
    const [users, setUsers] = useState([])

    useEffect(() => {
        socket.on("users_update", (userList) => {
            setUsers(userList)
        })

        // Cleanup
        return () => {
            socket.off("connect")
            socket.off("users_update")
            socket.off("disconnect")
        }
    }, [])

    const visibleUsers = users.slice(0, 6)
    const extraUsers = users.length > 6 ? users.length - 6 : 0

    return (
        <div className='users'>
            <CompositionMeasureProgress />
            <div className='users-inner'>
                <p>Users</p>
                <ul className='user-icons'>
                    {visibleUsers.map((user) => (
                        <li key={user.id}>
                            <div
                                style={{
                                    background: user?.image?.startsWith('data:image')
                                        ? `url(${user.image})`
                                        : `var(${user.color})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            ></div>
                        </li>
                    ))}
                </ul>
                {extraUsers > 0 && (
                    <p className='user-count-over'>+{extraUsers}</p>
                )}
            </div>
            
        </div>
    )
}

export default Users