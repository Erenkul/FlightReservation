// SkyVoyage Elite - Footer Web Component

class CustomFooter extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  connectedCallback() {
    this.render()
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary: #0F172A;
          --secondary: #06B6D4;
          --text-light: #ffffff;
          --text-muted: #94a3b8;
        }

        footer {
          background: var(--primary);
          color: var(--text-light);
          padding: 3rem 0 1rem;
          margin-top: 4rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--secondary);
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section li {
          margin-bottom: 0.75rem;
        }

        .footer-section a {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-section a:hover {
          color: var(--secondary);
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .footer-brand svg {
          width: 24px;
          height: 24px;
          color: var(--secondary);
        }

        .footer-brand-name {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-bottom p {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin: 0;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-links a {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 182, 212, 0.1);
          border-radius: 50%;
          color: var(--secondary);
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 1rem;
        }

        .social-links a:hover {
          background: var(--secondary);
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }

          .social-links {
            justify-content: center;
          }
        }
      </style>

      <footer>
        <div class="footer-container">
          <div class="footer-grid">
            <div class="footer-section">
              <div class="footer-brand">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"/>
                </svg>
                <div class="footer-brand-name">SkyVoyage Elite</div>
              </div>
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">Experience premium travel with world-class service and unbeatable prices.</p>
            </div>

            <div class="footer-section">
              <h3>Company</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h3>Support</h3>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQs</a></li>
                <li><a href="#">Status</a></li>
              </ul>
            </div>

            <div class="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
                <li><a href="#">Accessibility</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <p>&copy; 2025 SkyVoyage Elite. All rights reserved.</p>
            <div class="social-links">
              <!-- Removed emoji, using text symbols with proper styling -->
              <a href="#" title="Facebook" aria-label="Facebook">f</a>
              <a href="#" title="Twitter" aria-label="Twitter">X</a>
              <a href="#" title="Instagram" aria-label="Instagram">@</a>
              <a href="#" title="LinkedIn" aria-label="LinkedIn">in</a>
            </div>
          </div>
        </div>
      </footer>
    `
  }
}

customElements.define("custom-footer", CustomFooter)
