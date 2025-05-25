import * as Tone from 'tone'

function ToneTest() {
    const handlePlay = async () => {
        await Tone.start()
        console.log('Audio context started')

        const synth = new Tone.Synth().toDestination()
        synth.triggerAttackRelease('C4', '8n')
    }

    return (
        <div style={{ margin: '2rem' }}>
            <button onClick={handlePlay}>Test Tone Synth</button>
        </div>
    )
}

export default ToneTest
