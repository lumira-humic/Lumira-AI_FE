import httpClient from "@/lib/httpClient";
import { getPublicImageUrl } from "./storageService";


const getLatestRecord = (patient) => {
  if (!patient?.medical_records || patient.medical_records.length === 0) {
    return null;
  }

  const sorted = [...patient.medical_records].sort(
    (a, b) => (b.id || 0) - (a.id || 0),
  );

  return sorted[0] || null;
};

const normalizePatient = (patient) => {
  const latestRecord = getLatestRecord(patient);
  const imagePath = latestRecord?.original_image_path || patient?.image || "";

  return {
    ...patient,
    image: getPublicImageUrl(imagePath),
    review: latestRecord?.validation_status || patient?.review || "-",
  };
};

const normalizeStats = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return [
    {
      label: "Total Patient",
      value: payload?.patientCount || 0,
      icon: "users",
      color: "blue",
    },
    {
      label: "Total Doctor",
      value: payload?.doctorCount || 0,
      icon: "user-md",
      color: "green",
    },
    {
      label: "Image Uploaded",
      value: payload?.imageCount || 0,
      icon: "image",
      color: "blue",
    },
    {
      label: "Waiting For Review",
      value: payload?.waitingCount || 0,
      icon: "clock",
      color: "red",
    },
  ];
};

export const dataService = {
  async getDoctors() {
    const { data } = await httpClient.get("/doctors");
    return data?.items || data || [];
  },

  async addDoctor(doctor) {
    const { data } = await httpClient.post("/doctors", doctor);
    return data?.item || data;
  },

  async updateDoctor(id, updates) {
    const { data } = await httpClient.patch(`/doctors/${id}`, updates);
    return data?.item || data;
  },

  async deleteDoctor(id) {
    await httpClient.delete(`/doctors/${id}`);
    return true;
  },

  async getPatients() {
    const { data } = await httpClient.get("/patients");
    const patients = data?.items || data || [];
    return patients.map(normalizePatient);
  },

  async addPatient(patient) {
    const { data } = await httpClient.post("/patients", patient);
    return data?.item || data;
  },

  async updatePatient(id, updates) {
    const { data } = await httpClient.patch(`/patients/${id}`, updates);
    return data?.item || data;
  },

  async deletePatient(id) {
    await httpClient.delete(`/patients/${id}`);
    return true;
  },

  async getActivities() {
    const { data } = await httpClient.get("/activities", {
      params: { limit: 10 },
    });

    const items = data?.items || data || [];

    return items.map((log, index) => ({
      id: log.id || index,
      title: log.action_type || log.title || "Activity",
      user: log.user?.name || log.user_name || log.user || "Unknown",
      time: log.timestamp
        ? new Date(log.timestamp).toLocaleTimeString()
        : log.time || "-",
      iconColor: "bg-blue-100 text-blue-600",
    }));
  },

  async getDashboardStats() {
    const { data } = await httpClient.get("/dashboard/stats");
    return normalizeStats(data);
  },

  async getDoctorStats(doctorId) {
    const { data } = await httpClient.get("/doctors/stats", {
      params: doctorId ? { doctorId } : {},
    });

    return {
      total: data?.total || 0,
      pending: data?.pending || 0,
      completed: data?.completed || 0,
      attention: data?.attention || 0,
    };
  },

  async uploadMedicalRecord(patientId, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", String(patientId));

    const { data } = await httpClient.post("/medical-records/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data?.item || data;
  },

  async logAIAnalysis(patientId, result = "Analysis Run") {
    await httpClient.post("/ai/analysis-log", {
      patientId,
      result,
    });
  },

  async changePassword(currentPassword, newPassword) {
    await httpClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    return true;
  },

  async getPatientById(id) {
    const { data } = await httpClient.get(`/patients/${id}`);
    const patient = data?.item || data;
    const normalized = normalizePatient(patient);
    const latestRecord = getLatestRecord(normalized);

    return {
      ...normalized,
      latestRecord,
      aiGradCamImage: getPublicImageUrl(latestRecord?.ai_gradcam_path || ""),
      doctorBrushImage: getPublicImageUrl(latestRecord?.doctor_brush_path || ""),
    };
  },

  async saveDoctorReview(originalRecordId, payload) {
    const { data } = await httpClient.post(
      `/medical-records/${originalRecordId}/review`,
      payload,
    );

    return data?.item || data;
  },

  async reAnalyzePatient(patientId) {
    const { data } = await httpClient.post(`/patients/${patientId}/reanalyze`);
    return data?.item || data;
  },

  async getCurrentUser() {
    const { data } = await httpClient.get("/users/me");
    return data?.user || data || null;
  },
};
