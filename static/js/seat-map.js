// SkyVoyage Elite - Seat Reservation Engine

// Seat configuration
const ROWS = 30
const COLUMNS = ["A", "B", "C", "D", "E", "F"]
const STORAGE_KEYS = {
  SEATS: "skyvoyage_seats",
  BOOKING: "skyvoyage_booking",
}

// Reserved seats - DB'den gelecek (global değişken)
let RESERVED_SEATS = []

// Initialize seat map
function loadSeatMap() {
  const container = document.getElementById("seatMapContainer")
  if (!container) return

  // DB'den gelen rezerve koltukları al (eğer tanımlıysa)
  if (typeof RESERVED_SEATS_DB !== 'undefined') {
    RESERVED_SEATS = RESERVED_SEATS_DB
  }

  container.innerHTML = ""
  renderSeats(container)
}

// Render all seats
function renderSeats(container) {
  const seatMap = document.createElement("div")
  seatMap.className = "seat-map"

  // Create rows
  for (let row = 1; row <= ROWS; row++) {
    const rowDiv = document.createElement("div")
    rowDiv.className = "seat-row"

    // Row number (left)
    const rowNumLeft = document.createElement("div")
    rowNumLeft.className = "row-number"
    rowNumLeft.textContent = row
    rowDiv.appendChild(rowNumLeft)

    // Left seats A-B-C
    COLUMNS.slice(0, 3).forEach((col) => {
      const seatId = `${row}${col}`
      const seat = createSeatButton(seatId, col)
      rowDiv.appendChild(seat)
    })

    // Aisle
    const aisle = document.createElement("div")
    aisle.className = "aisle"
    rowDiv.appendChild(aisle)

    // Right seats D-E-F
    COLUMNS.slice(3).forEach((col) => {
      const seatId = `${row}${col}`
      const seat = createSeatButton(seatId, col)
      rowDiv.appendChild(seat)
    })

    // Row number (right)
    const rowNumRight = document.createElement("div")
    rowNumRight.className = "row-number"
    rowNumRight.textContent = row
    rowDiv.appendChild(rowNumRight)

    seatMap.appendChild(rowDiv)
  }

  container.appendChild(seatMap)
  updateSeatCount()
}

// Create a seat button
function createSeatButton(seatId, col) {
  const seat = document.createElement("button")
  seat.className = "seat available"
  seat.setAttribute("data-seat-id", seatId)
  seat.textContent = col

  if (RESERVED_SEATS.includes(seatId)) {
    seat.classList.remove("available")
    seat.classList.add("reserved")
    seat.disabled = true
  } else if (isSelectedSeat(seatId)) {
    seat.classList.remove("available")
    seat.classList.add("selected")
  }

  seat.addEventListener("click", () => selectSeat(seatId, seat))
  return seat
}

// Check if seat is selected
function isSelectedSeat(seatId) {
  const selected = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS) || "[]")
  return selected.includes(seatId)
}

// Select/deselect seat
function selectSeat(seatId, seatElement) {
  const selected = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS) || "[]")

  if (selected.includes(seatId)) {
    // Deselect
    const index = selected.indexOf(seatId)
    selected.splice(index, 1)
    seatElement.classList.remove("selected")
  } else {
    // Select
    selected.push(seatId)
    seatElement.classList.add("selected")
  }

  localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(selected))
  updateSeatCount()
}

// Update seat count display
function updateSeatCount() {
  const selected = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS) || "[]")
  const countEl = document.getElementById("selectedSeatCount")
  if (countEl) {
    countEl.textContent = selected.length
  }
}

// Save reservation
function saveReservation(flightData) {
  const selectedSeats = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEATS) || "[]")

  const booking = {
    id: "SKY" + Date.now(),
    timestamp: new Date().toISOString(),
    flight: flightData,
    seats: selectedSeats,
  }

  localStorage.setItem(STORAGE_KEYS.BOOKING, JSON.stringify(booking))
  return booking
}

// Load reservation
function loadReservation() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKING) || "null")
}

// Delete reservation
function deleteReservation(bookingId) {
  const allBookings = JSON.parse(localStorage.getItem("skyvoyage_all_bookings") || "[]")
  const filtered = allBookings.filter((b) => b.id !== bookingId)
  localStorage.setItem("skyvoyage_all_bookings", JSON.stringify(filtered))
  localStorage.removeItem(STORAGE_KEYS.BOOKING)
  localStorage.removeItem(STORAGE_KEYS.SEATS)
}

// Clear selected seats
function clearSelectedSeats() {
  localStorage.removeItem(STORAGE_KEYS.SEATS)
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", loadSeatMap)
