import { pipeline, env } from '@xenova/transformers';

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.currentTone = 'normal';
  }

  async loadModel() {
    
    if (navigator.gpu) {
      env.backends = 'webgpu';
      console.log('Transformers pakai WebGPU');
    }

    this.generator = await pipeline('text-generation', 'Xenova/distilgpt2');
    this.isModelLoaded = true;
    return true;
  }

  setTone(tone) {
    this.currentTone = tone;
  }

  async generateFacts(vegetable, tone = null) {
    if (!this.generator) throw new Error('AI model belum siap');

    const activeTone = tone || this.currentTone;

    
    let prompt = '';
    const veg = vegetable.toLowerCase().trim();

    switch (activeTone) {
      case 'funny':
        prompt = `Tell a short and funny fact about ${veg} in 15 words:`;
        break;
      case 'professional':
        prompt = `Give a scientific fact about ${veg} in one sentence:`;
        break;
      case 'casual':
        prompt = `Share a casual fun fact about ${veg} casually:`;
        break;
      default:
        prompt = `Provide an interesting fact about ${veg} in one sentence:`;
    }

    const output = await this.generator(prompt, {
      max_new_tokens: 40,
      temperature: 0.8,
      top_p: 0.9,
      do_sample: true,
    });

    let fact = output[0].generated_text;
    
    fact = fact.replace(prompt, '').trim();

    
    if (!fact) {
      fact = `${vegetable} is a nutritious vegetable.`;
    }

    return fact;
  }

  isReady() {
    return this.isModelLoaded && this.generator !== null;
  }
}

export default RootFactsService;


/**
import { pipeline, env } from '@xenova/transformers';

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.currentTone = 'normal';
  }

  async loadModel() {
    
    if (navigator.gpu) {
      env.backends = 'webgpu';
      console.log('transformers using webgpu');
    }

    
    this.generator = await pipeline('text-generation', 'Xenova/distilgpt2');
    this.isModelLoaded = true;
    return true;
  }

  setTone(tone) {
    this.currentTone = tone;
  }

  async generateFacts(vegetable, tone = null) {
    if (!this.generator) throw new Error('AI model is not ready');

    const activeTone = tone || this.currentTone;
    let prompt = '';

    switch (activeTone) {
      case 'funny':
        prompt = `Buat fakta singkat dan lucu tentang ${vegetable} dalam 20 kata:`;
        break;
      case 'professional':
        prompt = `Tulis fakta ilmiah tentang ${vegetable} secara singkat:`;
        break;
      case 'casual':
        prompt = `Ceritakan fakta santai tentang ${vegetable} seperti ngobrol:`;
        break;
      default:
        prompt = `Berikan fakta menarik tentang ${vegetable} dalam satu kalimat:`;
    }

    
    const safeVegetable = vegetable.replace(/[^a-zA-Z\s]/g, '');
    const finalPrompt = prompt.replace('{vegetable}', safeVegetable);

    const output = await this.generator(finalPrompt, {
      max_new_tokens: 40,
      temperature: 0.8,
      top_p: 0.9,
      do_sample: true,
    });

    let fact = output[0].generated_text;
    fact = fact.replace(finalPrompt, '').trim();

    
    if (!fact) {
      fact = `${vegetable} adalah sayuran yang kaya akan serat dan vitamin.`;
    }

    return fact;
  }

  isReady() {
    return this.isModelLoaded && this.generator !== null;
  }
}

export default RootFactsService;
**/
