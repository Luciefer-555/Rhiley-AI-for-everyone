class ChatService {
  static cache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async sendMessage(message) {
    const startTime = performance.now();
    
    // Check cache first
    const cacheKey = message.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Cache hit for:', message);
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('http://localhost:3002/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: message,
          model: "deepseek-coder:6.7b"
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform backend response to match expected format
      const transformedData = {
        success: true,
        reply: data.response || data.reply || data.text || "I received your message but couldn't generate a response."
      };
      
      // Cache response
      this.cache.set(cacheKey, {
        data: transformedData,
        timestamp: Date.now()
      });

      // Clean old cache entries
      if (this.cache.size > 100) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      const endTime = performance.now();
      console.log(`API call took ${endTime - startTime}ms`);
      
      return transformedData;
    } catch (error) {
      const endTime = performance.now();
      console.error(`ChatService error after ${endTime - startTime}ms:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  }

  static clearCache() {
    this.cache.clear();
  }
}

export default ChatService;
