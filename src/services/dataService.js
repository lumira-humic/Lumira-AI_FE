import httpClient from "@/lib/httpClient";
import { unwrapApiData } from "@/lib/apiResponse";
import { getPublicImageUrl } from "./storageService";


// GLOBAL WRAP SERVICE
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

const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const getUnwrapped = async (url, config) => {
  const { data } = await httpClient.get(url, config);
  return unwrapApiData(data);
};

const postUnwrapped = async (url, payload, config) => {
  const { data } = await httpClient.post(url, payload, config);
  return unwrapApiData(data);
};

const patchUnwrapped = async (url, payload) => {
  const { data } = await httpClient.patch(url, payload);
  return unwrapApiData(data);
};

const putUnwrapped = async (url, payload) => {
  const { data } = await httpClient.put(url, payload);
  return unwrapApiData(data);
};

const withFallback = async (primaryCall, fallbackCall) => {
  try {
    return await primaryCall();
  } catch (error) {
    if (!fallbackCall) {
      throw error;
    }

    return fallbackCall(error);
  }
};



// MODULE SERVICE
export const dataService = {
  // Doctor Service
  async getDoctors() {
    const payload = await withFallback(
      () => getUnwrapped("/users", { params: { role: "doctor", page: 1, limit: 100 } }),
      () => getUnwrapped("/doctors"),
    );

    return extractCollection(payload);
  },

  async addDoctor(doctor) {
    const payload = {
      ...doctor,
      role: doctor?.role || "doctor",
    };

    return withFallback(
      () => postUnwrapped("/users", payload),
      () => postUnwrapped("/doctors", doctor),
    );
  },

  async updateDoctor(id, updates) {
    return withFallback(
      () => patchUnwrapped(`/users/${id}`, updates),
      () => patchUnwrapped(`/doctors/${id}`, updates),
    );
  },

  async deleteDoctor(id) {
    await withFallback(
      () => httpClient.delete(`/users/${id}`),
      () => httpClient.delete(`/doctors/${id}`),
    );

    return true;
  },



  // Patient Service
  async getPatients(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = "",
      withMeta = false,
    } = options;

    const { data } = await httpClient.get("/patients", {
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
      },
    });

    const payload = unwrapApiData(data);
    const patients = extractCollection(payload).map(normalizePatient);

    if (!withMeta) {
      return patients;
    }

    const metaLimit = Number(data?.meta?.limit || limit || 10);
    const metaTotal = Number(data?.meta?.total || patients.length || 0);
    const metaTotalPages = Number(
      data?.meta?.totalPages || Math.max(1, Math.ceil(metaTotal / Math.max(1, metaLimit))),
    );

    return {
      items: patients,
      meta: {
        page: Number(data?.meta?.page || page || 1),
        limit: metaLimit,
        total: metaTotal,
        totalPages: metaTotalPages,
      },
    };
  },

  async addPatient(patient) {
    return postUnwrapped("/patients", patient);
  },

  async updatePatient(id, updates) {
    return withFallback(
      () => putUnwrapped(`/patients/${id}`, updates),
      () => patchUnwrapped(`/patients/${id}`, updates),
    );
  },

  async deletePatient(id) {
    await httpClient.delete(`/patients/${id}`);
    return true;
  },



  // Another Services
  async getActivities() {
    const payload = await getUnwrapped("/activities", {
      params: { limit: 10 },
    });

    const items = extractCollection(payload);

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
    const payload = await withFallback(
      () => getUnwrapped("/stats/dashboard"),
      // () => getUnwrapped("/dashboard/stats"),
    );

    return normalizeStats(payload);
  },

  async getDoctorStats(doctorId) {
    const params = doctorId ? { doctorId } : {};
    const payload = await withFallback(
      () => getUnwrapped("/stats/doctor", { params }),
    );

    return {
      total: payload?.total || 0,
      pending: payload?.pending || 0,
      completed: payload?.completed || 0,
      attention: payload?.attention || 0,
    };
  },

  async uploadMedicalRecord(patientId, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", String(patientId));
    formData.append("patientId", String(patientId));

    return postUnwrapped("/medical-records/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async logAIAnalysis(patientId, result = "Analysis Run") {
    await httpClient.post("/ai/analysis-log", {
      patientId,
      result,
    });
  },

  async getPatientById(id) {
    const patient = await getUnwrapped(`/patients/${id}`);
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
    return postUnwrapped(
      `/medical-records/${originalRecordId}/review`,
      payload,
    );
  },

  async reAnalyzePatient(patientId) {
    return postUnwrapped(`/patients/${patientId}/reanalyze`);
  },

  async getCurrentUser() {
    return getUnwrapped("/auth/me");
  },
};
