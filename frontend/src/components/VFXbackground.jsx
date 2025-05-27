import { useRef, useEffect } from 'react'
import p5 from 'p5'
import { useSequencerCtx } from '../context/SequencerContext.js'

function VFXbackground() {
    const { audioData } = useSequencerCtx()
    const sketchRef = useRef()
    const p5InstanceRef = useRef()


    // Sketch logic
    useEffect(() => {
        const sketch = (p) => {
            p.fftData = []
            p.volume = 0
            p.updateAudioData = (data) => { p.fftData = data.fft; p.volume = p.map(data.volume, -200, 0, 0, 50) }

            // Setup
            p.setup = () => {
                p.createCanvas(p.windowWidth, p.windowHeight)
                    .style('z-index', '-8')
                    .style('filter', 'blur(25px)')
                p.noStroke()
                p.ellipseMode(p.RADIUS)
                p.rectMode(p.CENTER)
                p.colorMode(p.HSB, 360, 100, 100, 1)
            }

            // Draw
            p.draw = () => {
                p.clear()

                if (p.fftData) {
                    const padding = 120
                    const centerX = (p.width / 2)
                    const centerY = (p.height / 2) + 50
                    const drawableWidth = p.width - 2 * padding
                    const barWidth = drawableWidth / p.fftData.length

                    const time = p.millis() * 0.001

                    // p.fill(105, 181, 191, 40)
                    for (let i = 0; i < p.fftData.length; i++) {
                        let x = padding + i * barWidth
                        let val = p.fftData[i]
                        let h = p.map(val, -100, 0, 5, centerY)
                        h = p.constrain(h, 0, centerY)
                        

                        // noise with space (i) + continuous time
                        let alphaNoise = p.noise(i * 0.1, time/10)
                        let alpha = p.map(alphaNoise, 0, 1, 100, 240)
                        let volumeHue = p.map(p.volume, 0, 50, 0, 187)
                        let volumeSat = p.map(p.volume, 0, 50, 20, 50)
                        let volumeAlpha = p.map(p.volume, 0, 50, .001, .2)

                        p.fill(187, 45, 75, .1)
                        p.fill(alpha, 45, 75, .1)
                        p.fill(187, volumeSat, 75, volumeAlpha)
                        // p.fill(255, 123, 77, 10)

                        // Draw rect going up from center
                        p.rect(x, centerY - h, barWidth * 0.3, h/2)
                        p.rect(x, centerY - h, barWidth * 0.3, h/2)
                        // Draw rect going down from center
                        p.rect(x, centerY, barWidth * 0.3, h*.8)
                        p.rect(x, centerY, barWidth * 0.3, h*1.5)
                    }
                }
                
                
                // Simple shape following cursor
                // p.fill(105, 181, 191, 50)
                p.noFill()
                // p.stroke(105, 181, 191, 50)
                p.strokeWeight(4)
                let width = 1 * (p.volume || 0)
                let height = 1 * (p.volume || 0)
                p.ellipse(p.mouseX, p.mouseY, width, height)
            }


            // resize canvas based on window function
            p.windowResized = () => { p.resizeCanvas(p.windowWidth, p.windowHeight) }
        }


        p5InstanceRef.current = new p5(sketch, sketchRef.current)
        return () => { p5InstanceRef.current.remove() }
    }, [])

    // update the fftData
    useEffect(() => {
        if (p5InstanceRef.current?.updateAudioData) { p5InstanceRef.current.updateAudioData(audioData) }
    }, [audioData])


    // return the sketch
    return (
        <div
            ref={sketchRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: -1,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none', 
                // backdropFilter: 'blur(10px)'
            }}
        />
    )
}

export default VFXbackground