class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.currentFps = 30;
    this.fpsInterval = 1000 / 30;
    this.lastFrameTime = 0;
    this.isCameraReady = false;
  }

  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
    console.log('video element', this.video);
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
          option.text = 'Tidak ada kamera terdeteksi';
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
    this.initializeElements(videoId, canvasId);
    this.isCameraReady = false;

    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      const errorMsg = 'Akses kamera membutuhkan HTTPS. Buka ulang dengan https://';
      console.error(errorMsg);
      this.showCameraError(errorMsg);
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
      console.log('Mencoba mengakses kamera dengan constraints:', constraints);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      this.isCameraReady = true;
      console.log('✅ Kamera berhasil diaktifkan');
      this.hideCameraError();
      return true;
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      let userMessage = 'Tidak dapat mengakses kamera. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        userMessage += 'Izin kamera ditolak. Berikan izin di pengaturan browser.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        userMessage += 'Tidak ada kamera yang terdeteksi di perangkat ini.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        userMessage += 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi kamera lain.';
      } else if (err.name === 'OverconstrainedError') {
        userMessage += 'Resolusi kamera tidak didukung. Mencoba mode default...';
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.stream = fallbackStream;
          this.video.srcObject = this.stream;
          await this.video.play();
          this.isCameraReady = true;
          console.log('✅ Kamera berhasil dengan fallback');
          this.hideCameraError();
          return true;
        } catch (fallbackErr) {
          console.error('Fallback gagal:', fallbackErr);
          userMessage = 'Gagal mengakses kamera bahkan dengan mode default.';
        }
      } else {
        userMessage += `Error: ${err.message || 'Unknown error'}`;
      }
      
      this.showCameraError(userMessage);
      return false;
    }
  }

  showCameraError(message) {
    const errorEl = document.getElementById('camera-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  hideCameraError() {
    const errorEl = document.getElementById('camera-error');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
    this.isCameraReady = false;
  }

  setFPS(fps) {
    this.currentFps = fps;
    this.fpsInterval = 1000 / fps;
  }

  isActive() {
    return this.isCameraReady && this.stream !== null && this.video && !this.video.paused;
  }
}

export default CameraService;
