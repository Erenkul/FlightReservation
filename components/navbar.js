// SkyVoyage Elite - Navbar Web Component

class CustomNavbar extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  connectedCallback() {
    this.render()
    this.setupMobileMenu()
  }

  render() {
    const isHomepage = window.location.pathname === "/" || window.location.pathname.endsWith("index.html")
    const navStyle = isHomepage ? "transparent" : "solid"

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #0F172A;
          --secondary: #06B6D4;
          --text-light: #ffffff;
        }

        nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, ${navStyle === "transparent" ? "0.1" : "0.2"});
          background: ${navStyle === "transparent" ? "rgba(15, 23, 42, 0.3)" : "var(--primary)"};
          padding: 1rem 0;
          transition: all 0.3s ease;
        }

        .nav-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--text-light);
          font-size: 1.5rem;
          font-weight: 700;
          transition: opacity 0.3s ease;
        }

        .nav-brand:hover {
          opacity: 0.8;
        }

        .nav-brand svg {
          width: 32px;
          height: 32px;
          color: var(--secondary);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links a {
          color: var(--text-light);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 0.3s ease;
          position: relative;
        }

        .nav-links a:hover {
          color: var(--secondary);
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--secondary);
          transition: width 0.3s ease;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .nav-btn-login {
          background: transparent;
          color: var(--text-light);
          border: 2px solid var(--secondary);
        }

        .nav-btn-login:hover {
          background: var(--secondary);
          color: var(--primary);
        }

        .nav-btn-signup {
          background: var(--secondary);
          color: var(--primary);
        }

        .nav-btn-signup:hover {
          background: #0891b2;
          color: var(--text-light);
        }

        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
        }

        .hamburger span {
          width: 25px;
          height: 3px;
          background: var(--text-light);
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
          .nav-links {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            gap: 0;
            background: var(--primary);
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .nav-links.active {
            display: flex;
          }

          .nav-links li {
            padding: 0.75rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          .nav-links a::after {
            display: none;
          }

          .hamburger {
            display: flex;
          }

          .nav-actions {
            display: none;
          }
        }
      </style>

      <nav>
        <div class="nav-container">
          <a href="index.html" class="nav-brand">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"/>
            </svg>
            SkyVoyage Elite
          </a>

          <ul class="nav-links" id="navLinks">
            <li><a href="index.html">Home</a></li>
            <li><a href="search_result.html">Flights</a></li>
            <li><a href="mytrips.html">My Trips</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div class="nav-actions">
            <button class="nav-btn nav-btn-login" onclick="window.location.href='login.html'">Log In</button>
            <button class="nav-btn nav-btn-signup" onclick="window.location.href='register.html'">Sign Up</button>
          </div>

          <button class="hamburger" id="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
    `
  }

  setupMobileMenu() {
    const hamburger = this.shadowRoot.querySelector("#hamburger")
    const navLinks = this.shadowRoot.querySelector(".nav-links")

    hamburger?.addEventListener("click", () => {
      navLinks?.classList.toggle("active")
    })
  }
}

customElements.define("custom-navbar", CustomNavbar)
