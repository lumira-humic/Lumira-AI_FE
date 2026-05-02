import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";

import { getApiErrorMessage } from "@/lib/apiResponse";
import { dataService } from "@/services/dataService";


const STATUS_KEY_MAP = {
  PENDING: "pending",
  REVIEWED: "done",
  APPROVED: "done",
  REJECTED: "done",
};

const statusLabelByKey = {
  pending: "Pending",
  in_review: "Done",
  done: "Done",
};

const resolveStatusKey = (rawStatus) => {
  const status = String(rawStatus || "").trim().toUpperCase();
  if (!status) return "pending";
  return STATUS_KEY_MAP[status] || "pending";
};

const normalizeDiagnosisPayload = (rawDiagnosis) => {
  if (!rawDiagnosis) return { resultLabel: "-", confidence: 0 };

  const diagnosis = (() => {
    if (typeof rawDiagnosis !== "string") return rawDiagnosis;
    try {
      return JSON.parse(rawDiagnosis);
    } catch {
      return { class: rawDiagnosis };
    }
  })();

  return {
    resultLabel: String(diagnosis?.class || diagnosis?.label || diagnosis || "-")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    confidence: Number(diagnosis?.confidence || diagnosis?.score || 0),
  };
};

// ─────────────────────────────────────────────
// Array helpers
// ─────────────────────────────────────────────

const resolveMedicalRecords = (patient) => {
  if (Array.isArray(patient?.medical_records)) return patient.medical_records;
  if (Array.isArray(patient?.medicalRecords)) return patient.medicalRecords;
  return [];
};

// ─────────────────────────────────────────────
// Date formatters
// ─────────────────────────────────────────────

const toTimestamp = (rawDate) => {
  if (!rawDate) return 0;
  const t = new Date(rawDate).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const formatLongDate = (rawDate) => {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const formatShortDate = (rawDate) => {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};



// ─────────────────────────────────────────────
// MAIN RAW API
// ─────────────────────────────────────────────
const buildPortalFromApi = (patient, profile) => {
  const rawRecords = resolveMedicalRecords(patient);

  const records = rawRecords
    .map((record) => {
      const diagnosis = normalizeDiagnosisPayload(record?.ai_diagnosis);
      const statusKey = resolveStatusKey(record?.validation_status);

      const uploadedAt = record?.uploaded_at ?? null;
      const validatedAt = record?.validated_at ?? null;

      return {
        id: record?.id ?? null,
        statusKey,
        statusLabel: statusLabelByKey[statusKey] ?? "Unknown",
        note: record?.doctor_notes || "-",
        uploadedAt,
        validatedAt,
        uploadedDateLabel: formatShortDate(uploadedAt),
        verifiedDateLabel: statusKey === "done" ? formatLongDate(validatedAt) : "",
        confidence: Number(record?.ai_confidence ?? diagnosis.confidence ?? 0),
        aiResultLabel: diagnosis.resultLabel,
        imageUrl: record?.original_image_path || patient?.image || "",
        doctorName: record?.doctor?.name || "-",
        doctorId: record?.doctor?.id || "-",
        isDoctorActive: record?.doctor?.status || "-"
      };
    })
    .sort((a, b) => toTimestamp(b.uploadedAt) - toTimestamp(a.uploadedAt));

  const latestRecord = records[0] ?? null;

  const diagnosisHistory = records.slice(0, 6).map((record) => ({
    id: record.id,
    performedDateLabel: formatShortDate(record.uploadedAt),
    validatedDateLabel: record.statusKey === "done" ? formatShortDate(record.validatedAt) : "-",
    resultLabel: record.aiResultLabel.toUpperCase(),
    resultTone: record.statusKey === "done" ? "green" : "sky",
    recordId: record.id,
  }));

  return {
    patientProfile: {
      name: profile?.name || patient?.name || "Patient",
      patientIdLabel: `ID: #${String(patient?.id || "UNKNOWN").slice(0, 12).toUpperCase()}`,
      scanDateLabel: latestRecord?.uploadedAt
        ? `Scan Date: ${formatShortDate(latestRecord.uploadedAt)}`
        : "Scan Date: -",
      defaultScanId: latestRecord?.id ?? null,
    },
    statusRecords: records,
    activeDoctor: {
      name: latestRecord?.doctorName,
      subtitle: "Breast Cancer Analytics",
      activeLabel: latestRecord?.isDoctorActive,
    },
    aiAssistant: {
      name: "MedGemma Assistant",
      subtitle: "AI Consultation",
    },
    diagnosisHistory,
    doctorChatHistory: [],
    medgemmaPromo: {
      title: "Let's Talk with AI Assistant (MedGemma)",
      subtitle:
        "Get instant answer to your medical concerns and preparation steps while our radiologists review your scan",
      badge: "WHILE YOU WAIT...",
      cta: "Consult Now",
    },
    detailFallback: {
      confidence: latestRecord?.confidence ?? 0,
      resultLabel: latestRecord?.aiResultLabel ?? "-",
      note: latestRecord?.note ?? "-",
      verifiedDateLabel: latestRecord?.verifiedDateLabel ?? "-",
    },
  };
};


// ─────────────────────────────────────────────
// Composable export
// ─────────────────────────────────────────────

export const usePatientPortalData = () => {
  // Step 1: GET /auth/me — current patient profile
  const currentUserQuery = useQuery({
    queryKey: ["patient-current-user"],
    queryFn: () => dataService.getCurrentUser(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Step 2: patient id dari auth/me
  const patientId = computed(() =>
    currentUserQuery.data.value?.id ||
    currentUserQuery.data.value?.patientId ||
    currentUserQuery.data.value?.sub ||
    "",
  );

  // Step 3: GET /patients/:id — full patient detail + medical_records
  const patientDetailQuery = useQuery({
    queryKey: computed(() => ["patient-self-detail", patientId.value]),
    queryFn: () => dataService.getPatientById(patientId.value),
    enabled: computed(() => Boolean(patientId.value)),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  // Portal data dibangun dari patient detail.
  //
  // NOTE: "Riwayat Chat Dokter" (doctorChatHistory) is no longer hydrated
  // here. It now lives in History.vue
  // via useChatRooms() so the previews and presence stream live from
  // Firestore + RTDB instead of being polled through REST. This composable
  // continues to expose `doctorChatHistory: []` from buildPortalFromApi for
  // backward compatibility with any consumer that still reads it.
  const portalData = computed(() =>
    buildPortalFromApi(
      patientDetailQuery.data.value ?? null,
      currentUserQuery.data.value ?? null,
    ),
  );

  const isLoading = computed(() => {
    if (currentUserQuery.isPending.value) return true;
    if (patientId.value && patientDetailQuery.isPending.value && !patientDetailQuery.data.value) {
      return true;
    }
    return false;
  });

  const isRefreshing = computed(() =>
    currentUserQuery.isFetching.value ||
    patientDetailQuery.isFetching.value,
  );

  const errorMessage = computed(() => {
    if (currentUserQuery.isError.value) {
      return getApiErrorMessage(currentUserQuery.error.value, "Failed to load current patient profile.");
    }
    if (patientDetailQuery.isError.value) {
      return getApiErrorMessage(patientDetailQuery.error.value, "Failed to load patient records.");
    }
    return "";
  });

  const refetchAll = async () => {
    await currentUserQuery.refetch();
    if (patientId.value) {
      await patientDetailQuery.refetch();
    }
  };

  return {
    portalData,
    isLoading,
    isRefreshing,
    errorMessage,
    refetchAll,
  };
};
