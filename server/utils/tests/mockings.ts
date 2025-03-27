// Mock responses for Kingfisher API
export const mockKingfisherAPI = async (endpoint: string, data: any) => {
  const { user_token } = data;

  // Dummy responses based on endpoint
  switch (endpoint) {
    case '/get-user-details':
      return {
        user_id: 'user_123',
        username: 'kingfisher_player',
        email: 'player@kingfisher.com',
        status: 'verified'
      };

    case '/get-wallet-balance':
      return {
        balance: 5000,
        currency: 'PHP',
        last_updated: new Date().toISOString()
      };

    default:
      throw new Error('Mock endpoint not implemented');
  }
};