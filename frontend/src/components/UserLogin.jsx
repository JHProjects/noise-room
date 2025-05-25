import { useEffect, useState } from 'react'
import { socket } from '../socket.js'

import '../styles/UserLogin.css'


let minNameLength = 3;
let maxNameLength = 12;
let minPassLength = 4;
let maxPassLength = 24;

let userColors = [
    '--primary',
    '--primary-med',
    '--primary-grey-dark',
    '--primary-grey-med',
    '--secondary',
    '--secondary-med',
    '--secondary-dark',
    '--tertiary',
    '--tertiary-med',
    '--tertiary-dark'
]

function UserLogin() {
    const [loginMode, setLoginMode] = useState(true)
    const [usernameValue, setUsernameValue] = useState('')
    const [usernameLoginValue, setUsernameLoginValue] = useState('')
    const [passwordValue, setPasswordValue] = useState('')
    const [passwordLoginValue, setPasswordLoginValue] = useState('')
    const [signupError, setSignupError] = useState(false)
    const [loginError, setLoginError] = useState(false)
    const [failReason, setFailReason] = useState('Username is already taken!')
    const [failLoginReason, setFailLoginReason] = useState('Username is already taken!')
    const [colorValue, setColorValue] = useState(userColors[Math.floor(Math.random() * userColors.length)])

    const [imageFile, setImageFile] = useState(null)
    const [preview, setPreview] = useState(null)

    useEffect(() => {
        socket.on('login_error', (msg) => {
            console.log('error in logging in')
            setLoginError(true)
            setFailLoginReason(msg)
        })
        return () => socket.off('login_error')
    }, [])

    useEffect(() => {
        socket.on('signup_error', (msg) => {
            console.log('error in signing up')
            setSignupError(true)
            setFailReason(msg)
        })
        return () => socket.off('signup_error')
    }, [])

    function tryUserLogin() {
        if (usernameLoginValue.length < minNameLength) {
            setSignupError(true)
            setFailReason('Username too short')
            return
        }
        if (passwordLoginValue.length < minPassLength) {
            setSignupError(true)
            setFailReason('Password too short')
            return
        }
        socket.emit('login', {
            username: usernameLoginValue,
            password: passwordLoginValue,
        })
    }

    function tryUserSignUp() {
        if (usernameValue.length < minNameLength) {
            setSignupError(true)
            setFailReason('Username too short')
            return
        }
        if (passwordValue.length < minPassLength) {
            setSignupError(true)
            setFailReason('Password too short')
            return
        }
        socket.emit('signup', {
            username: usernameValue,
            password: passwordValue,
            color: colorValue,
            image: imageFile || colorValue // base64 PNG
        })
    }

    function handleImageUpload(e) {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            cropToSquare(reader.result, (croppedDataUrl) => {
                setPreview(croppedDataUrl)
                setImageFile(croppedDataUrl) // this will be sent to server
            })
        }
        reader.readAsDataURL(file)
    }

    function cropToSquare(imageUrl, callback) {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            const size = Math.min(img.width, img.height)
            const x = (img.width - size) / 2
            const y = (img.height - size) / 2

            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, x, y, size, size, 0, 0, 64, 64)
            callback(canvas.toDataURL('image/png'))
        }
        img.src = imageUrl
    }


    return (
        <div className="user-login fullscreen">
            <div className='login-flex'>
                <div className='login-title'>
                    <img src='/site_logo.svg'/>
                    <h1>NoiseRoom</h1>
                </div>
                {/* user login panel */}
                {loginMode && (
                    <>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault()
                            tryUserSignUp()
                        }}
                        className='user-login-panel panel'>
                        <h3>Login</h3>
                        <p>Username</p>
                        <input
                            className='username'
                            type="text"
                            maxLength={maxNameLength}
                            placeholder={`${minNameLength}–${maxNameLength} characters...`}
                            value={usernameLoginValue}
                            onChange={(e) => {
                                setUsernameLoginValue(e.target.value)
                                setLoginError(false)
                            }}
                        />
                        <p>Password</p>
                        <input
                            className='username password'
                            type="password"
                            maxLength={maxPassLength}
                            placeholder={`Your password...`}
                            value={passwordLoginValue}
                            onChange={(e) => {
                                setPasswordLoginValue(e.target.value)
                                setLoginError(false)
                            }}
                        />
                        <p className={`username-taken-alert ${loginError ? '' : 'hide'}`}>{failLoginReason}</p>
                        <button
                            type='submit'
                            className='login-button'
                            onClick={() => tryUserLogin()}
                        >Login</button>
                    </form>
                    <p onClick={() => {setLoginMode(false)}} className='login-switch'>Don't have an account? <span>Sign up</span> here!</p>
                    </>
                )}



                {/* create new account panel */}
                {!loginMode && (
                    <>
                    <form  
                        onSubmit={(e) => {
                            e.preventDefault()
                            tryUserLogin()
                        }}
                        className='user-login-panel create-new-acc-panel panel'>
                        <h3>Create a&nbsp;new account</h3>
                        
                        <p>Username</p>
                        <input
                            className='username'
                            type="text"
                            maxLength={maxNameLength}
                            placeholder={`${minNameLength}–${maxNameLength} characters...`}
                            value={usernameValue}
                            onChange={(e) => {
                                setUsernameValue(e.target.value)
                                setSignupError(false)
                            }}
                        />
                        <p>Password</p>
                        <input
                            className='username password'
                            type="password"
                            maxLength={maxPassLength}
                            placeholder={`${minPassLength}–${maxPassLength} characters...`}
                            value={passwordValue}
                            onChange={(e) => {
                                setPasswordValue(e.target.value)
                                setSignupError(false)
                            }}
                        />
                        <p className={`username-taken-alert ${signupError ? '' : 'hide'}`}>{failReason}</p>

                        <p>Color</p>
                            <div className="color-grid">
                                {userColors.map((cssVar) => {
                                    const actualColor = getCssVarValue(cssVar);
                                    return (
                                        <div
                                            key={cssVar}
                                            className={`color-option ${colorValue === cssVar ? 'selected' : ''}`}
                                            style={{ backgroundColor: actualColor }}
                                            onClick={() => setColorValue(cssVar)    }
                                        />
                                    )
                                })}
                            </div>
                            <p>Avatar</p>
                            <div className="color-grid image-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e)}
                                />
                                {preview && (
                                    <img src={preview} className="avatar-preview" alt="Preview" />
                                )}
                            </div>

                        <button
                            type='submit'
                            className='login-button create-new-acc-btn'
                            onClick={() => tryUserSignUp()}
                        >Sign up</button>
                    </form>
                    
                    <p onClick={() => {setLoginMode(true)}} className='login-switch'>Already have an account? <span>Login</span> here!</p>
                    </>
                )}

            </div>
        </div>
    )
}

function getCssVarValue(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export default UserLogin