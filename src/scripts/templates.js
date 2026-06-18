export function generateCameraSection() {
  return `
    <section class="camera-section">
      <div class="camera-container">
        <div class="camera-wrapper">
          <video id="media-video" autoplay playsinline muted></video>
          <canvas id="media-canvas" style="display: none;"></canvas>
          <div class="camera-placeholder" id="camera-placeholder">
            <i data-lucide="camera" size="48"></i>
            <p>Kamera tidak aktif</p>
          </div>
          <div class="camera-overlay" id="camera-overlay">
            <div class="overlay-frame"></div>
          </div>
        </div>

        <div class="camera-controls">
          <button class="capture-btn" id="btn-capture" aria-label="Scan">
            <i data-lucide="scan"></i>
          </button>
        </div>

        <div class="settings-bar">
          <div class="setting-item">
            <i data-lucide="camera" size="16"></i>
            <select id="camera-select">
              <option value="">Memuat kamera...</option>
            </select>
          </div>
          <div class="setting-item">
            <div class="fps-setting">
              <i data-lucide="gauge" size="16"></i>
              <input type="range" id="fps-slider" min="5" max="60" value="30" step="1" />
              <span id="fps-label">30 FPS</span>
            </div>
          </div>
          <div class="setting-item">
            <div class="tone-setting">
              <i data-lucide="sparkles" size="16"></i>
              <select id="tone-select">
                <option value="normal">Normal</option>
                <option value="funny">Lucu</option>
                <option value="professional">Profesional</option>
                <option value="casual">Santai</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function generateInfoPanel() {
  return `
    <section class="results-section">
      <div class="result-card">
        <div id="state-idle">
          <div class="idle-card">
            <div class="idle-icon">
              <i data-lucide="scan" size="32"></i>
            </div>
            <h2>Scan Sayuran</h2>
            <p>Ketuk tombol di bawah untuk memulai dan temukan fakta menarik tentang sayuran!</p>
          </div>
        </div>

        <div id="state-loading" class="hidden">
          <div class="loading-card">
            <div class="loading-animation">
              <div class="loading-ring"></div>
              <div class="loading-icon">
                <i data-lucide="loader" size="20"></i>
              </div>
            </div>
            <h2>Mencari...</h2>
            <p>Sedang mengidentifikasi sayuran Anda</p>
          </div>
        </div>

        <div id="state-result" class="hidden">
          <div class="result-main">
            <div class="detected-badge">
              <i data-lucide="check-circle" size="16"></i>
              <span id="detected-name">-</span>
            </div>

            <div class="fun-fact-card">
              <div class="fun-fact-icon">
                <i data-lucide="lightbulb" size="24"></i>
              </div>
              <div class="fun-fact-text" id="fun-fact-text">Fakta menarik akan muncul di sini...</div>
              <button class="copy-btn" id="btn-copy" aria-label="Salin fakta">
                <i data-lucide="copy" size="16"></i>
              </button>
              <div class="fun-fact-loading hidden" id="fun-fact-loading">
                <div class="fun-fact-loading-spinner"></div>
                <span>Memuat fakta menarik...</span>
              </div>
            </div>

            <div class="confidence-bar">
              <span class="confidence-label">Kepercayaan</span>
              <div class="confidence-track">
                <div class="confidence-fill" id="confidence-fill" style="width: 0%;"></div>
              </div>
              <span class="confidence-value" id="detected-confidence">0%</span>
            </div>

            <div class="share-hint">
              <i data-lucide="share-2" size="14"></i>
              <span>Salin dan bagikan ke teman!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function generateFooter() {
  return `
    <footer class="footer">
      <p>Powered by TensorFlow.js &amp; Transformers.js</p>
    </footer>
  `;
}
