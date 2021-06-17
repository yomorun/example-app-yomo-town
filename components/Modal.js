import { useEffect, useCallback } from 'react'

const Modal = ({ show, onClose, children, zIndex = 50, isTransparent = false }) => {
    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
    }, [show])

    const closeModal = useCallback(e => {
        e.preventDefault()
        onClose && onClose(e)
    }, [])

    return (
        <div
            className='fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center'
            style={{
                zIndex,
                display: show ? '' : 'none',
                backgroundColor: isTransparent ? '#0a001d7e' : '#0A001D',
            }}
            onClick={closeModal}
        >
            <div
                className='flex flex-col items-center p-8 bg-white text-black rounded-xl'
                style={{ display: show ? '' : 'none' }}
                onClick={e => { e.stopPropagation() }}
            >
                {children}
            </div>
        </div>
    )
}

export default Modal
