import './style.css'
import * as BABYLON from '@babylonjs/core'

/**
 * Инициализирует простую 3D сцену с врагом
 */
async function initGame() {
  console.log('[OPLOT] Инициализация игры...')
  
  // Создаём canvas
  const canvas = document.createElement('canvas')
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
  document.body.style.backgroundColor = '#000'
  document.body.appendChild(canvas)
  
  console.log('[OPLOT] Canvas создан')
  
  // Создаём engine
  const engine = new BABYLON.Engine(canvas, true)
  console.log('[OPLOT] Engine создан')
  
  // Создаём сцену
  const scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1.0)
  console.log('[OPLOT] Scene создана')
  
  // Камера
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    0,
    Math.PI / 2.5,
    20,
    new BABYLON.Vector3(0, 0, 0),
    scene
  )
  camera.attachControl(canvas, true)
  console.log('[OPLOT] Camera создана')
  
  // Свет
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene)
  light.intensity = 0.7
  console.log('[OPLOT] Light создан')
  
  // Создаём врага (простой куб)
  const enemy = BABYLON.MeshBuilder.CreateBox('enemy', { size: 1 }, scene)
  enemy.position.z = 5
  enemy.material = new BABYLON.StandardMaterial('enemyMat', scene)
  enemy.material.emissiveColor = new BABYLON.Color3(1, 0, 0) // Красный
  console.log('[OPLOT] Enemy куб создан')
  
  // Создаём простой UI без GUI библиотеки - прямо HTML
  const uiContainer = document.createElement('div')
  uiContainer.style.position = 'fixed'
  uiContainer.style.bottom = '20px'
  uiContainer.style.left = '50%'
  uiContainer.style.transform = 'translateX(-50%)'
  uiContainer.style.display = 'flex'
  uiContainer.style.gap = '10px'
  uiContainer.style.zIndex = '1000'
  
  // LIGHT button
  const lightBtn = document.createElement('button')
  lightBtn.textContent = '⚡ LIGHT'
  lightBtn.style.padding = '10px 20px'
  lightBtn.style.fontSize = '16px'
  lightBtn.style.backgroundColor = '#00ff00'
  lightBtn.style.color = '#000'
  lightBtn.style.border = 'none'
  lightBtn.style.borderRadius = '5px'
  lightBtn.style.cursor = 'pointer'
  lightBtn.onclick = () => {
    console.log('[COMBAT] Light attack!')
    enemy.position.x += 0.5
  }
  uiContainer.appendChild(lightBtn)
  
  // HEAVY button
  const heavyBtn = document.createElement('button')
  heavyBtn.textContent = '💥 HEAVY'
  heavyBtn.style.padding = '10px 20px'
  heavyBtn.style.fontSize = '16px'
  heavyBtn.style.backgroundColor = '#ff6600'
  heavyBtn.style.color = '#fff'
  heavyBtn.style.border = 'none'
  heavyBtn.style.borderRadius = '5px'
  heavyBtn.style.cursor = 'pointer'
  heavyBtn.onclick = () => {
    console.log('[COMBAT] Heavy attack!')
    enemy.position.x -= 0.5
    enemy.rotation.z += 0.3
  }
  uiContainer.appendChild(heavyBtn)
  
  // RETREAT button
  const retreatBtn = document.createElement('button')
  retreatBtn.textContent = '🏃 RETREAT'
  retreatBtn.style.padding = '10px 20px'
  retreatBtn.style.fontSize = '16px'
  retreatBtn.style.backgroundColor = '#0099ff'
  retreatBtn.style.color = '#fff'
  retreatBtn.style.border = 'none'
  retreatBtn.style.borderRadius = '5px'
  retreatBtn.style.cursor = 'pointer'
  retreatBtn.onclick = () => {
    console.log('[COMBAT] Retreat!')
    camera.radius -= 2
  }
  uiContainer.appendChild(retreatBtn)
  
  document.body.appendChild(uiContainer)
  
  console.log('[OPLOT] UI создан')
  
  // Render loop
  engine.runRenderLoop(() => {
    scene.render()
    
    // Вращаем врага
    enemy.rotation.y += 0.005
  })
  
  console.log('[OPLOT] ✅ ИГРА ИНИЦИАЛИЗИРОВАНА!')
  
  // Resize handler
  window.addEventListener('resize', () => {
    engine.resize()
  })
}

// Инициализируем
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[OPLOT] DOM ready')
    initGame().catch(err => {
      console.error('[OPLOT] ERROR:', err)
      alert('Ошибка загрузки игры: ' + err.message)
    })
  })
} else {
  console.log('[OPLOT] DOM already loaded')
  initGame().catch(err => {
    console.error('[OPLOT] ERROR:', err)
    alert('Ошибка загрузки игры: ' + err.message)
  })
}
