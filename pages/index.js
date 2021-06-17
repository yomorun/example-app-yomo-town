import { useState, useEffect, useCallback, createRef } from 'react'
import Modal from 'components/Modal'
import PreviewWebcam from 'components/PreviewWebcam'
import DeviceSettings from 'components/DeviceSettings'
import Scene from 'components/Scene'

export default function Home() {
    const [showNameForm, setShowNameForm] = useState(true)
    const [playerName, setPlayerName] = useState('')
    const [showDeviceForm, setShowDeviceForm] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [hasEntered, setHasEntered] = useState(false)

    const handleChangeName = useCallback(e => {
        setPlayerName(e.target.value)
    }, [])

    const handleClickContinue = useCallback(e => {
        if (playerName) {
            setShowNameForm(false)
            setShowHint(true)
            setShowDeviceForm(true)
        }
    }, [playerName])

    const handleCloseHint = useCallback(e => {
        setShowHint(false)
    }, [])

    const handleClickJoin = useCallback(e => {
        if (playerName) {
            setHasEntered(true)
        }
    }, [playerName])

    const onJoinedSuccess = () => {
        setShowDeviceForm(false)
    }

    return (
        <>
            {hasEntered &&
                <Scene
                    playerName={playerName}
                    onJoinedSuccess={onJoinedSuccess}
                />
            }
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
                    onClick={handleClickContinue}
                >
                    Continue
                </div>
            </Modal>
            <Modal
                show={showDeviceForm}
            >
                <div className='flex'>
                    <PreviewWebcam />
                    <div className='ml-5'>
                        <DeviceSettings />
                        <div
                            className='mt-10 flex justify-center items-center py-2 px-4 rounded-lg text-base text-white font-semibold text-center background-purple cursor-pointer hover-text-gray'
                            onClick={handleClickJoin}
                        >
                            Join！
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal
                show={showHint}
                zIndex={60}
                isTransparent
            >
                <p className='w-80 text-base'>Your Camera and Microphone are currently blocked, so other attendees won’t be able to hear and see you. Please go to your browser settings and allow SpatialChat to access your camera and microphone, then reload the page.</p>
                <div
                    className='mt-5 flex justify-start items-center py-2 px-4 rounded-lg text-base text-white font-semibold text-center background-purple cursor-pointer'
                    onClick={handleCloseHint}
                >
                    Close
                </div>
            </Modal>
        </>
    )
}
