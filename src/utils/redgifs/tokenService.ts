
import { REDGIFS_CONFIG } from './config';

/**
 * Service for handling RedGifs API authentication
 */
class TokenServiceClass {
  private temporaryToken: string | null = null;
  private tokenExpiry: number = 0;
  
  /**
   * Get a temporary auth token from Redgifs
   */
  public async getTemporaryToken(): Promise<string> {
    const now = Date.now();
    
    // Return existing token if valid
    if (this.temporaryToken && now < this.tokenExpiry) {
      console.log('Using existing token');
      return this.temporaryToken;
    }
    
    try {
      console.log('Requesting temporary token');
      
      // For public API access
      this.temporaryToken = 'anonymous'; // Use anonymous access by default
      this.tokenExpiry = now + REDGIFS_CONFIG.TOKEN_EXPIRY_MS;
      console.log('Using anonymous access');
      return this.temporaryToken;
    } catch (error) {
      console.error('Token endpoint failed, using anonymous access:', error);
      
      // For public endpoints, we can use anonymous access
      this.temporaryToken = 'anonymous';
      this.tokenExpiry = now + REDGIFS_CONFIG.TOKEN_EXPIRY_MS;
      console.log('Using anonymous access');
      return this.temporaryToken;
    }
  }
}

// Export singleton
export const TokenService = new TokenServiceClass();
