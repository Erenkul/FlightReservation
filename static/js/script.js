// SkyVoyage Elite - Main Script

function generateDummyFlights() {
  return [
    {
      airline: "SkyVoyage Elite",
      flight: "SV203",
      from: "IST",
      to: "LAX",
      departTime: "08:30",
      arrivalTime: "20:30",
      duration: "10h",
      price: 749,
      stops: "Non-stop",
      aircraft: "Boeing 777",
    },
    {
      airline: "SkyVoyage Elite",
      flight: "SV117",
      from: "IST",
      to: "NYC",
      departTime: "10:15",
      arrivalTime: "23:45",
      duration: "11h 30m",
      price: 599,
      stops: "1 Stop (CDG)",
      aircraft: "Airbus A350",
    },
    {
      airline: "SkyVoyage Elite",
      flight: "SV503",
      from: "IST",
      to: "DXB",
      departTime: "14:00",
      arrivalTime: "02:00",
      duration: "10h",
      price: 399,
      stops: "Non-stop",
      aircraft: "Boeing 787",
    },
  ]
}

function navigateToSearch() {
  sessionStorage.setItem("flights", JSON.stringify(generateDummyFlights()))
  window.location.href = "search_result.html"
}

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
  })
})

// Input focus effects
document.querySelectorAll("input, textarea, select").forEach((input) => {
  input.addEventListener("focus", function () {
    this.parentElement?.classList.add("focused")
  })

  input.addEventListener("blur", function () {
    this.parentElement?.classList.remove("focused")
  })
})

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode")
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"))
}

// Load dark mode preference
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode")
}

// Mobile menu toggle
function toggleMobileMenu() {
  const menu = document.querySelector("nav")
  if (menu) {
    menu.classList.toggle("active")
  }
}

// Close mobile menu on link click
document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("nav")?.classList.remove("active")
  })
})

document.querySelectorAll(".cloud").forEach((cloud) => {
  cloud.addEventListener("mouseenter", function () {
    const clone = this.cloneNode(true)

    const scatterX = (Math.random() - 0.5) * 100 - 20
    const scatterY = (Math.random() - 0.5) * 100 - 30

    clone.style.setProperty("--scatter-x", scatterX + "px")
    clone.style.setProperty("--scatter-y", scatterY + "px")

    this.parentNode.replaceChild(clone, this)

    setTimeout(() => {
      clone.addEventListener("mouseenter", arguments.callee)
    }, 800)
  })
})

// Globe Modal Functions
function openGlobeModal() {
  const modal = document.getElementById('globeModal')
  if (modal) {
    modal.classList.add('active')
    document.body.style.overflow = 'hidden'
    // Initialize globe after modal is visible
    setTimeout(() => {
      if (typeof initGlobe === 'function') {
        initGlobe()
      }
    }, 100)
  }
}

function closeGlobeModal() {
  const modal = document.getElementById('globeModal')
  if (modal) {
    modal.classList.remove('active')
    document.body.style.overflow = ''
    // Destroy globe to free resources
    if (typeof destroyGlobe === 'function') {
      destroyGlobe()
    }
  }
}

// Close globe modal on outside click
document.getElementById('globeModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'globeModal') {
    closeGlobeModal()
  }
})

// Close globe modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeGlobeModal()
  }
})
