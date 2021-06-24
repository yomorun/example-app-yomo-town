export const getViewportSize = () => {
    return {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
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
