import React from 'react';
const {useEffect, useState} = React;
import {fromEvent, merge, timer} from 'rxjs';
import {map, filter, scan, distinctUntilChanged, takeUntil, startWith, mergeMap} from 'rxjs/operators';

import './App.css';

// Distance per movement (in px)
const SPEED = 5;
// Movements are refreshed every FPS milliseconds
const FPS = 17;
// How long after KeyPress is considered to be "held"
const HELD_DOWN_THRESHOLD = 100;

// Operations related to coordinate system: position & direction of movement
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // Calculation of move position = CurrentPosition.add(Move_Direction_Vector)
  add(vec) {
    this.x += vec.x * SPEED;
    this.y += vec.y * SPEED;
    return this;
  }

  toString() { // return `[${this.x} , ${this.y}] ${(new Date).valueOf()}`;
    return `[${
      this.x
    } , ${
      this.y
    }]`;
  }
}

// Vector of four moving directions
const dirLeft = new Vector(-1, 0);
const dirRight = new Vector(1, 0);
const dirUp = new Vector(0, -1);
const dirDown = new Vector(0, 1);

// Current position
const POS = new Vector(0, 0);

// Only accepts events from the W, A, S and D buttons
const keyPressWASD = (e) => {
  switch (e.keyCode) {
    case 87:
    case 83:
    case 65:
    case 68:
      return true;
    default:
      return false;
  }
};

// Transform W, A, S, D into vectors of moving directions
const move = (e) => {
  var dir;
  switch (e.keyCode) {
    case 87: dir = dirUp;
      break;
    case 83: dir = dirDown;
      break;
    case 65: dir = dirLeft;
      break;
    case 68: dir = dirRight;
  }
  return Object.assign(e, {dir});
};

// TODO：Broadcast KeyDown and KeyUp event streams to others in this game room
const broadcastEvent = (evt) => {
  console.info("Mock WebSocket Broadcast Event:", evt);
};

const App = () => {
  const [left, setLeft] = useState(false);
  const [top, setTop] = useState(false);

  // Update position with Delta
  const setPos = delta => { // console.info(">>Moving", delta.toString())
    POS.add(delta);
    setLeft(POS.x);
    setTop(POS.y);
  };

  useEffect(() => {
    setPos(new Vector(10, 10));

    // ----------- abstraction of the keyboard event stream --------------------
    // Keyboard `keyup` event
    // When this event is generated, it indicates the end of the move
    // -------------------------------------------------------------------------
    const evtKeyUp = fromEvent(document, 'keyup').pipe(map(e => {
      return {evt: "stop", keyCode: e.keyCode}
    }));
  
    // Keyboard `keydown` event (note: filter out the Long Press events)
    // When this event is generated, it indicates start moving
    const evtKeyDown = fromEvent(document, 'keydown').pipe(filter(e => !e.repeat), map(e => {
      return {evt: "start", keyCode: e.keyCode}
    }));
  
    // Filter out keys other than W/A/S/D
    const motion = merge(evtKeyUp, evtKeyDown).pipe(filter(keyPressWASD));

    // --------------- for motion's action stream rendering movement process ----------------
    // Note: motion is an abstraction of keyboard events, i.e. events from the local document, 
    // or events received via WebSocket.on('motion') received events
    // --------------------------------------------------------------------------------------
    
    // Get the KeyUp event from motion, which means release the key, stop moving
    const stop$ = motion.pipe(filter(x => x.evt == "stop"))

    // Get the KeyDown event from motion, which means the key is pressed, start moving
    const start$ = motion.pipe(filter(x => x.evt == "start"), map(move));

    // Compute position changed every movement
    const stepMove = (currentPosition, direction) => {
      return currentPosition.add(direction);
    }
  
    // Keyboard events are broadcast to YoMo via WebSocket
    merge(start$, stop$).subscribe(broadcastEvent);

    // ------------------------------------------------------------------------------------------
    // Situation 1：
    // Move every time when keydown
    // -------------------------------------------------------------------------------------------

    // 每一次的start事件对应着物体移动，position不断变化的事件流
    var pos1$ = start$.pipe(
      map(x => x.dir), 
      scan(stepMove, POS)
    );

    // ------------------------------------------------------------------------------------------
    // Situation 2：
    // If the `D` key is always held down, it should move to the right once when the KeyDown event 
    // is triggered, wait 200ms and then triggered every 17ms, until the KeyUp event occurs
    // -------------------------------------------------------------------------------------------

    // Initial the current direcdtion
    var CURRENT_DIRECTION = new Vector(1, 0);

    // Stream of directions
    var direction$ = motion.pipe(map(move), map(p => p.dir), distinctUntilChanged());
    direction$.subscribe(d => {
      console.log("direction change to ->", d.toString());
      CURRENT_DIRECTION = d;
    });

    // When the button is pressed and held, after delaying HELD_DOWN_THRESHOLD time, 
    // the position is updated once per FPS
    var pos2$ = start$.pipe(
      mergeMap(_ => {
        // After first delaying HELD_DOWN_THRESHOLD time, the event is triggered once per FPS
        return timer(HELD_DOWN_THRESHOLD, FPS).pipe(
          map(_ => CURRENT_DIRECTION),
          // Complete inner timer on keyUp event
          takeUntil(stop$)
        );
      }),
      scan(stepMove, POS)
    )

    // ------------------------------------------------------------------------------------------
    // The two cases of position change are merged together, and the UI is redrawn each time 
    // the position changes
    // -------------------------------------------------------------------------------------------

    // Redraw UI
    const renderPosition = p => { 
      console.log("pos:", p.toString())
      setLeft(p.x);
      setTop(p.y);
    }

    // Subscribe to the event stream for position changes and update the position each time it changes
    merge(pos1$, pos2$).subscribe(renderPosition)
    
    return() => {};
  }, []);

  return (
    <img src="/favicon.ico" className="test"
      style={
        {
          position: "absolute",
          left,
          top
        }
    } />
  );
};

export default App;
