import { useState, useEffect, useCallback, createRef, memo } from 'react'
import { fromEvent, merge } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import io from 'socket.io-client'

let socket
let hostPlayerId = ''
const playerMap = {}
const SPEED = 5

const keyPressWASD = e => {
    switch (e.keyCode) {
        case 87:
        case 83:
        case 65:
        case 68:
            return true
        default:
            return false
    }
}

const inputMap = e => {
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
    }

    return input
}

const Scene = ({ playerName, onJoinedSuccess }) => {
    const [otherPlayers, setOtherPlayers] = useState([])
    const [hostPlayer, setHostPlayer] = useState(null)

    useEffect(() => {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL)

        socket.emit(
            'join',
            JSON.stringify({
                name: playerName,
                x: 0,
                y: 0
            })
        )

        socket.on('join', msg => {
            onJoinedSuccess()
        })

        socket.on('hostPlayerId', id => {
            hostPlayerId = id
        })

        // When a new player joins the game
        socket.on('current', msg => {
            const currentPlayers = JSON.parse(msg)
            const otherPlayers = []
            for (let i = 0, len = currentPlayers.length; i < len; i++) {
                const item = currentPlayers[i]
                const id = item.id
                if (!playerMap[id]) {
                    const nodeRef = createRef()

                    playerMap[id] = {
                        nodeRef,
                        input: {
                            left: false,
                            right: false,
                            up: false,
                            down: false
                        },
                        position: {
                            left: 0,
                            top: 0
                        }
                    }

                    item.nodeRef = nodeRef

                    if (id === hostPlayerId) {
                        setHostPlayer(item)
                    } else {
                        otherPlayers.push(item)
                    }
                }
            }

            setOtherPlayers(otherPlayers)
        })

        // When the player leaves
        socket.on('leave', id => {
            if (playerMap[id]) {
                delete playerMap[id]
                setOtherPlayers(otherPlayers => {
                    return otherPlayers.filter(item => item.id !== id)
                })
            }
        })


        // Player action
        const evtKeyUp = fromEvent(document, 'keyup').pipe(map(e => {
            return { type: 'stop', keyCode: e.keyCode }
        }))

        const evtKeyDown = fromEvent(document, 'keydown').pipe(filter(e => !e.repeat), map(e => {
            return { type: 'start', keyCode: e.keyCode }
        }))

        // Filter some repeated operations
        const motion = merge(evtKeyUp, evtKeyDown).pipe(
            filter(keyPressWASD),
            map(inputMap)
        )

        // Send player actions
        motion.subscribe(input => {
            const player = playerMap[hostPlayerId]

            if (player) {
                const { left, top } = player.nodeRef.current.getBoundingClientRect()

                socket.emit('move', JSON.stringify({
                    input,
                    position: {
                        left,
                        top,
                    },
                    id: hostPlayerId,
                }))
            }
        })

        // Players are moving
        socket.on('move', msg => {
            const action = JSON.parse(msg)
            const player = playerMap[action.id]
            if (player) {
                player.input = action.input
                player.position = action.position
            }
        })



        // Animation frames
        const drawFrame = () => {
            window.requestAnimationFrame(drawFrame)

            Object.keys(playerMap).forEach(key => {
                const player = playerMap[key]
                const { position, input, nodeRef } = player

                if (input) {
                    if (input.left) {
                        const x = position.left - SPEED
                        nodeRef.current.style = `transform: translate3d(${x}px, ${position.top}px, 0);`
                        player.position.left = x
                    } else if (input.right) {
                        const x = position.left + SPEED
                        nodeRef.current.style = `transform: translate3d(${x}px, ${position.top}px, 0);`
                        player.position.left = x
                    }

                    if (input.up) {
                        const y = position.top - SPEED
                        nodeRef.current.style = `transform: translate3d(${position.left}px, ${y}px, 0);`
                        player.position.top = y
                    } else if (input.down) {
                        const y = position.top + SPEED
                        nodeRef.current.style = `transform: translate3d(${position.left}px, ${y}px, 0);`
                        player.position.top = y
                    }
                }
            })
        }

        drawFrame()

        return () => {
            socket.disconnect()
        }
    }, [])

    return (
        <>
            <div className='w-full flex-1 flex flex-col justify-center items-center z-30'>
                <p className='text-white'>
                    <span>Build a</span>&nbsp;
                    <a
                        className='font-purple hover-text-gray'
                        href='https://github.com/yomorun/yomo'
                        target='_blank'
                    >
                        Edge-Mesh-Arch
                    </a>&nbsp;
                    <span>online office, use [W/A/S/D] to control movement.</span>&nbsp;
                    (<a
                        className='font-purple hover-text-gray'
                        href='https://github.com/yomorun/example-app-yomo-town'
                        target='_blank'
                    >
                        Full Source Code can be found here
                    </a>)
                </p>
            </div>
            <div className='fixed left-0 top-0 h-full w-full z-20'>
                {hostPlayer && (
                    <div
                        className='absolute top-0 left-0'
                        ref={hostPlayer.nodeRef}
                    >
                        <div className='text-center text-white'>{`${hostPlayer.name} [${hostPlayer.server_region}]`}</div>
                        <img className='w-12 mx-auto rounded-full border border-gray-600' src='/images/logo.png' alt='' />
                    </div>
                )}
            </div>
            <div className='fixed left-0 top-0 h-full w-full z-10'>
                {otherPlayers.map(item => (
                    <div
                        className='absolute top-0 left-0'
                        ref={item.nodeRef}
                        key={item.id}
                    >
                        <div className='text-center text-white'>{`${item.name} [${item.server_region}]`}</div>
                        <img className='w-12 mx-auto rounded-full border border-gray-600' src='/images/logo.png' alt='' />
                    </div>
                ))}
            </div>
        </>
    )
}

function areEqual(prevProps, nextProps) {
    return prevProps.playerName === nextProps.playerName
}

export default memo(Scene, areEqual)
