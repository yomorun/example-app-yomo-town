import { memo } from 'react'
import Draggable from 'react-draggable'

const CurrentPlayers = ({ data }) => {
    return (
        <Draggable>
            <div className='absolute left-5 top-5 z-10 w-60 max-h-80 overflow-y-auto p-3 flex flex-col border border-gray-100 rounded-md bg-white cursor-move shadow-lg'>
                <div className='text-lg mb-1'>Joined：</div>
                {data.map(item => <p className='mt-1 text-sm text-blue-800' key={item.id}>{item.name}</p>)}
            </div>
        </Draggable>
    )
}

function areEqual(prevProps, nextProps) {
    const _prev = JSON.stringify(prevProps.data)
    const _next = JSON.stringify(nextProps.data)

    return _prev === _next
}

export default memo(CurrentPlayers, areEqual)
