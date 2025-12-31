import api from '@/lib/axios';

export interface UploadProofResponse {
  success: boolean;
  path: string;
  mimeType: string;
}

export const filesService = {
  uploadProof: async (file: File): Promise<UploadProofResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadProofResponse>('/files/upload-proof', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  getProof: async (filePath: string): Promise<Blob> => {
    const response = await api.get(`/files/proof/${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteProof: async (filePath: string): Promise<void> => {
    await api.delete(`/files/proof/${encodeURIComponent(filePath)}`);
  },
};

