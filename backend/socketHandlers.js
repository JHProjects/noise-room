const { userAccounts, saveUserAccounts, saveComposition, connectedUsers, userCursors, composition, chatHistory, compositionCheckForNextLevel } = require("./dataStore")
const { addChatMessage } = require("./helperFunctions")

function setupSocketHandlers(io) {
    io.on("connection", (socket) => {    
        // Send initial data 
        socket.emit("chat_history", chatHistory)
        socket.emit("tracks_update", composition)


        // Sign Up
        socket.on("signup", ({ username, password, color, image }) => {
            if (!username || !password || !color) return
    
            // try Signing up
            if (userAccounts[username] || username == 'System') {
                socket.emit("signup_error", "Username is already used by a different user.")
                return
            }

            userAccounts[username] = {
                username, 
                password,
                color,
                image,
                tokens: 800,
                recordings: [],
                mostUsed: null
            }
            saveUserAccounts()

            // save new user to currently online users
            socket.username = username
            connectedUsers[socket.id] = {
                id: socket.id,
                username,
                color,
                image
            }

            socket.emit("login_success", userAccounts[username])
            io.emit("users_update", Object.values(connectedUsers))
    
            const loginMsg = `User <span>${username}</span> joined!`
            addChatMessage(loginMsg)
            io.emit("chat_message", loginMsg)
        })

        // Login
        socket.on("login", ({ username, password }) => {
            if (!username) return

            const usernameInUse = Object.values(connectedUsers).some(user => user.username === username)
            const account = userAccounts[username]

            if (!password) {
                socket.emit("login_error", "No password entered.")
                return
            }

            if (!account) {
                socket.emit("login_error", "No account found.")
                return
            }
            if (password != account.password) {
                socket.emit("login_error", "Wrong password.")
                return
            }
            if (usernameInUse) {
                socket.emit("login_error", "User is already online.")
                return
            }
            
            const color = account.color
            const image = account.image

            socket.username = username
            connectedUsers[socket.id] = {
                id: socket.id,
                username,
                color,
                image
            }

            socket.emit("login_success", userAccounts[username])
            io.emit("users_update", Object.values(connectedUsers))

            const loginMsg = `User <span>${username}</span> joined!`
            addChatMessage(loginMsg)
            io.emit("chat_message", loginMsg)
        })
    
        // Add track
        socket.on("add_track", ({newTrack, priceForAddingTrack}) => {
            if (!newTrack || !composition) return
            if (!priceForAddingTrack) {
                console.log('no price for adding track passed.')
                return
            }

            composition.tokensSpent += priceForAddingTrack
            composition.tracks.push(newTrack)

            const goNextLevel = compositionCheckForNextLevel()
            io.emit("tracks_update", composition)
            saveComposition()

            userAccounts[socket.username].tokens -= priceForAddingTrack
            socket.emit("user_data_updated", userAccounts[socket.username])

            if (goNextLevel) {
                Object.values(userAccounts).forEach(user => {
                    user.tokens += 1000
                })
                emitUserUpdates(io)
            }
            saveUserAccounts()
    
            const msg = `<span>${socket.username || socket.id}</span> placed <span>${newTrack.name}</span> into composition!`
            io.emit("chat_message", msg)
        })

        // Upload new audio
        socket.on("upload_audio", ({ newAudio, reward}) => {
            if (!newAudio) return
            if (!reward) reward = 0

            userAccounts[socket.username].recordings.unshift(newAudio)
            userAccounts[socket.username].tokens += reward
            
            io.emit("user_data_updated", userAccounts[socket.username])
            saveUserAccounts()
    
            const msg = `<span>${socket.username || socket.id}</span> uploaded a new <span>${newAudio.type}</span>  clip: <span>'${newAudio.displayName}'</span>!`
            io.emit("chat_message", msg)
        })

        // Toggle note
        socket.on("toggle_note", ({ trackId, groupIndex, stepIndex, noteCost }) => {
            const track = composition.tracks.find(t => t.id === trackId)
            if (!track) return
            
            const note = track.notes[groupIndex][stepIndex]
            note.on = !note.on

            composition.tokensSpent += noteCost || note.noteCost
            note.toggleCount++
            note.noteCost = Math.min(1000, parseInt(note.toggleCount * 1.5))

            const goNextLevel = compositionCheckForNextLevel()
            saveComposition()
            io.emit("tracks_update", composition)

            userAccounts[socket.username].tokens -= noteCost
            socket.emit("user_data_updated", userAccounts[socket.username])

            if (!track.sampleUploadedBy == "System") {
                userAccounts[track.sampleUploadedBy].tokens += noteCost 

                const creatorEntry = Object.entries(connectedUsers).find(
                    ([, user]) => user.username === track.sampleUploadedBy
                )
                const creatorSocketId = creatorEntry?.[0]

                if (creatorSocketId) {
                    io.to(creatorSocketId).emit("user_data_updated", userAccounts[track.sampleUploadedBy])
                }
            }
            

            if (goNextLevel) {
                Object.values(userAccounts).forEach(user => {
                    user.tokens += 1000
                })
                emitUserUpdates(io)
            }
            saveUserAccounts()

            const msg = `<span>${socket.username || socket.id}</span> changed a note at <span>${track.name}</span> for <span>${noteCost} tokens.</span>`
            io.emit("chat_message", msg)
        })
    
        // Track pan
        socket.on("edit_track_properties", ({ trackId, type, panValue, volumeValue }) => {
            const track = composition.tracks.find(t => t.id === trackId)
            if (!track) return
    
            if (type === 'pan') track.pan = panValue
            if (type === 'volume') track.volume = volumeValue
            io.emit("tracks_update", composition)
            saveComposition()

            let msg = `<span>${socket.username || socket.id}</span> changed <span>'${track.name}'</span>`
            if (type == 'volume') msg = `<span>${socket.username || socket.id}</span> changed volume to <span>${volumeValue}</span> on <span>'${track.name}'</span>`
            if (type == 'pan') msg = `<span>${socket.username || socket.id}</span> changed pan on '<span>${track.name}</span>'`
            io.emit("chat_message", msg)
        })

        // Delete track
        socket.on('delete_track', ({ trackId, deletePrice }) => {
            const trackIndex = composition.tracks.findIndex(t => t.id === trackId)
            if (trackIndex === -1) return

            const [deleted] = composition.tracks.splice(trackIndex, 1)
            composition.tokensSpent += deletePrice || 0

            const goNextLevel = compositionCheckForNextLevel()
            

            userAccounts[socket.username].tokens -= deletePrice
            socket.emit("user_data_updated", userAccounts[socket.username])

            if (goNextLevel) {
                Object.values(userAccounts).forEach(user => {
                    user.tokens += 1000
                })
                emitUserUpdates(io)
            }
            saveUserAccounts()
            saveComposition()
            io.emit('tracks_update', composition)

            const msg = `<span>${socket.username || socket.id}</span> deleted track <span>'${deleted.name}'</span>`
            io.emit('chat_message', msg);
        })
    
        // Edit BPM
        socket.on("edit_BPM", ({ BPM, changeBPMcost }) => {
            if (!BPM || !changeBPMcost) {
                console.log('value passed with no data:', BPM, changeBPMcost)
                return
            }
            
            composition.BPM = BPM
            composition.tokensSpent += changeBPMcost || 0
            
            const goNextLevel = compositionCheckForNextLevel()
            

            userAccounts[socket.username].tokens -= changeBPMcost
            socket.emit("user_data_updated", userAccounts[socket.username])

            if (goNextLevel) {
                Object.values(userAccounts).forEach(user => {
                    user.tokens += 1000
                })
                let msg = `<span>The composition has expanded!</span>`
                io.emit("chat_message", msg) 
                emitUserUpdates(io)
            }
            saveUserAccounts()
            saveComposition()
            io.emit("tracks_update", composition)
        
            const msg = `<span>${socket.username || socket.id}</span> changed the BPM to <span>${BPM}</span>`
            io.emit("chat_message", msg)
        })
    
        // Cursor move
        socket.on("cursor_move", (position) => {
            const userData = connectedUsers[socket.id]
            if (!userData) return

            userCursors[socket.id] = position
            socket.broadcast.emit("cursors_update", { 
                id: socket.id, 
                position, 
                username: userData.username, 
                color: userData.color,
                image: userData.image 
            })
        })
    
        socket.on("chat_message", (msg) => {
            addChatMessage(msg)
            io.emit("chat_message", msg)
        })
    
        // Disconnection
        socket.on("disconnect", () => {
            delete userCursors[socket.id] 

            const username = connectedUsers[socket.id] || socket.id
            delete connectedUsers[socket.id]
            
            io.emit("users_update", Object.values(connectedUsers))  // send update to user UI after someone leaves
            io.emit('cursor_remove', socket.id)

            const leaveMsg =  `User <span>${socket.username || socket.id}</span> left.`
            addChatMessage(leaveMsg)
            io.emit("chat_message", leaveMsg)  // send update to chat after someone leaves
        })
    })
}

function emitUserUpdates(io) {
    Object.entries(connectedUsers).forEach(([socketId, user]) => {
        const { password, ...safeUser } = userAccounts[user.username] || {}
        if (safeUser.username) {
            io.to(socketId).emit("user_data_updated", safeUser)
        }
    })
}

module.exports = setupSocketHandlers