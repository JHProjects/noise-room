export function createAndAddTrack({ sample, composition, setComposition, socket, priceForAddingTrack }) {
    const folder = 'audio'
    const samplePath = `/uploads/${folder}/${sample.filename}`


    const newTrack = {
        id: crypto.randomUUID(),
        name: sample.displayName,
        type: sample.type,
        sampleUrl: samplePath,
        sampleUploadedBy: sample.uploadedBy,
        pan: 0,
        volume: 80,
        notes: Array(composition.measures).fill().map(() =>
            Array(composition.beatsPerMeasure).fill().map(() => ({
                on: false,
                toggleCount: 0,
                noteCost: 1
            }))
        ),
    }

    const updatedComp = {
        ...composition,
        tracks: [...composition.tracks, newTrack],
    }

    setComposition(updatedComp)
    socket.emit("add_track", {newTrack, priceForAddingTrack})
}