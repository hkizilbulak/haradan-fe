import { HttpClient, resolveApiBaseUrl } from '@/services/http';

interface GenerateAdvertRequest {
  horseData: string;
}

interface GenerateAdvertResponse {
  title: string;
  description: string;
}

export const AiRepository = {
  generateAdvert: async (data: GenerateAdvertRequest): Promise<GenerateAdvertResponse> => {
    try {
      const baseUrl = resolveApiBaseUrl() || 'http://localhost:8080/api';
      const http = new HttpClient(baseUrl);
      
      const response = await http.request<GenerateAdvertResponse>('/v1/ai/generate-tjk-advert', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response;
    } catch (error) {
      console.error('Failed to generate advert:', error);
      // Graceful degradation: return empty if failed
      return {
        title: '',
        description: ''
      };
    }
  }
};
