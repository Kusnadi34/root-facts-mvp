class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.currentFps = 30;
    this.fpsInterval = 1000 / 30;
    this.lastFrameTime = 0;
  }
  
  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    console.log('video element', this.video);
  }
  
  
  async loadCameras(cameraSelect) {
    if (!navigator.mediaDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      videoDevices.forEach((device, idx) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Kamera ${idx+1}`;
        cameraSelect.appendChild(option);
      });
    }
    return videoDevices;
  }
  
  async startCamera(videoId, canvasId, cameraSelect) {
    this.initializeElements(videoId, canvasId);
    let constraints = { video: true };
    if (cameraSelect && cameraSelect.value && cameraSelect.value !== 'default') {
      constraints = { video: { deviceId: { exact: cameraSelect.value } } };
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err) {
      console.error('Failed to start camera', err);
      return false;
    }
  }
  
  
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
  }
  
  setFPS(fps) {
    this.currentFps = fps;
    this.fpsInterval = 1000 / fps;
  }
  
  isActive() {
    return this.stream !== null && this.video && !this.video.paused;
  }
}

export default CameraService;