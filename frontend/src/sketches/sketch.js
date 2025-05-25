export default sketch = (p) => {
    let fft
    p.updateAudioData = (data) => { fft = data }

    // Setup
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
            .style('z-index', '-1')
            .style('filter', 'blur(30px)')
        p.noStroke()
        p.ellipseMode(p.RADIUS)
        fft = new Tone.FFT(64);
        Tone.Destination.connect(fft);
    }

    // Draw
    p.draw = () => {
        p.clear()

        if (p.fftData.length) {
            console.log(p.fftData)
        }
    }


    // resize canvas based on window function
    p.windowResized = () => { p.resizeCanvas(p.windowWidth, p.windowHeight) }
}