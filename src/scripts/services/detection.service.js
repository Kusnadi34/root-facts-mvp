import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
  }

  async loadModel(modelPath = 'model/model.json', metadataPath = 'model/metadata.json') {
    
    const progressContainer = document.getElementById('model-progress-container');
    const progressBar = document.getElementById('model-progress');
    const progressText = document.getElementById('model-progress-text');
    if (progressContainer) progressContainer.style.display = 'block';

    
    let backend = 'webgl';
    if (navigator.gpu) {
      try {
        await tf.setBackend('webgpu');
        backend = 'webgpu';
        console.log('✅ WebGPU aktif');
      } catch (err) {
        console.warn('WebGPU gagal, pake WebGL', err);
        await tf.setBackend('webgl');
      }
    } else {
      await tf.setBackend('webgl');
    }
    await tf.ready();

    
    this.model = await tf.loadLayersModel(modelPath, {
      onProgress: (fraction) => {
        const percent = Math.round(fraction * 100);
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressText) progressText.innerText = `Memuat model ${percent}%`;
        console.log(`Loading model ${percent}%`);
      }
    });

    
    const resp = await fetch(metadataPath);
    const meta = await resp.json();
    this.labels = meta.labels || [];

    
    if (progressContainer) {
      setTimeout(() => {
        progressContainer.style.display = 'none';
      }, 500);
    }
    return true;
  }

  async predict(imageElement) {
    if (!this.model) throw new Error('Model belum dimuat');

    
    return tf.tidy(() => {
      const tensor = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);
      const predictions = this.model.predict(batched);
      const probs = predictions.arraySync()[0];
      const maxIndex = probs.indexOf(Math.max(...probs));
      const confidence = Math.round(probs[maxIndex] * 100);
      return {
        label: this.labels[maxIndex] || 'Gak dikenal',
        confidence: confidence,
        isValid: confidence >= 70
      };
    });
  }
}

export default DetectionService;
