const fs = require('fs')
const path = require('path')

const dataFilePath = path.join(__dirname, 'userAccounts.json')
const compositionDataFilePath = path.join(__dirname, 'composition.json')


// users
let userAccounts = {}
if (fs.existsSync(dataFilePath)) {
    userAccounts = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'))
}

function saveUserAccounts() {
    fs.writeFileSync(dataFilePath, JSON.stringify(userAccounts, null, 2), 'utf8')
}

// Current users
let connectedUsers = {}
let userCursors = {}

// Composition (initial creation)
let composition = {
    BPM: 80,
    tokensSpent: 0,
    amountForNextMeasure: 500,
    beatsPerMeasure: 8,
    measures: 2,
    currentNoteIndex: 0,
    tracks: []
} 

if (fs.existsSync(compositionDataFilePath)) {
    composition = JSON.parse(fs.readFileSync(compositionDataFilePath, 'utf8'))
}

function saveComposition() {
    fs.writeFileSync(compositionDataFilePath, JSON.stringify(composition, null, 2), 'utf8')
}

function compositionCheckForNextLevel() {
    if (composition.amountForNextMeasure >= composition.tokensSpent) {
        compositionCheckForNextLevel()
    }
}

function compositionCheckForNextLevel() {
    console.log('Composition spent tokens: ', composition.tokensSpent)
    console.log('Composition amount for next measure: ', composition.amountForNextMeasure)
    if (composition.tokensSpent < composition.amountForNextMeasure) return false
    composition.amountForNextMeasure = parseInt(2.5 * composition.amountForNextMeasure)
    composition.measures++
    expandComposition()
    saveComposition()
    return true
}

function expandComposition() {
    composition.tracks.forEach((track) => {
        const missing = composition.measures - track.notes.length
        for (let i = 0; i < missing; i++) {
            const newMeasure = Array(composition.beatsPerMeasure)
                .fill()
                .map(() => ({ 
                    on: false,
                    toggleCount: 0,
                    noteCost: 1 
                }))
            track.notes.push(newMeasure)
        }
    })
}

function trimComposition() {
    composition.tracks.forEach((track) => {
        if (track.notes.length > composition.measures) {
            track.notes = track.notes.slice(0, composition.measures)
        }
    })
}

expandComposition()
trimComposition()


// Chat
let chatHistory = []
const MAX_HISTORY = 10000

module.exports = {
    userAccounts, saveUserAccounts,
    composition, saveComposition, expandComposition, compositionCheckForNextLevel,
    connectedUsers,
    userCursors,
    chatHistory,
    MAX_HISTORY
}