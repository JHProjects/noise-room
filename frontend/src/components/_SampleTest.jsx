import * as Tone from 'tone'
import { useEffect, useState } from 'react'

function SampleTest() {
    const [player, setPlayer] = useState(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const url = '/samples/kick.wav'
        const newPlayer = new Tone.Player({
            url: url,
            onload: () => {
                console.log('Kick sample loaded')
                setIsLoaded(true)
            },
            onerror: (e) => {
                console.error('Error loading kick sample:', e)
            }
        }).toDestination()

        setPlayer(newPlayer)

        // Cleanup when component unmounts
        return () => {
            newPlayer.dispose()
        }
    }, [])

    const handleClick = async () => {
        await Tone.start()
        console.log('Audio context started')
        if (player && isLoaded) {
            player.start()
        } else {
            console.log('Sample not yet loaded')
        }
    }

    return (
        <div style={{ margin: '2rem' }}>
            <button onClick={handleClick}>Test Kick Sample</button>
        </div>
    )
}

export default SampleTest
