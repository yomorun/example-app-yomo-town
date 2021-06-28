export const getViewportSize = () => {
    return {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
}

export const keyPressArrowOrWASD = e => {
    switch (e.keyCode) {
        case 87:
        case 83:
        case 65:
        case 68:
        case 37:
        case 38:
        case 39:
        case 40:
            return true
        default:
            return false
    }
}

export const pressKeyMapping = e => {
    const input = {
        left: false,
        right: false,
        up: false,
        down: false
    }

    if (e.type === 'stop') {
        return input
    }

    switch (e.keyCode) {
        case 87:
            input.up = true
            break
        case 83:
            input.down = true
            break
        case 65:
            input.left = true
            break
        case 68:
            input.right = true
            break
        case 38:
            input.up = true
            break
        case 40:
            input.down = true
            break
        case 37:
            input.left = true
            break
        case 39:
            input.right = true
    }

    return input
}

const componentToHex = v => {
    const hex = v.toString(16)
    return hex.length == 1 ? '0' + hex : hex
}

const rgbToHex = (r, g, b) => {
    return parseInt('0x' + componentToHex(r) + componentToHex(g) + componentToHex(b), 16)
}

export const randomNum = (arr, isInt) => {
    const max = Math.max(...arr)
    const min = Math.min(...arr)
    const num = Math.random() * (max - min) + min
    return isInt ? Math.round(num) : num
}

export const randomColor = (type = 'RGB', radix = 255) => {
    if (radix > 255 || radix < 0) {
        return `rgb(${0}, ${0}, ${0})`
    }

    const r = randomNum([0, radix], true)
    const g = randomNum([0, radix], true)
    const b = randomNum([0, radix], true)

    if (type === 'HEX') {
        return rgbToHex(r, g, b)
    } else if (type === 'RGB') {
        return `rgb(${r}, ${g}, ${b})`
    } else {
        return `rgb(${0}, ${0}, ${0})`
    }
}

const getUserMedia = (constraints) => {
    if (!navigator.mediaDevices) {
        navigator.mediaDevices = {}
    }

    if (!navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = constraints => {
            const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia

            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'))
            }

            return new Promise((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject)
            })
        }
    }

    return navigator.mediaDevices.getUserMedia(constraints)
}

export const getVideoMedia = (videoElementId) => {
    const constraints = {
        video: { width: 256, height: 256 }
    }

    const promise = getUserMedia(constraints)

    return new Promise((resolve, reject) => {
        promise.then(stream => {
            const video = document.getElementById(videoElementId)
            if (video) {
                if ('srcObject' in video) {
                    video.srcObject = stream
                } else {
                    video.src = window.URL.createObjectURL(stream)
                }

                video.onloadedmetadata = e => {
                    video.play()
                }
            }

            window.videoStream = stream
            resolve(stream)
        }).catch(err => {
            console.error(err.name + ': ' + err.message)
            reject(err)
        })
    })
}

export const getAudioMedia = () => {
    const constraints = {
        audio: true
    }

    const promise = getUserMedia(constraints)

    return new Promise((resolve, reject) => {
        promise.then(stream => {
            window.audioStream = stream
            resolve(stream)
        }).catch(err => {
            console.error(err.name + ': ' + err.message)
            reject(err)
        })
    })
}

export const stopVideo = () => {
    if (window.videoStream) {
        const track = window.videoStream.getVideoTracks()[0]
        track.stop()
    }
}

export const stopAudio = () => {
    if (window.audioStream) {
        const track = window.audioStream.getAudioTracks()[0]
        track.stop()
    }
}
