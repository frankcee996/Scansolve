export interface CameraConstraints {
  video: {
    facingMode: 'user' | 'environment';
    width?: { ideal: number };
    height?: { ideal: number };
  };
}

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private facingMode: 'user' | 'environment' = 'environment';

  async initCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    const constraints: CameraConstraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;
      
      return new Promise((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(reject);
        };
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }

  async switchCamera(): Promise<void> {
    if (!this.videoElement) return;
    
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.stopCamera();
    await this.initCamera(this.videoElement);
  }

  captureImage(): string | null {
    if (!this.videoElement) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;

    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    context.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  async toggleFlash(): Promise<void> {
    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0];
    if (videoTrack && 'getCapabilities' in videoTrack) {
      const capabilities = videoTrack.getCapabilities() as any;
      if (capabilities.torch) {
        const currentSettings = videoTrack.getSettings() as any;
        await videoTrack.applyConstraints({
          advanced: [{ torch: !currentSettings.torch }]
        });
      }
    }
  }

  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}