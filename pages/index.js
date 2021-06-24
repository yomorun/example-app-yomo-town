import { useState, useEffect, useCallback } from 'react'
import Modal from 'components/Modal'
import PreviewWebcam from 'components/PreviewWebcam'
import CurrentPlayers from 'components/CurrentPlayers'

let scene

export default function Home() {
    const [showNameForm, setShowNameForm] = useState(true)
    const [playerName, setPlayerName] = useState('')
    const [players, setPlayers] = useState([])

    const handleChangeName = useCallback(e => {
        setPlayerName(e.target.value)
    }, [])

    const handleClickJoin = useCallback(e => {
        if (playerName && scene) {
            scene.socket.emit(
                'join',
                JSON.stringify({
                    name: playerName,
                    avatarUrl: '',
                    x: window.getViewportSize.width / 2,
                    y: window.getViewportSize.height / 2
                })
            )

            scene.socket.on('join', msg => {
                setShowNameForm(false)

                localStorage.setItem(
                    'LOCALPLAYER',
                    JSON.stringify({
                        name: playerName,
                        avatarUrl: ''
                    })
                )
            })
        }
    }, [playerName])

    useEffect(() => {
        const localplayer = localStorage.getItem('LOCALPLAYER')
        if (localplayer) {
            const data = JSON.parse(localplayer)
            setPlayerName(data.name)
        }

        const { Game, Scene } = require('lib/scene')

        scene = new Scene({
            socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
            currentPlayersCallback: players => {
                setPlayers(players)
            }
        })

        Game.create({
            scene,
            canvasParent: 'scene'
        })

        return () => {
            scene.socket.disconnect()
        }
    }, [])

    return (
        <>
            <div id='scene'></div>
            <CurrentPlayers data={players} />
            <PreviewWebcam />
            <Modal
                show={showNameForm}
            >
                <p className='text-base'>What is your name?</p>
                <input
                    className='mt-3 py-1 px-2 text-base font-semibold text-center bg-white border-2 border-black rounded outline-none'
                    value={playerName}
                    onChange={handleChangeName}
                />
                <div
                    className='mt-5 flex justify-start items-center py-2 px-4 rounded-lg text-base text-white font-semibold text-center background-purple  cursor-pointer'
                    onClick={handleClickJoin}
                >
                    Join
                </div>
            </Modal>
        </>
    )
}
