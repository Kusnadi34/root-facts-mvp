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
        if (factText && factText.innerText && factText.innerText !== 'Fakta menarik akan muncul di sini...') {
          copyToClipboard(factText.innerText);
          alert('Fakta disalin!');
        }
      });
    }

    
    const captureBtn = document.getElementById('btn-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
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
