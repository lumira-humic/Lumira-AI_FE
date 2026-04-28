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
  async getActivityLogs({ page = 1, limit = 10, search = '', date = '' } = {}) {
    // Fetch patients with all medical records (up to 500 for log view)
    const { data } = await httpClient.get('/patients', {
      params: { page: 1, limit: 500 },
    });
    const payload = unwrapApiData(data);
    const patients = extractCollection(payload).map(normalizePatient);

    // Flatten medical records into activity log rows
    const logs = [];
    for (const patient of patients) {
      const records = Array.isArray(patient.medical_records) ? patient.medical_records : [];
      if (records.length === 0) {
        // No records: still emit a patient log row
        logs.push({
          patientName: patient.name || '-',
          role: 'Doctor',
          time: '-',
          message: '-',
          date: null,
          rawDate: null,
        });
      } else {
        for (const record of records) {
          let aiLabel = '-';
          try {
            const diag = record.ai_diagnosis;
            if (diag) {
              const parsed = typeof diag === 'string' ? JSON.parse(diag) : diag;
              aiLabel = String(parsed?.class || diag);
            }
          } catch {
            aiLabel = String(record.ai_diagnosis || '-');
          }

          const reviewStatus = record.validation_status || '-';
          const doctorDiag = record.doctor_diagnosis || null;
          const message = doctorDiag || aiLabel;

          const uploadedAt = record.uploaded_at || record.validated_at || null;
          const dateObj = uploadedAt ? new Date(uploadedAt) : null;

          logs.push({
            patientName: patient.name || '-',
            role: reviewStatus === 'PENDING' || reviewStatus === '-' ? 'Doctor' : 'Doctor',
            time: dateObj
              ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
              : '-',
            message,
            date: dateObj
              ? dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })
              : '-',
            rawDate: dateObj,
            reviewStatus,
          });
        }
      }
    }

    // Sort descending by date (newest first)
    logs.sort((a, b) => {
      if (!a.rawDate && !b.rawDate) return 0;
      if (!a.rawDate) return 1;
      if (!b.rawDate) return -1;
      return b.rawDate - a.rawDate;
    });

    // Filter by search (patient name or message)
    let filtered = logs;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          String(l.patientName || '').toLowerCase().includes(q) ||
          String(l.message || '').toLowerCase().includes(q) ||
          String(l.role || '').toLowerCase().includes(q),
      );
    }

    // Filter by date (YYYY-MM-DD)
    if (date) {
      filtered = filtered.filter((l) => {
        if (!l.rawDate) return false;
        const y = l.rawDate.getFullYear();
        const m = String(l.rawDate.getMonth() + 1).padStart(2, '0');
        const d = String(l.rawDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === date;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((l, idx) => ({
      ...l,
      no: start + idx + 1,
    }));

    return {
      items,
      meta: { page, limit, total, totalPages },
    };
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

async saveDoctorReview(originalRecordId, formData) {
  return postUnwrapped(
    `/medical-records/${originalRecordId}/review`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
},

  async reAnalyzePatient(patientId) {
    return postUnwrapped(`/patients/${patientId}/reanalyze`);
  },

  async getCurrentUser() {
    return getUnwrapped("/auth/me");
  },
};
