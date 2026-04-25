import axios from "axios";

const AI_API_URL = import.meta.env.VITE_AI_API_URL;


export const aiService = {
  async predict(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${AI_API_URL}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("AI Prediction Error:", error);
      throw error;
    }
  },
};
