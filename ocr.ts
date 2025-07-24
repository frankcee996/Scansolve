import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

export class OCRProcessor {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker('eng');
    
    // Optimize for text recognition
    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=()[]{}.,?!:; ',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });
  }

  async processImage(imageData: string, onProgress?: (progress: OCRProgress) => void): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Failed to initialize OCR worker');
    }

    try {
      const { data } = await this.worker.recognize(imageData);

      if (onProgress) {
        onProgress({
          status: 'Processing complete',
          progress: 1
        });
      }

      return {
        text: data.text.trim(),
        confidence: data.confidence
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrProcessor = new OCRProcessor();