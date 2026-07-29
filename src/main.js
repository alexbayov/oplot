import './style.css'
import * as BABYLON from '@babylonjs/core'
import { InteractiveCombat } from './scenes/InteractiveCombat'

/**
 * Инициализирует игру
 */
async function initGame() {
  console.log('[OPLOT] Инициализация игры...')
  
  // Создаём canvas если его нет
  let canvas = document.getElementById('game-canvas')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.id = 'game-canvas'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.width = '100%'
    canvas.style.height = '100vh'
    canvas.style.margin = '0'
    canvas.style.padding = '0'
    canvas.style.display = 'block'
    document.body.innerHTML = ''
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.appendChild(canvas)
  }
  
  // Создаём Babylon.js engine
  const engine = new BABYLON.Engine(canvas, true, {
    deterministicLockstep: true,
    lockstepMaxSteps: 4,
  })
  
  console.log('[OPLOT] Babylon.js Engine создан')
  
  // Создаём сцену
  const scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1.0)
  
  console.log('[OPLOT] Scene создана')
  
  // Инициализируем Interactive Combat
  const combatScene = new InteractiveCombat(scene)
  await combatScene.initialize()
  
  console.log('[OPLOT] InteractiveCombat инициализирована')
  
  // Запускаем render loop
  engine.runRenderLoop(() => {
    scene.render()
  })
  
  console.log('[OPLOT] Render loop запущен')
  
  // Обработчик изменения размера окна
  window.addEventListener('resize', () => {
    engine.resize()
  })
}

// Инициализировать при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[OPLOT] DOM готов')
    initGame().catch(err => {
      console.error('[OPLOT] Ошибка инициализации:', err)
    })
  })
} else {
  console.log('[OPLOT] DOM уже готов')
  initGame().catch(err => {
    console.error('[OPLOT] Ошибка инициализации:', err)
  })
}
