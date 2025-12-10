// SkyVoyage Elite - Premium 3D Globe System
// Three.js powered interactive Earth with city markers

class GlobeSystem {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.globe = null;
    this.atmosphere = null;
    this.cityMarkers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isRotating = true;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.hoveredMarker = null;
    this.animationId = null;
    
    // City data with coordinates
    this.cities = [
      { name: "Istanbul", lat: 41.0082, lng: 28.9784, country: "Turkey" },
      { name: "New York", lat: 40.7128, lng: -74.0060, country: "USA" },
      { name: "London", lat: 51.5072, lng: -0.1276, country: "UK" },
      { name: "Tokyo", lat: 35.6762, lng: 139.6503, country: "Japan" },
      { name: "Dubai", lat: 25.2048, lng: 55.2708, country: "UAE" },
      { name: "Paris", lat: 48.8566, lng: 2.3522, country: "France" },
      { name: "Madrid", lat: 40.4168, lng: -3.7038, country: "Spain" },
      { name: "Berlin", lat: 52.5200, lng: 13.4050, country: "Germany" },
      { name: "Rome", lat: 41.9028, lng: 12.4964, country: "Italy" },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437, country: "USA" },
      { name: "Toronto", lat: 43.6532, lng: -79.3832, country: "Canada" },
      { name: "Singapore", lat: 1.3521, lng: 103.8198, country: "Singapore" },
      { name: "Sydney", lat: -33.8688, lng: 151.2093, country: "Australia" },
      { name: "Moscow", lat: 55.7558, lng: 37.6173, country: "Russia" },
      { name: "Mumbai", lat: 19.0760, lng: 72.8777, country: "India" },
      { name: "São Paulo", lat: -23.5505, lng: -46.6333, country: "Brazil" }
    ];
  }

  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 3;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Create globe
    this.createGlobe();
    this.createAtmosphere();
    this.createStars();
    this.createCityMarkers();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    this.scene.add(directionalLight);

    // Event listeners
    this.setupEventListeners(container);

    // Start animation
    this.animate();
  }

  createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Create gradient texture for Earth
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Ocean gradient
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGradient.addColorStop(0, '#0c4a6e');
    oceanGradient.addColorStop(0.3, '#0369a1');
    oceanGradient.addColorStop(0.5, '#0284c7');
    oceanGradient.addColorStop(0.7, '#0369a1');
    oceanGradient.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some land masses (simplified)
    ctx.fillStyle = '#10b981';
    this.drawSimplifiedContinents(ctx, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpScale: 0.02,
      specular: new THREE.Color(0x333333),
      shininess: 15
    });

    this.globe = new THREE.Mesh(geometry, material);
    this.scene.add(this.globe);
  }

  drawSimplifiedContinents(ctx, w, h) {
    // Simplified continent shapes
    ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
    
    // North America
    ctx.beginPath();
    ctx.ellipse(w * 0.2, h * 0.3, w * 0.12, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.ellipse(w * 0.28, h * 0.6, w * 0.06, h * 0.18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.28, w * 0.06, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Africa
    ctx.beginPath();
    ctx.ellipse(w * 0.54, h * 0.52, w * 0.08, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.ellipse(w * 0.7, h * 0.32, w * 0.15, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.65, w * 0.05, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  createAtmosphere() {
    const geometry = new THREE.SphereGeometry(1.05, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.024, 0.714, 0.831, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.atmosphere);
  }

  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 100;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  createCityMarkers() {
    this.cities.forEach(city => {
      const position = this.latLngToVector3(city.lat, city.lng, 1.02);
      
      // Marker sphere
      const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.9
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      marker.userData = { city: city.name, country: city.country };
      
      // Glow ring
      const ringGeometry = new THREE.RingGeometry(0.025, 0.04, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      
      this.scene.add(marker);
      this.scene.add(ring);
      this.cityMarkers.push({ marker, ring, city });
    });
  }

  latLngToVector3(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  }

  setupEventListeners(container) {
    const canvas = this.renderer.domElement;
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e, container));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
    canvas.addEventListener('click', (e) => this.onClick(e, container));
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e, container));
    canvas.addEventListener('touchend', () => this.onMouseUp());
    
    // Wheel zoom
    canvas.addEventListener('wheel', (e) => this.onWheel(e));
    
    // Resize
    window.addEventListener('resize', () => this.onResize(container));
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.isRotating = false;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e, container) {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    if (this.isDragging) {
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      
      this.rotationVelocity.x = deltaY * 0.005;
      this.rotationVelocity.y = deltaX * 0.005;
      
      this.globe.rotation.x += this.rotationVelocity.x;
      this.globe.rotation.y += this.rotationVelocity.y;
      
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }
    
    // Check for marker hover
    this.checkMarkerHover();
  }

  onMouseUp() {
    this.isDragging = false;
    setTimeout(() => {
      this.isRotating = true;
    }, 1000);
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.isRotating = false;
      this.previousMousePosition = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
    }
  }

  onTouchMove(e, container) {
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.previousMousePosition.x;
      const deltaY = touch.clientY - this.previousMousePosition.y;
      
      this.globe.rotation.x += deltaY * 0.005;
      this.globe.rotation.y += deltaX * 0.005;
      
      this.previousMousePosition = { x: touch.clientX, y: touch.clientY };
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomSpeed = 0.001;
    this.camera.position.z += e.deltaY * zoomSpeed;
    this.camera.position.z = Math.max(1.8, Math.min(5, this.camera.position.z));
  }

  onClick(e, container) {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const markers = this.cityMarkers.map(cm => cm.marker);
    const intersects = this.raycaster.intersectObjects(markers);
    
    if (intersects.length > 0) {
      const cityName = intersects[0].object.userData.city;
      this.selectCity(cityName);
      this.pulseMarker(intersects[0].object);
    }
  }

  checkMarkerHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const markers = this.cityMarkers.map(cm => cm.marker);
    const intersects = this.raycaster.intersectObjects(markers);
    
    // Reset all markers
    this.cityMarkers.forEach(cm => {
      cm.marker.material.color.setHex(0x06b6d4);
      cm.marker.scale.setScalar(1);
    });
    
    // Update tooltip
    const tooltip = document.getElementById('globeTooltip');
    
    if (intersects.length > 0) {
      const marker = intersects[0].object;
      marker.material.color.setHex(0x22d3ee);
      marker.scale.setScalar(1.5);
      
      if (tooltip) {
        tooltip.textContent = `${marker.userData.city}, ${marker.userData.country}`;
        tooltip.style.opacity = '1';
      }
      
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      if (tooltip) tooltip.style.opacity = '0';
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  pulseMarker(marker) {
    const originalScale = 1;
    let scale = 2;
    const pulse = () => {
      scale -= 0.05;
      if (scale > originalScale) {
        marker.scale.setScalar(scale);
        requestAnimationFrame(pulse);
      } else {
        marker.scale.setScalar(originalScale);
      }
    };
    pulse();
  }

  selectCity(cityName) {
    const departureInput = document.getElementById('departure-input');
    const arrivalInput = document.getElementById('arrival-input');
    
    if (departureInput && arrivalInput) {
      if (!departureInput.value) {
        departureInput.value = cityName;
        departureInput.classList.add('input-filled');
      } else if (!arrivalInput.value) {
        arrivalInput.value = cityName;
        arrivalInput.classList.add('input-filled');
      } else {
        arrivalInput.value = cityName;
      }
    }
    
    // Close modal after selection
    setTimeout(() => {
      closeGlobeModal();
    }, 300);
  }

  onResize(container) {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Idle rotation
    if (this.isRotating && !this.isDragging) {
      this.globe.rotation.y += 0.002;
    }
    
    // Inertia
    if (!this.isDragging) {
      this.rotationVelocity.x *= 0.95;
      this.rotationVelocity.y *= 0.95;
      this.globe.rotation.x += this.rotationVelocity.x;
      this.globe.rotation.y += this.rotationVelocity.y;
    }
    
    // Sync markers with globe rotation
    this.cityMarkers.forEach(cm => {
      const pos = this.latLngToVector3(cm.city.lat, cm.city.lng, 1.02);
      pos.applyEuler(this.globe.rotation);
      cm.marker.position.copy(pos);
      cm.ring.position.copy(pos);
      cm.ring.lookAt(new THREE.Vector3(0, 0, 0));
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Global instance
let globeInstance = null;

function initGlobe() {
  if (!globeInstance) {
    globeInstance = new GlobeSystem();
  }
  globeInstance.init('globeContainer');
}

function destroyGlobe() {
  if (globeInstance) {
    globeInstance.destroy();
    globeInstance = null;
  }
  const container = document.getElementById('globeContainer');
  if (container) container.innerHTML = '';
}

