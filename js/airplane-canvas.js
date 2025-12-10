// SkyVoyage Elite - Canvas-Based Airplane Animation System
// Pure vector graphics with glossy white-silver finish and motion blur

class AirplaneAnimation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    if (!this.canvas) {
      console.error("[v0] Canvas element not found:", canvasId)
      return
    }

    this.ctx = this.canvas.getContext("2d")
    this.width = 0
    this.height = 0
    this.airplane = {
      x: -450,
      y: 0,
      scale: 1,
      rotation: -12 * (Math.PI / 180), // slight upward angle
    }
    this.animationId = null
    this.startTime = Date.now()
    this.duration = 25000 // 25 seconds for full pass
    this.planeSize = 380 // base airplane width (scales 300-450px)

    this.init()
  }

  init() {
    this.resize()
    window.addEventListener("resize", () => this.resize())
    this.animate()
  }

  resize() {
    const parent = this.canvas.parentElement
    if (!parent) return

    this.width = parent.offsetWidth || window.innerWidth
    this.height = parent.offsetHeight || window.innerHeight
    this.canvas.width = this.width
    this.canvas.height = this.height

    // Scale airplane based on viewport (300-450px range)
    const viewportScale = Math.min(this.width, this.height) / 900
    this.airplane.scale = Math.max(0.8, Math.min(1.2, viewportScale))
  }

  // Draw fuselage path - reusable for shadow and main body
  drawFuselagePath(ctx) {
    ctx.beginPath()
    // Nose cone (pointed)
    ctx.moveTo(380, 0)
    ctx.quadraticCurveTo(400, -5, 395, -18)
    ctx.quadraticCurveTo(390, -28, 370, -32)
    // Top of fuselage
    ctx.lineTo(45, -32)
    ctx.quadraticCurveTo(15, -32, 5, -18)
    ctx.quadraticCurveTo(-5, -5, -5, 0)
    // Bottom of fuselage
    ctx.quadraticCurveTo(-5, 5, 5, 18)
    ctx.quadraticCurveTo(15, 32, 45, 32)
    ctx.lineTo(370, 32)
    ctx.quadraticCurveTo(390, 28, 395, 18)
    ctx.quadraticCurveTo(400, 5, 380, 0)
    ctx.closePath()
  }

  // Main airplane drawing function - pure vector graphics
  drawAirplane(ctx, x, y, scale, opacity = 1) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(this.airplane.rotation)
    ctx.scale(scale, scale)
    ctx.globalAlpha = opacity

    // === BLUE SHADOW UNDERNEATH ===
    ctx.save()
    ctx.translate(10, 15)
    ctx.fillStyle = "rgba(59, 130, 246, 0.12)"
    this.drawFuselagePath(ctx)
    ctx.fill()
    ctx.restore()

    // === MAIN FUSELAGE - Glossy White-Silver Gradient ===
    const fuselageGradient = ctx.createLinearGradient(0, -40, 0, 40)
    fuselageGradient.addColorStop(0, "#ffffff")
    fuselageGradient.addColorStop(0.2, "#f8fafc")
    fuselageGradient.addColorStop(0.4, "#f1f5f9")
    fuselageGradient.addColorStop(0.6, "#e2e8f0")
    fuselageGradient.addColorStop(0.8, "#cbd5e1")
    fuselageGradient.addColorStop(1, "#94a3b8")

    ctx.fillStyle = fuselageGradient
    this.drawFuselagePath(ctx)
    ctx.fill()

    // Fuselage outline
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"
    ctx.lineWidth = 1
    this.drawFuselagePath(ctx)
    ctx.stroke()

    // === GLOSS HIGHLIGHT on fuselage ===
    const highlightGradient = ctx.createLinearGradient(0, -35, 0, -5)
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.95)")
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    ctx.fillStyle = highlightGradient
    ctx.beginPath()
    ctx.ellipse(200, -18, 150, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // === PASSENGER WINDOWS ===
    this.drawWindows(ctx)

    // === COCKPIT ===
    this.drawCockpit(ctx)

    // === WINGS ===
    this.drawWings(ctx)

    // === TAIL ===
    this.drawTail(ctx)

    // === ENGINES ===
    this.drawEngines(ctx)

    // === LANDING GEAR ===
    this.drawLandingGear(ctx)

    ctx.restore()
  }

  drawWindows(ctx) {
    // Passenger windows with cyan tint
    ctx.fillStyle = "#0ea5e9"
    ctx.strokeStyle = "#0284c7"
    ctx.lineWidth = 0.8

    for (let i = 0; i < 14; i++) {
      const wx = 85 + i * 20
      ctx.beginPath()
      ctx.roundRect(wx, -24, 7, 10, 2)
      ctx.fill()
      ctx.stroke()

      // Window glare
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.beginPath()
      ctx.roundRect(wx + 1, -23, 2.5, 4, 1)
      ctx.fill()
      ctx.fillStyle = "#0ea5e9"
    }
  }

  drawCockpit(ctx) {
    // Cockpit window gradient
    const cockpitGradient = ctx.createLinearGradient(350, -28, 390, 5)
    cockpitGradient.addColorStop(0, "#0c4a6e")
    cockpitGradient.addColorStop(0.4, "#0369a1")
    cockpitGradient.addColorStop(0.7, "#0ea5e9")
    cockpitGradient.addColorStop(1, "#38bdf8")

    ctx.fillStyle = cockpitGradient
    ctx.beginPath()
    ctx.moveTo(348, -24)
    ctx.quadraticCurveTo(368, -28, 385, -12)
    ctx.quadraticCurveTo(395, 0, 385, 5)
    ctx.quadraticCurveTo(375, -5, 365, -10)
    ctx.quadraticCurveTo(352, -15, 348, -24)
    ctx.closePath()
    ctx.fill()

    // Cockpit frame lines
    ctx.strokeStyle = "#475569"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(358, -22)
    ctx.lineTo(378, -2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(368, -20)
    ctx.lineTo(383, -5)
    ctx.stroke()

    // Cockpit glare
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)"
    ctx.beginPath()
    ctx.ellipse(356, -20, 8, 4, -0.4, 0, Math.PI * 2)
    ctx.fill()
  }

  drawWings(ctx) {
    // Wing gradient (silver metallic)
    const wingGradient = ctx.createLinearGradient(0, 0, 0, 100)
    wingGradient.addColorStop(0, "#f1f5f9")
    wingGradient.addColorStop(0.3, "#e2e8f0")
    wingGradient.addColorStop(0.7, "#cbd5e1")
    wingGradient.addColorStop(1, "#94a3b8")

    // Bottom wing (perspective - going down-back)
    ctx.fillStyle = wingGradient
    ctx.beginPath()
    ctx.moveTo(190, 28)
    ctx.lineTo(260, 35)
    ctx.lineTo(230, 115)
    ctx.lineTo(165, 110)
    ctx.lineTo(130, 50)
    ctx.closePath()
    ctx.fill()

    // Wing spar line
    ctx.strokeStyle = "#94a3b8"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(175, 40)
    ctx.lineTo(205, 105)
    ctx.stroke()

    // Top wing gradient (lighter)
    const wingGradientTop = ctx.createLinearGradient(0, 0, 0, -100)
    wingGradientTop.addColorStop(0, "#ffffff")
    wingGradientTop.addColorStop(0.3, "#f8fafc")
    wingGradientTop.addColorStop(0.7, "#e2e8f0")
    wingGradientTop.addColorStop(1, "#cbd5e1")

    // Top wing (going up-back)
    ctx.fillStyle = wingGradientTop
    ctx.beginPath()
    ctx.moveTo(190, -28)
    ctx.lineTo(260, -35)
    ctx.lineTo(230, -115)
    ctx.lineTo(165, -110)
    ctx.lineTo(130, -50)
    ctx.closePath()
    ctx.fill()

    // Wing highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    ctx.beginPath()
    ctx.moveTo(195, -32)
    ctx.lineTo(235, -42)
    ctx.lineTo(215, -85)
    ctx.lineTo(175, -75)
    ctx.closePath()
    ctx.fill()

    // Winglets
    ctx.fillStyle = "#64748b"
    // Top winglet
    ctx.beginPath()
    ctx.moveTo(215, -112)
    ctx.lineTo(225, -135)
    ctx.lineTo(240, -118)
    ctx.closePath()
    ctx.fill()
    // Bottom winglet
    ctx.beginPath()
    ctx.moveTo(215, 112)
    ctx.lineTo(225, 135)
    ctx.lineTo(240, 118)
    ctx.closePath()
    ctx.fill()
  }

  drawTail(ctx) {
    // Vertical stabilizer gradient
    const tailGradient = ctx.createLinearGradient(25, -30, 25, -100)
    tailGradient.addColorStop(0, "#f1f5f9")
    tailGradient.addColorStop(0.5, "#e2e8f0")
    tailGradient.addColorStop(1, "#94a3b8")

    ctx.fillStyle = tailGradient
    ctx.beginPath()
    ctx.moveTo(55, -30)
    ctx.lineTo(25, -100)
    ctx.lineTo(5, -95)
    ctx.lineTo(8, -30)
    ctx.closePath()
    ctx.fill()

    // Tail stripe (airline livery - cyan)
    ctx.fillStyle = "#06b6d4"
    ctx.beginPath()
    ctx.moveTo(40, -50)
    ctx.lineTo(25, -90)
    ctx.lineTo(15, -88)
    ctx.lineTo(28, -50)
    ctx.closePath()
    ctx.fill()

    // Horizontal stabilizers
    ctx.fillStyle = "#cbd5e1"
    // Top
    ctx.beginPath()
    ctx.moveTo(65, -28)
    ctx.lineTo(30, -32)
    ctx.lineTo(8, -60)
    ctx.lineTo(0, -55)
    ctx.lineTo(18, -28)
    ctx.closePath()
    ctx.fill()
    // Bottom
    ctx.beginPath()
    ctx.moveTo(65, 28)
    ctx.lineTo(30, 32)
    ctx.lineTo(8, 55)
    ctx.lineTo(0, 50)
    ctx.lineTo(18, 28)
    ctx.closePath()
    ctx.fill()
  }

  drawEngines(ctx) {
    // Engine nacelle gradient
    const engineGradient = ctx.createLinearGradient(0, -18, 0, 18)
    engineGradient.addColorStop(0, "#f1f5f9")
    engineGradient.addColorStop(0.3, "#e2e8f0")
    engineGradient.addColorStop(0.7, "#94a3b8")
    engineGradient.addColorStop(1, "#64748b")

    // Bottom engine
    ctx.save()
    ctx.translate(180, 62)

    // Engine body
    ctx.fillStyle = engineGradient
    ctx.beginPath()
    ctx.ellipse(0, 0, 40, 14, 0, 0, Math.PI * 2)
    ctx.fill()

    // Engine intake (dark)
    ctx.fillStyle = "#1e293b"
    ctx.beginPath()
    ctx.ellipse(35, 0, 12, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // Fan blades
    ctx.strokeStyle = "#475569"
    ctx.lineWidth = 1.2
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(35, 0)
      ctx.lineTo(35 + Math.cos(angle) * 10, Math.sin(angle) * 10)
      ctx.stroke()
    }

    // Engine thrust glow
    const glowGradient = ctx.createRadialGradient(-45, 0, 0, -45, 0, 30)
    glowGradient.addColorStop(0, "rgba(6, 182, 212, 0.7)")
    glowGradient.addColorStop(0.4, "rgba(6, 182, 212, 0.3)")
    glowGradient.addColorStop(1, "rgba(6, 182, 212, 0)")
    ctx.fillStyle = glowGradient
    ctx.beginPath()
    ctx.ellipse(-50, 0, 35, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Top engine (mirror)
    ctx.save()
    ctx.translate(180, -62)

    ctx.fillStyle = engineGradient
    ctx.beginPath()
    ctx.ellipse(0, 0, 40, 14, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#1e293b"
    ctx.beginPath()
    ctx.ellipse(35, 0, 12, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = "#475569"
    ctx.lineWidth = 1.2
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4
      ctx.beginPath()
      ctx.moveTo(35, 0)
      ctx.lineTo(35 + Math.cos(angle) * 10, Math.sin(angle) * 10)
      ctx.stroke()
    }

    const glowGradient2 = ctx.createRadialGradient(-45, 0, 0, -45, 0, 30)
    glowGradient2.addColorStop(0, "rgba(6, 182, 212, 0.7)")
    glowGradient2.addColorStop(0.4, "rgba(6, 182, 212, 0.3)")
    glowGradient2.addColorStop(1, "rgba(6, 182, 212, 0)")
    ctx.fillStyle = glowGradient2
    ctx.beginPath()
    ctx.ellipse(-50, 0, 35, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  drawLandingGear(ctx) {
    ctx.strokeStyle = "#475569"
    ctx.fillStyle = "#1e293b"
    ctx.lineWidth = 3

    // Front gear strut
    ctx.beginPath()
    ctx.moveTo(325, 32)
    ctx.lineTo(325, 55)
    ctx.stroke()
    // Front wheel
    ctx.beginPath()
    ctx.arc(325, 62, 7, 0, Math.PI * 2)
    ctx.fill()

    // Rear gear left
    ctx.beginPath()
    ctx.moveTo(145, 32)
    ctx.lineTo(140, 60)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(140, 67, 7, 0, Math.PI * 2)
    ctx.fill()

    // Rear gear right
    ctx.beginPath()
    ctx.moveTo(165, 32)
    ctx.lineTo(170, 60)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(170, 67, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  // Motion blur - draw trailing ghost shapes
  drawMotionBlur(ctx, x, y, scale) {
    const numTrails = 5
    const trailSpacing = 50 * scale

    for (let i = numTrails; i >= 1; i--) {
      const trailX = x - i * trailSpacing
      const trailY = y + i * trailSpacing * 0.25 // slight diagonal offset
      const trailOpacity = (0.06 * (numTrails - i + 1)) / numTrails
      const trailScale = scale * (0.92 + (0.08 * (numTrails - i)) / numTrails)

      this.drawAirplane(ctx, trailX, trailY, trailScale, trailOpacity)
    }
  }

  update() {
    const elapsed = Date.now() - this.startTime
    const progress = (elapsed % this.duration) / this.duration

    // Smooth ease-in-out curve
    const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

    // Diagonal flight path: bottom-left to top-right
    const startX = -450
    const endX = this.width + 450
    const startY = this.height * 0.78
    const endY = this.height * 0.18

    this.airplane.x = startX + (endX - startX) * easeProgress
    this.airplane.y = startY + (endY - startY) * easeProgress

    // Subtle bobbing motion
    this.airplane.y += Math.sin(elapsed / 600) * 6
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height)

    const { x, y, scale } = this.airplane

    // Draw motion blur ghost trails first (behind main plane)
    this.drawMotionBlur(this.ctx, x, y, scale)

    // Draw main airplane on top with slightly reduced opacity for realism
    this.drawAirplane(this.ctx, x, y, scale, 0.88)
  }

  animate() {
    this.update()
    this.render()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

// Initialize when DOM is fully ready
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("airplane-canvas")
  if (canvas) {
    window.airplaneAnim = new AirplaneAnimation("airplane-canvas")
  }
})
