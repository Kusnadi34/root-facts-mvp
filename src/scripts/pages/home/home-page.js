import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
} from '../../templates.js';
import CameraService from '../../services/camera.service.js';
import DetectionService from '../../services/detection.service.js';
import RootFactsService from '../../services/rootfacts.service.js';
import {
  copyToClipboard,
  showElement,
  hideElement,
  setElementText
} from '../../utils/index.js';

export default class HomePage {
  constructor() {
    this.cameraService = new CameraService();
    this.detectionService = new DetectionService();
    this.factsService = new RootFactsService();
    this.isScanning = false;
    this.currentFps = 30;
    this.lastDetectedLabel = '';
    this.loopId = null;
    this.isFirstLoad = true;
  }

  async render() {
    return `
      ${generateCameraSection()}
      ${generateInfoPanel()}
      ${generateFooter()}
    `;
  }

  async afterRender() {
    const statusEl = document.getElementById('status-text');
    const dotEl = document.getElementById('status-dot');

    
    if (!navigator.onLine && this.isFirstLoad) {
      if (statusEl) statusEl.innerText = '⚠️ Offline - tidak bisa scan';
      if (dotEl) dotEl.className = 'status-dot';
      
      this.cameraService.stopCamera();
      this.isFirstLoad = false;
      return;
    }
    this.isFirstLoad = false;

    
    try {
      if (statusEl) statusEl.innerText = '⏳ Muat model...';
      if (dotEl) dotEl.className = 'status-dot active';

      await this.detectionService.loadModel('model/model.json', 'model/metadata.json');

      if (statusEl) statusEl.innerText = '⏳ Muat AI...';
      await this.factsService.loadModel();

      if (statusEl) statusEl.innerText = '✅ Siap!';
    } catch (err) {
      console.error('Gagal load:', err);
      if (statusEl) statusEl.innerText = '❌ Gagal load';
      return;
    }

    
    const fpsSlider = document.getElementById('fps-slider');
    const fpsLabel = document.getElementById('fps-label');
    if (fpsSlider && fpsLabel) {
      fpsSlider.addEventListener('input', (e) => {
        this.currentFps = parseInt(e.target.value);
        fpsLabel.innerText = this.currentFps + ' FPS';
        this.cameraService.setFPS(this.currentFps);
      });
    }

    
    const toneSelect = document.getElementById('tone-select');
    if (toneSelect) {
      toneSelect.addEventListener('change', (e) => {
        this.factsService.setTone(e.target.value);
      });
    }

    
    const copyBtn = document.getElementById('btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const factText = document.getElementById('fun-fact-text');
        if (factText && factText.innerText && factText.innerText !== '-') {
          copyToClipboard(factText.innerText);
          alert('Fakta disalin!');
        }
      });
    }

    
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        this.handleScanButton();
      });
    }

    
    await this.startCameraAndScan();
  }

  async startCameraAndScan() {
    
    const started = await this.cameraService.startCamera(
      'media-video',
      'media-canvas',
      document.getElementById('camera-select')
    );
    if (!started) {
      const statusEl = document.getElementById('status-text');
      if (statusEl) statusEl.innerText = '❌ Kamera error';
      return;
    }

    this.isScanning = true;
    
    if (this.loopId) cancelAnimationFrame(this.loopId);
    this.loopId = requestAnimationFrame(this.predictLoop.bind(this));
  }

  async predictLoop(now) {
    if (!this.isScanning) return;
    this.loopId = requestAnimationFrame(this.predictLoop.bind(this));

    if (!this.cameraService.isActive()) return;

    
    if (!this._lastPredictTime) this._lastPredictTime = now;
    if (now - this._lastPredictTime < 1000 / this.currentFps) return;
    this._lastPredictTime = now;

    const video = document.getElementById('media-video');
    if (!video || video.readyState < 2) return;

    const resultDiv = document.getElementById('state-result');
    const idleDiv = document.getElementById('state-idle');
    const loadingDiv = document.getElementById('state-loading');

    if (idleDiv) hideElement(idleDiv);
    if (loadingDiv) showElement(loadingDiv);

    try {
      const detection = await this.detectionService.predict(video);

      if (detection && detection.isValid) {
        const nameEl = document.getElementById('detected-name');
        const confEl = document.getElementById('detected-confidence');
        const fillEl = document.getElementById('confidence-fill');

        if (nameEl) setElementText(nameEl, detection.label);
        if (confEl) setElementText(confEl, detection.confidence + '%');
        if (fillEl) fillEl.style.width = detection.confidence + '%';

        
        if (this.lastDetectedLabel !== detection.label) {
          this.lastDetectedLabel = detection.label;
          const factLoading = document.getElementById('fun-fact-loading');
          const factTextEl = document.getElementById('fun-fact-text');

          if (factLoading) showElement(factLoading);

          try {
            
            const fact = await this.factsService.generateFacts(detection.label);
            if (factTextEl) setElementText(factTextEl, fact);
          } catch (err) {
            console.error('Gagal generate fakta:', err);
            if (factTextEl) setElementText(factTextEl, 'Gagal generate, coba lagi');
          }

          if (factLoading) hideElement(factLoading);

          
          this.stopCameraAndClearMemory();
        }

        if (loadingDiv) hideElement(loadingDiv);
        if (resultDiv) showElement(resultDiv);
      } else {
        
        if (resultDiv) hideElement(resultDiv);
        if (idleDiv) showElement(idleDiv);
        if (loadingDiv) hideElement(loadingDiv);
      }
    } catch (err) {
      console.error('Error prediksi:', err);
      if (loadingDiv) hideElement(loadingDiv);
      if (idleDiv) showElement(idleDiv);
    }
  }

  stopCameraAndClearMemory() {
    
    this.isScanning = false;
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }

    
    this.cameraService.stopCamera();

    
    if (window.tf) {
      
    }

    
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.innerText = '⏸️ Scan selesai';

    const dotEl = document.getElementById('status-dot');
    if (dotEl) dotEl.className = 'status-dot';

    
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.classList.remove('scanning');
      captureBtn.innerHTML = '<i data-lucide="scan"></i>';
    }
  }

  async handleScanButton() {
    
    if (this.isScanning) return;

    
    this.lastDetectedLabel = '';

    
    if (window.tf) {
      
      window.tf.tidy(() => {});
    }

    
    const resultDiv = document.getElementById('state-result');
    const idleDiv = document.getElementById('state-idle');
    const loadingDiv = document.getElementById('state-loading');
    if (resultDiv) hideElement(resultDiv);
    if (idleDiv) showElement(idleDiv);
    if (loadingDiv) hideElement(loadingDiv);

    
    const factTextEl = document.getElementById('fun-fact-text');
    if (factTextEl) setElementText(factTextEl, 'Memindai...');

    
    await this.startCameraAndScan();

    
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.classList.add('scanning');
      captureBtn.innerHTML = '<i data-lucide="camera-off"></i>';
    }
  }

  
  destroy() {
    this.stopCameraAndClearMemory();
    this.cameraService.stopCamera();
  }
}


/**
import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
} from '../../templates.js';
import CameraService from '../../services/camera.service.js';
import DetectionService from '../../services/detection.service.js';
import RootFactsService from '../../services/rootfacts.service.js';
import {
  copyToClipboard,
  showElement,
  hideElement,
  setElementText
} from '../../utils/index.js';

export default class HomePage {
  constructor() {
    this.cameraService = new CameraService();
    this.detectionService = new DetectionService();
    this.factsService = new RootFactsService();
    this.isPredicting = false;
    this.currentFps = 30;
    this.lastPredictTime = 0;
    this.lastDetectedLabel = '';
    this.loopId = null;
  }

  async render() {
    return `
      ${generateCameraSection()}
      ${generateInfoPanel()}
      ${generateFooter()}
    `;
  }

  async afterRender() {
    // 1. Start camera
    const cameraStarted = await this.cameraService.startCamera(
      'media-video',
      'media-canvas',
      document.getElementById('camera-select')
    );

    if (!cameraStarted) {
      const statusEl = document.getElementById('status-text');
      if (statusEl) statusEl.innerText = '❌ Kamera tidak tersedia';
      return;
    }

    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.innerText = 'Loading model...';

    
    try {
      await this.detectionService.loadModel('model/model.json', 'model/metadata.json');
    } catch (err) {
      console.error('Gagal load model deteksi:', err);
      if (statusEl) statusEl.innerText = '❌ Gagal load model';
      return;
    }

    if (statusEl) statusEl.innerText = 'Loading AI facts...';

    
    try {
      await this.factsService.loadModel();
    } catch (err) {
      console.error('Gagal load AI facts:', err);
      if (statusEl) statusEl.innerText = '❌ Gagal load AI';
      return;
    }

    if (statusEl) statusEl.innerText = '✅ Siap!';

    
    const fpsSlider = document.getElementById('fps-slider');
    const fpsLabel = document.getElementById('fps-label');
    if (fpsSlider && fpsLabel) {
      fpsSlider.addEventListener('input', (e) => {
        this.currentFps = parseInt(e.target.value);
        fpsLabel.innerText = this.currentFps + ' FPS';
        this.cameraService.setFPS(this.currentFps);
      });
    }

    
    const toneSelect = document.getElementById('tone-select');
    if (toneSelect) {
      toneSelect.addEventListener('change', (e) => {
        this.factsService.setTone(e.target.value);
      });
    }

    
    const copyBtn = document.getElementById('btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const factText = document.getElementById('fun-fact-text');
        if (factText && factText.innerText && factText.innerText !== '-') {
          copyToClipboard(factText.innerText);
          alert('Fakta disalin!');
        }
      });
    }

    
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        // Trigger one prediction manually
        this.forcePredict();
      });
    }

    
    this.loopId = requestAnimationFrame(this.predictLoop.bind(this));
  }

  async predictLoop(now) {
    this.loopId = requestAnimationFrame(this.predictLoop.bind(this));

    if (!this.cameraService.isActive()) return;

    if (now - this.lastPredictTime < 1000 / this.currentFps) return;
    this.lastPredictTime = now;

    const video = document.getElementById('media-video');
    if (!video || video.readyState < 2) return;

    const resultDiv = document.getElementById('state-result');
    const idleDiv = document.getElementById('state-idle');
    const loadingDiv = document.getElementById('state-loading');

    if (idleDiv) hideElement(idleDiv);
    if (loadingDiv) showElement(loadingDiv);

    try {
      const detection = await this.detectionService.predict(video);

      if (detection && detection.isValid) {
        const nameEl = document.getElementById('detected-name');
        const confEl = document.getElementById('detected-confidence');
        const fillEl = document.getElementById('confidence-fill');

        if (nameEl) setElementText(nameEl, detection.label);
        if (confEl) setElementText(confEl, detection.confidence + '%');
        if (fillEl) fillEl.style.width = detection.confidence + '%';

        
        if (this.lastDetectedLabel !== detection.label) {
          this.lastDetectedLabel = detection.label;
          const factLoading = document.getElementById('fun-fact-loading');
          const factTextEl = document.getElementById('fun-fact-text');

          if (factLoading) showElement(factLoading);

          try {
            const fact = await this.factsService.generateFacts(detection.label);
            if (factTextEl) setElementText(factTextEl, fact);
          } catch (err) {
            console.error('Gagal generate fakta:', err);
            if (factTextEl) setElementText(factTextEl, 'Gagal generate fakta, coba lagi');
          }

          if (factLoading) hideElement(factLoading);
        }

        if (loadingDiv) hideElement(loadingDiv);
        if (resultDiv) showElement(resultDiv);
      } else {
        if (resultDiv) hideElement(resultDiv);
        if (idleDiv) showElement(idleDiv);
        if (loadingDiv) hideElement(loadingDiv);
      }
    } catch (err) {
      console.error('Error pas prediksi:', err);
      if (loadingDiv) hideElement(loadingDiv);
      if (idleDiv) showElement(idleDiv);
    }
  }

  
  async forcePredict() {
    const video = document.getElementById('media-video');
    if (!video || video.readyState < 2) return;

    const resultDiv = document.getElementById('state-result');
    const idleDiv = document.getElementById('state-idle');
    const loadingDiv = document.getElementById('state-loading');

    if (idleDiv) hideElement(idleDiv);
    if (loadingDiv) showElement(loadingDiv);

    try {
      const detection = await this.detectionService.predict(video);
      if (detection && detection.isValid) {
        const nameEl = document.getElementById('detected-name');
        const confEl = document.getElementById('detected-confidence');
        const fillEl = document.getElementById('confidence-fill');

        if (nameEl) setElementText(nameEl, detection.label);
        if (confEl) setElementText(confEl, detection.confidence + '%');
        if (fillEl) fillEl.style.width = detection.confidence + '%';

        this.lastDetectedLabel = detection.label;
        const factLoading = document.getElementById('fun-fact-loading');
        const factTextEl = document.getElementById('fun-fact-text');

        if (factLoading) showElement(factLoading);

        try {
          const fact = await this.factsService.generateFacts(detection.label);
          if (factTextEl) setElementText(factTextEl, fact);
        } catch (err) {
          console.error('Gagal generate fakta:', err);
          if (factTextEl) setElementText(factTextEl, 'Gagal generate fakta, coba lagi');
        }

        if (factLoading) hideElement(factLoading);
        if (loadingDiv) hideElement(loadingDiv);
        if (resultDiv) showElement(resultDiv);
      } else {
        if (resultDiv) hideElement(resultDiv);
        if (idleDiv) showElement(idleDiv);
        if (loadingDiv) hideElement(loadingDiv);
      }
    } catch (err) {
      console.error('Error force predict:', err);
      if (loadingDiv) hideElement(loadingDiv);
      if (idleDiv) showElement(idleDiv);
    }
  }

  stopPrediction() {
    if (this.loopId) {
      cancelAnimationFrame(this.loopId);
      this.loopId = null;
    }
    this.cameraService.stopCamera();
  }
}
**/
