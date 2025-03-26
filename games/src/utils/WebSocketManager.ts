export default class WebSocketManager {
    private url: string;
    public ws: WebSocket | null = null;
    private onMessage: (event: MessageEvent) => void = () => {};
    private onOpen: () => void = () => {};
    private onError: (error: Event) => void = () => {};
    private onClose: (event: CloseEvent) => void = () => {};
  
    constructor(url: string) {
      this.url = url;
    }
  
    connect() {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => this.onOpen();
      this.ws.onmessage = (event) => this.onMessage(event);
      this.ws.onerror = (error) => this.onError(error);
      this.ws.onclose = (event) => this.onClose(event);
    }
  
    send(data: string) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      } else {
        console.warn('WebSocket is not open.');
      }
    }
  
    close() {
      if (this.ws) {
        this.ws.close();
        this.ws = null; // Clear the WebSocket instance
      }
    }
  
    setOnMessage(callback: (event: MessageEvent) => void) {
      this.onMessage = callback;
    }
  
    setOnOpen(callback: () => void) {
      this.onOpen = callback;
    }
  
    setOnError(callback: (error: Event) => void) {
      this.onError = callback;
    }
  
    setOnClose(callback: (event: CloseEvent) => void) {
      this.onClose = callback;
    }
  }
  