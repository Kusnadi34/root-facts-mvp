import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
  }
  
  async loadModel(modelPath = '/model/model.json', metadataPath = '/model/metadata.json') {
    let backend = 'webgl';
    if (navigator.gpu) {
      try {
        await tf.setBackend('webgpu');
        backend = 'webgpu';
        console.log('✅ webGPU is active');
      } catch(e) {
        console.warn('webGPU failed, fallback to webGL', e);
        await tf.setBackend('webgl');
      }
    } else {
      await tf.setBackend('webgl');
    }
    await tf.ready();
    this.model = await tf.loadGraphModel(modelPath, {
      onProgress: (fraction) => {
        let percent = Math.round(fraction * 100);
        let progressEl = document.getElementById('model-progress');
        if (progressEl) progressEl.style.width = percent + '%';
        console.log('loading model', percent + '%');
      }
    });
    
    const resp = await fetch(metadataPath);
    const meta = await resp.json();
    this.labels = meta.labels;
    return true;
  }
  
  async predict(imageElement) {
    if (!this.model) throw 'Model not loaded yet';
    const result = tf.tidy(() => {
      let tensor = tf.browser.fromPixels(imageElement);
      let resized = tf.image.resizeBilinear(tensor, [224, 224]);
      let normalized = resized.div(255.0);
      let batched = normalized.expandDims(0);
      let predictions = this.model.predict(batched);
      return predictions.arraySync();
    });
    
    const probs = result[0];
    const maxIndex = probs.indexOf(Math.max(...probs));
    const confidence = Math.round(probs[maxIndex] * 100);
    return {
      label: this.labels[maxIndex],
      confidence: confidence,
      isValid: confidence >= 70
    };
  }
}

export default DetectionService;