import Phaser from 'phaser'
import CircleMaskImagePlugin from 'phaser3-rex-plugins/plugins/circlemaskimage-plugin.js'
import io from 'socket.io-client'
import { fromEvent, merge } from 'rxjs'
import { map, filter } from 'rxjs/operators'
import { getViewportSize, keyPressWASD, inputMap } from './helper'

export class Game {
    constructor({ canvasParent, scene }) {
        window.getViewportSize = getViewportSize()
        this.instance = new Phaser.Game({
            type: Phaser.AUTO,
            scene: scene,
            scale: {
                mode: Phaser.Scale.RESIZE,
                parent: canvasParent,
                width: window.getViewportSize.width,
                height: window.getViewportSize.height,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 }
                }
            },
            plugins: {
                global: [
                    {
                        key: 'rexCircleMaskImagePlugin',
                        plugin: CircleMaskImagePlugin,
                        start: true
                    },
                ]
            },
        })
    }

    static create(config) {
        this.instance = this.instance || new this(config)
        return this.instance
    }
}

export class Scene extends Phaser.Scene {
    constructor({ socketUrl, currentPlayersCallback, onLoadComplete }) {
        super('GameScene')
        this.socket = io(socketUrl)
        this.speed = 5
        this.borderThickness = 30
        this.playerMap = {}
        this.currentPlayersCallback = currentPlayersCallback
        this.onLoadComplete = onLoadComplete
        this.preloadLoadComplete = false
    }

    preload() {
        this.load.image('background', './images/background.png')

        this.load.on('complete', (loader, finishedNum) => {
            if (!this.preloadLoadComplete && this.onLoadComplete) {
                this.onLoadComplete()
            }
            this.preloadLoadComplete = true
        })
    }

    create() {
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0)

        this.socket.on('hostPlayerId', id => {
            this.localPlayerId = id

            // Joined
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
                const localPlayer = this.playerMap[this.localPlayerId]
                if (localPlayer) {
                    this.socket.emit('move', JSON.stringify({
                        input,
                        x: localPlayer.x,
                        y: localPlayer.y,
                        id: this.localPlayerId
                    }))
                }
            })
        })

        // When a new player joins the game
        this.socket.on('current', msg => {
            const currentPlayers = JSON.parse(msg)

            const playerList = []
            for (let i = 0, len = currentPlayers.length; i < len; i++) {
                const item = currentPlayers[i]
                const id = item.id
                const name = `${item.name} [${item.server_region}]`
                if (!this.playerMap[id]) {
                    this._createPlayer(id, item.x, item.y, name, './images/logo.png')
                }

                playerList.push({ id, name })
            }

            this.currentPlayersCallback && this.currentPlayersCallback(playerList)
        })

        // Players are moving
        this.socket.on('move', msg => {
            const action = JSON.parse(msg)
            const player = this.playerMap[action.id]
            if (player) {
                player.input = action.input
                player.setPosition(action.x, action.y)
            }
        })

        // When the player leaves
        this.socket.on('leave', id => {
            const playerMap = this.playerMap
            if (playerMap[id]) {
                playerMap[id].destroy()
                delete playerMap[id]
            }

            const playerList = []
            Object.keys(playerMap).forEach(key => {
                if (key !== id) {
                    playerList.push({ id: key, name: playerMap[key].name })
                }
            })
            this.currentPlayersCallback && this.currentPlayersCallback(playerList)
        })
    }

    update(time, delta) {
        const speed = this.speed
        const playerMap = this.playerMap
        Object.keys(playerMap).forEach(key => {
            const player = playerMap[key]
            const input = player.input

            if (input.left) {
                if (player.x > this.borderThickness) {
                    player.x -= speed
                }
            } else if (input.right) {
                if (player.x < this.background.displayWidth - this.borderThickness) {
                    player.x += speed
                }
            }

            if (input.up) {
                if (player.y > this.borderThickness) {
                    player.y -= speed
                }
            } else if (input.down) {
                if (player.y < this.background.displayHeight - this.borderThickness) {
                    player.y += speed
                }
            }
        })
    }

    _createPlayer(id, x, y, playerName, avatarUrl) {
        this.load.once('complete', () => {
            const avatar = this.add
                .rexCircleMaskImage(0, 0, `avatar_${id}`)
                .setDisplaySize(50, 50)

            const name = this.add
                .text(0, -35, playerName, { fontFamily: 'Arial', color: '#fff' })
                .setFontSize(14)
                .setOrigin(0.5, 0.5)

            const player = this.add.container(x, y)

            player.add(avatar)
            player.add(name)

            if (id === this.localPlayerId) {
                const camera = this.cameras.main
                camera.startFollow(player)
                camera.setBounds(0, 0, this.background.displayWidth, this.background.displayHeight)
            }

            player.name = playerName
            player.input = {
                left: false,
                right: false,
                up: false,
                down: false
            }

            this.playerMap[id] = player
        }, this)

        this.load.once('loaderror', () => {
            console.log('avatar loaderror')
        }, this)

        this.load.image(`avatar_${id}`, avatarUrl)
        this.load.start()
    }
}
