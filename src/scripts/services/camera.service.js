class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.currentFps = 30;
    this.fpsInterval = 1000 / 30;
    this.lastFrameTime = 0;
    this.isCameraReady = false;
    this.errorEl = null;
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    this.errorEl = document.getElementById('status-text');
  }

  showCameraError(message) {
    if (this.errorEl) {
      this.errorEl.innerText = '❌ ' + message;
    }
    const dot = document.getElementById('status-dot');
    if (dot) dot.className = 'status-dot';
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');
  }

  hideCameraError() {
    if (this.errorEl) {
      this.errorEl.innerText = '✅ Siap!';
    }
    const dot = document.getElementById('status-dot');
    if (dot) dot.className = 'status-dot active';
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.classList.add('hidden');
  }

  async loadCameras(cameraSelect) {
    if (!navigator.mediaDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      if (cameraSelect) {
        cameraSelect.innerHTML = '';
        if (videoDevices.length === 0) {
          const option = document.createElement('option');
          option.value = '';
          option.text = 'Tidak ada kamera';
          cameraSelect.appendChild(option);
        } else {
          videoDevices.forEach((device, idx) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Kamera ${idx + 1}`;
            cameraSelect.appendChild(option);
          });
        }
      }
      return videoDevices;
    } catch (err) {
      console.error('Gagal enumerasi perangkat:', err);
      return [];
    }
  }

  async startCamera(videoId, canvasId, cameraSelect) {
    // Inisialisasi elemen tiap kali start (agar fresh)
    this.initializeElements(videoId, canvasId);
    this.isCameraReady = false;

    // Jika sebelumnya sudah ada stream, matikan dulu
    this.stopCamera();

    // Pastikan video element terlihat
    if (this.video) {
      this.video.style.display = 'block';
    }

    // Cek HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      this.showCameraError('HTTPS diperlukan');
      return false;
    }

    let constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };

    if (cameraSelect && cameraSelect.value && cameraSelect.value !== '') {
      constraints = {
        video: {
          deviceId: { exact: cameraSelect.value },
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      this.isCameraReady = true;
      this.hideCameraError();
      return true;
    } catch (err) {
      console.error('Gagal akses kamera:', err);
      let userMessage = 'Gagal akses kamera. ';
      if (err.name === 'NotAllowedError') {
        userMessage += 'Izin ditolak.';
      } else if (err.name === 'NotFoundError') {
        userMessage += 'Tidak ada kamera.';
      } else if (err.name === 'NotReadableError') {
        userMessage += 'Kamera sedang dipakai.';
      } else {
        userMessage += err.message;
      }
      this.showCameraError(userMessage);
      return false;
    }
  }

  stopCamera() {
    // Matikan semua track
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      // Sembunyikan video agar tidak menampilkan frame terakhir
      this.video.style.display = 'none';
    }
    this.isCameraReady = false;
    const dot = document.getElementById('status-dot');
    if (dot) dot.className = 'status-dot';
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');
    console.log('Kamera dimatikan');
  }

  isActive() {
    return this.isCameraReady && this.stream !== null && this.stream.active;
  }

  setFPS(fps) {
    this.currentFps = fps;
    this.fpsInterval = 1000 / fps;
  }
}

export default CameraService;
