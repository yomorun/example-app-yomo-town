import React from 'react';
const {useEffect, useState} = React;
import {fromEvent, merge, timer} from 'rxjs';
import {map, filter, scan, distinctUntilChanged, takeUntil, startWith, mergeMap} from 'rxjs/operators';

import './App.css';

// 每次的移动距离（px）
const SPEED = 5;
// 每FPS毫秒刷新一次移动
const FPS = 17;
// 每次按下按键后多久开始被认为是”按住“
const HELD_DOWN_THRESHOLD = 100;

// 与坐标系相关的操作，当前位置、移动方向
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // 移动位置的计算 = 当前位置.add(移动方向向量)
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

// 四种移动方向的向量
const dirLeft = new Vector(-1, 0);
const dirRight = new Vector(1, 0);
const dirUp = new Vector(0, -1);
const dirDown = new Vector(0, 1);

// 当前的位置
const POS = new Vector(0, 0);

// 只接受来自W、A、S、D四个按键的事件
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

// 将W、A、S、D转化成移动方向的向量
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

// TODO：这里应该是通过WebSocket广播自己的位置变化事件的流
const broadcastEvent = (evt) => {
  console.info("Mock WebSocket Broadcast Event:", evt);
};

const App = () => {
  const [left, setLeft] = useState(false);
  const [top, setTop] = useState(false);

  // 每次更新位置
  const setPos = delta => { // console.info(">>Moving", delta.toString())
    POS.add(delta);
    setLeft(POS.x);
    setTop(POS.y);
  };

  useEffect(() => {
    setPos(new Vector(10, 10));

    // ---------------------- 对键盘事件流的抽象 --------------------
    // 键盘keyup事件
    // 当该事件产生时，表示移动结束
    // -----------------------------------------------------------
    const evtKeyUp = fromEvent(document, 'keyup').pipe(map(e => {
      return {evt: "stop", keyCode: e.keyCode}
    }));
  
    // 键盘keydown事件（注意，要过滤掉Long Press的事件）
    // 当该事件产生时，表示移动开始
    const evtKeyDown = fromEvent(document, 'keydown').pipe(filter(e => !e.repeat), map(e => {
      return {evt: "start", keyCode: e.keyCode}
    }));
  
    // 过滤掉W/A/S/D以外的按键
    const motion = merge(evtKeyUp, evtKeyDown).pipe(filter(keyPressWASD));

    // --------------- 对于motion的动作流渲染移动过程 ----------------
    // 注意：motion是对键盘事件的抽象，即本地document的事件，或通过
    // WebSocket.on('motion')接受到的事件
    // -----------------------------------------------------------
    
    // 从motion中获取KeyUp事件，表示松开按键，即停止移动
    const stop$ = motion.pipe(filter(x => x.evt == "stop"))

    // 从motion中获取KeyDown事件，表示按下按键，即开始移动
    const start$ = motion.pipe(filter(x => x.evt == "start"), map(move));

    // position的变化规则是：当前的position，加上方向向量
    const stepMove = (currentPosition, direction) => {
      return currentPosition.add(direction);
    }
  
    // 所有的键盘事件流通过WebSocket发送给YoMo广播
    merge(start$, stop$).subscribe(broadcastEvent);

    // ------------------------------------------------------------------------------------------
    // 情况1：
    // 每按一下按键，都要移动一次
    // -------------------------------------------------------------------------------------------

    // 每一次的start事件对应着物体移动，position不断变化的事件流
    var pos1$ = start$.pipe(
      map(x => x.dir), 
      scan(stepMove, POS)
    );

    // ------------------------------------------------------------------------------------------
    // 情况2：
    // 如果D键一直被按住，应该是在KeyDown事件触发时，先向右移动一次，然后每200ms都向右移动一次，直到KeyUp事件发生
    // -------------------------------------------------------------------------------------------

    // 当前的方向
    var CURRENT_DIRECTION = new Vector(1, 0);

    // 方向变化的流
    var direction$ = motion.pipe(map(move), map(p => p.dir), distinctUntilChanged());
    direction$.subscribe(d => {
      console.log("direction change to ->", d.toString());
      CURRENT_DIRECTION = d;
    });

    // 当按键按住时，延迟HELD_DOWN_THRESHOLD时间后，每FPS更新一次position
    var pos2$ = start$.pipe(
      mergeMap(_ => {
        // 先延迟HELD_DOWN_THRESHOLD时间后，每FPS触发一次事件
        return timer(HELD_DOWN_THRESHOLD, FPS).pipe(
          map(_ => CURRENT_DIRECTION),
          // complete inner timer on keyUp event
          takeUntil(stop$)
        );
      }),
      scan(stepMove, POS)
    )

    // ------------------------------------------------------------------------------------------
    // 两种引起position变化的情况merge起来，每次position变化都重绘UI
    // -------------------------------------------------------------------------------------------

    // 重绘界面
    const renderPosition = p => { 
      console.log("pos:", p.toString())
      setLeft(p.x);
      setTop(p.y);
    }

    // 订阅position变化的事件流，每次变化时都更新位置
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
