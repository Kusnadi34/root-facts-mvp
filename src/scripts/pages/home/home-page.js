import {
  generateCameraSection,
  generateInfoPanel,
  generateFooter,
} from "../../templates.js";
import CameraService from "../../services/camera.service.js";
import DetectionService from "../../services/detection.service.js";
import RootFactsService from "../../services/rootfacts.service.js";
import { copyToClipboard, showElement, hideElement, setElementText } from "../../utils/index.js";

export default class HomePage {
  constructor() {
    this.cameraService = new CameraService();
    this.detectionService = new DetectionService();
    this.factsService = new RootFactsService();
    this.isPredicting = false;
    this.currentFps = 30;
    this.lastPredictTime = 0;
    this.lastDetectedLabel = '';
  }
  
  async render() {
    return `
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
  }
  
  async afterRender() {
    await this.cameraService.startCamera('media-video', 'media-canvas', document.getElementById('camera-select'));
    const statusEl = document.getElementById('status-text');
    statusEl.innerText = 'Loading model...';
    await this.detectionService.loadModel('/model/model.json', '/model/metadata.json');
    
    statusEl.innerText = 'Loading AI facts...';
    await this.factsService.loadModel();
    statusEl.innerText = 'Ready';
    const fpsSlider = document.getElementById('fps-slider');
    const fpsLabel = document.getElementById('fps-label');
    fpsSlider.addEventListener('input', (e) => {
      this.currentFps = parseInt(e.target.value);
      fpsLabel.innerText = this.currentFps + ' FPS';
      this.cameraService.setFPS(this.currentFps);
    });
    
    const toneSelect = document.getElementById('tone-select');
    toneSelect.addEventListener('change', (e) => {
      this.factsService.setTone(e.target.value);
    })
    
    const copyBtn = document.getElementById('btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const factText = document.getElementById('fun-fact-text').innerText;
        copyToClipboard(factText);
        alert('Facts copied!');
      });
    }
    requestAnimationFrame(this.predictLoop.bind(this));
  }
  
  async predictLoop(now) {
    requestAnimationFrame(this.predictLoop.bind(this));
    if (!this.cameraService.isActive()) return;
    if (now - this.lastPredictTime < 1000 / this.currentFps) return;
    this.lastPredictTime = now;
    
    const video = document.getElementById('media-video');
    if (!video || video.readyState < 2) return;
    
    const resultDiv = document.getElementById('state-result');
    const idleDiv = document.getElementById('state-idle');
    const loadingDiv = document.getElementById('state-loading');
    
    hideElement(idleDiv);
    showElement(loadingDiv);
    
    try {
      const detection = await this.detectionService.predict(video);
      if (detection.isValid) {
        // update UI hasil
        setElementText(document.getElementById('detected-name'), detection.label);
        setElementText(document.getElementById('detected-confidence'), detection.confidence + '%');
        document.getElementById('confidence-fill').style.width = detection.confidence + '%';
        
        
        if (this.lastDetectedLabel !== detection.label) {
          this.lastDetectedLabel = detection.label;
          const factLoading = document.getElementById('fun-fact-loading');
          showElement(factLoading);
          const factText = await this.factsService.generateFacts(detection.label);
          setElementText(document.getElementById('fun-fact-text'), factText);
          hideElement(factLoading);
        }
        
        hideElement(loadingDiv);
        showElement(resultDiv);
      } else {
        hideElement(resultDiv);
        showElement(idleDiv);
        hideElement(loadingDiv);
      }
    } catch (err) {
      console.error('prediction errors', err);
      hideElement(loadingDiv);
      showElement(idleDiv);
    }
  }
}