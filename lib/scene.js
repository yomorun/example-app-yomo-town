import Phaser from 'phaser'
import CircleMaskImagePlugin from 'phaser3-rex-plugins/plugins/circlemaskimage-plugin.js'
import io from 'socket.io-client'
import { Observable } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import { getViewportSize } from './helper'
import Listener from './listener'

export class Game {
    constructor({ canvasParent, scene }) {
        window.getViewportSize = getViewportSize()
        this.instance = new Phaser.Game({
            type: Phaser.AUTO,
            parent: canvasParent,
            scene: scene,
            width: window.getViewportSize.width,
            height: window.getViewportSize.height,
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
    constructor({ socketUrl, currentPlayersCallback }) {
        super('GameScene')
        this.socket = io(socketUrl)
        this.speed = 5
        this.playerMap = {}
        this.currentPlayersCallback = currentPlayersCallback
        this.listener = new Listener()
    }

    preload() {
        this.load.image('background', './images/background.png')
    }

    create() {
        // this.background = this.add.image(window.getViewportSize.width / 2, window.getViewportSize.height / 2, 'background')
        this.background = this.add.image(0, 0, 'background').setOrigin(0, 0)

        this.cursors = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT
        })

        this.socket.on('hostPlayerId', id => {
            this.localPlayerId = id
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

        // Filter some repeated operations
        const source = Observable.create(observer => {
            this.listener.on('cursor', data => {
                observer.next(data)
            })
        })

        source
            .pipe(
                distinctUntilChanged((a, b) => JSON.stringify(a.input) === JSON.stringify(b.input))
            )
            .subscribe(data => {
                // Send player actions
                this.socket.emit('move', JSON.stringify(data))
            })
    }

    update(time, delta) {
        const speed = this.speed
        const playerMap = this.playerMap
        Object.keys(playerMap).forEach(key => {
            const player = playerMap[key]
            const input = player.input

            if (input.left) {
                player.x -= speed
            } else if (input.right) {
                player.x += speed
            }

            if (input.up) {
                player.y -= speed
            } else if (input.down) {
                player.y += speed
            }
        })

        const localPlayer = playerMap[this.localPlayerId]
        if (localPlayer) {
            const cursors = this.cursors
            this.listener.emit('cursor', {
                id: this.localPlayerId,
                x: localPlayer.x,
                y: localPlayer.y,
                input: {
                    left: cursors.LEFT.isDown || cursors.A.isDown,
                    right: cursors.RIGHT.isDown || cursors.D.isDown,
                    up: cursors.UP.isDown || cursors.W.isDown,
                    down: cursors.DOWN.isDown || cursors.S.isDown
                }
            })
        }
    }

    _createPlayer(id, x, y, playerName, avatarUrl) {
        this.load.once('complete', () => {
            const avatar = this.add
                .rexCircleMaskImage(0, 0, `avatar_${id}`)
                .setDisplaySize(50, 50)

            const name = this.add
                .text(0, -35, playerName, { fontFamily: 'Arial', color: '#000' })
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

        }, this)

        this.load.image(`avatar_${id}`, avatarUrl)
        this.load.start()
    }
}
