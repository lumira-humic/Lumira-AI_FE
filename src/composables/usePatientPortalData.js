import { computed } from "vue";
import { useQuery } from "@tanstack/vue-query";

import { dataService } from "@/services/dataService";
import { getApiErrorMessage } from "@/lib/apiResponse";
import { createPatientPortalMock } from "@/lib/mocks/patientPortal.mock";

const STATUS_KEY_MAP = {
  PENDING: "pending",
  "NOT YET": "pending",
  VALIDATED: "done",
  DONE: "done",
  REVIEWING: "in_review",
  IN_REVIEW: "in_review",
  "IN REVIEW": "in_review",
};

const statusLabelByKey = {
  pending: "Pending",
  in_review: "In Review",
  done: "Done",
};

const resolveStatusKey = (rawStatus) => {
  const status = String(rawStatus || "").trim().toUpperCase();
  if (!status) {
    return "pending";
  }

  return STATUS_KEY_MAP[status] || "in_review";
};

const normalizeDiagnosisPayload = (rawDiagnosis) => {
  if (!rawDiagnosis) {
    return { resultLabel: "-", confidence: 0 };
  }

  const diagnosis = (() => {
    if (typeof rawDiagnosis !== "string") {
      return rawDiagnosis;
    }

    try {
      return JSON.parse(rawDiagnosis);
    } catch (error) {
      return { class: rawDiagnosis };
    }
  })();

  return {
    resultLabel: String(diagnosis?.class || diagnosis?.label || diagnosis || "-")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    confidence: Number(diagnosis?.confidence || diagnosis?.score || 0),
  };
};

const resolveMedicalRecords = (patient) => {
  if (Array.isArray(patient?.medical_records)) {
    return patient.medical_records;
  }

  if (Array.isArray(patient?.medicalRecords)) {
    return patient.medicalRecords;
  }

  return [];
};

const toComparableDate = (rawDate) => {
  if (!rawDate) {
    return 0;
  }

  const parsed = new Date(rawDate).getTime();
  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

const formatLongDate = (rawDate) => {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (rawDate) => {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatClock = (rawDate) => {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildPortalFromApi = (patient, profile) => {
  const records = resolveMedicalRecords(patient)
    .map((record) => {
      const diagnosis = normalizeDiagnosisPayload(record?.ai_diagnosis || record?.aiDiagnosis);
      const statusKey = resolveStatusKey(record?.validation_status || record?.validationStatus);
      const createdAt = record?.created_at || record?.createdAt || patient?.updated_at || patient?.updatedAt;
      const reviewedAt = record?.updated_at || record?.updatedAt || createdAt;

      return {
        id: String(record?.id || crypto.randomUUID()),
        statusKey,
        statusLabel: statusLabelByKey[statusKey],
        scanId: `#USG-${String(record?.id || patient?.id || "00000").slice(0, 5).toUpperCase()}`,
        doctorName:
          record?.reviewedBy?.name ||
          record?.doctor?.name ||
          record?.validator?.name ||
          "Assigned Doctor",
        title:
          statusKey === "pending"
            ? "Please wait, we are processing your data"
            : statusKey === "in_review"
              ? "Your scan is currently reviewed by doctor"
              : "Final review has been completed",
        note: record?.doctor_note || record?.doctorNote || "No doctor note yet.",
        createdAt,
        verifiedDateLabel: statusKey === "done" ? formatLongDate(reviewedAt) : "",
        confidence: diagnosis.confidence,
        aiResultLabel: diagnosis.resultLabel,
        imageUrl: record?.original_image_path || record?.originalImagePath || patient?.image || "",
      };
    })
    .sort((a, b) => toComparableDate(b.createdAt) - toComparableDate(a.createdAt));

  const latestRecord = records[0] || null;

  const doctorChatMessages = [
    {
      id: "doc-api-1",
      dayLabel: latestRecord?.createdAt ? formatLongDate(latestRecord.createdAt) : "Today",
      from: "patient",
      text: "Bagaimana hasilnya dok?",
      time: latestRecord?.createdAt ? formatClock(latestRecord.createdAt) : "09:00",
    },
    {
      id: "doc-api-2",
      from: "doctor",
      text:
        latestRecord?.statusKey === "done"
          ? "Review final sudah tersedia, silakan buka detail report untuk melihat ringkasan hasil."
          : "Hasil anda masih dalam proses review, kami akan update segera.",
      time: latestRecord?.createdAt ? formatClock(latestRecord.createdAt) : "09:10",
    },
  ];

  const aiChatMessages = [
    {
      id: "ai-api-1",
      dayLabel: "Today",
      from: "patient",
      text: "Apa arti hasil saya?",
      time: "08:00",
    },
    {
      id: "ai-api-2",
      from: "assistant",
      text:
        latestRecord?.aiResultLabel && latestRecord.aiResultLabel !== "-"
          ? `Berdasarkan data terbaru, hasil AI mengarah ke ${latestRecord.aiResultLabel}. Tetap ikuti konfirmasi dokter.`
          : "Belum ada hasil AI final. Silakan tunggu update dari dokter.",
      time: "08:01",
    },
  ];

  const diagnosisHistory = records.slice(0, 6).map((record) => ({
    id: `diag-${record.id}`,
    code: record.scanId,
    title: "Breast Ultrasound",
    performedDateLabel: formatShortDate(record.createdAt),
    resultLabel: record.aiResultLabel?.toUpperCase() || "PENDING",
    resultTone: record.statusKey === "done" ? "green" : "sky",
    recordId: record.id,
  }));

  const doctorChatHistory = records.slice(0, 6).map((record) => ({
    id: `chat-${record.id}`,
    doctorName: record.doctorName,
    specialty: "Radiology Team",
    relatedCode: record.scanId,
    dateLabel: formatShortDate(record.createdAt),
  }));

  return {
    patientProfile: {
      name: profile?.name || patient?.name || "Patient",
      subtitle: "Breast Cancer Analytics",
      patientIdLabel: `ID: #${String(patient?.id || "UNKNOWN").slice(0, 10).toUpperCase()}`,
      scanDateLabel: latestRecord?.createdAt ? `Scan Date: ${formatShortDate(latestRecord.createdAt)}` : "Scan Date: -",
      defaultScanId: latestRecord?.scanId || "#USG-00000",
      verifiedBy: latestRecord?.doctorName || "Assigned Doctor",
    },
    statusRecords: records,
    activeDoctor: {
      name: latestRecord?.doctorName || "Assigned Doctor",
      subtitle: "Breast Cancer Analytics",
      activeLabel: "Active recently",
    },
    doctorChatMessages,
    aiAssistant: {
      name: "MedGemma Assistant",
      subtitle: "AI Consultation",
    },
    aiChatMessages,
    diagnosisHistory,
    doctorChatHistory,
    medgemmaPromo: {
      title: "Let's Talk with AI Assistant (MedGemma)",
      subtitle: "Get instant answer to your medical concerns and preparation steps while our radiologists review your scan",
      badge: "WHILE YOU WAIT...",
      cta: "Consult Now",
    },
    detailFallback: {
      confidence: latestRecord?.confidence || 0,
      resultLabel: latestRecord?.aiResultLabel || "-",
      note: latestRecord?.note || "No doctor note yet.",
      verifiedDateLabel: latestRecord?.verifiedDateLabel || "-",
    },
  };
};

export const usePatientPortalData = () => {
  const currentUserQuery = useQuery({
    queryKey: ["patient-current-user"],
    queryFn: () => dataService.getCurrentUser(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const patientId = computed(() => {
    return (
      currentUserQuery.data.value?.id ||
      currentUserQuery.data.value?.patientId ||
      currentUserQuery.data.value?.sub ||
      ""
    );
  });

  const patientDetailQuery = useQuery({
    queryKey: computed(() => ["patient-self-detail", patientId.value]),
    queryFn: () => dataService.getPatientById(patientId.value),
    enabled: computed(() => Boolean(patientId.value)),
    staleTime: 1000 * 20,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const apiRecordCount = computed(() => {
    const detail = patientDetailQuery.data.value;
    return resolveMedicalRecords(detail).length;
  });

  const isUsingMock = computed(() => {
    if (apiRecordCount.value > 0) {
      return false;
    }

    if (patientDetailQuery.isError.value) {
      return true;
    }

    if (currentUserQuery.isSuccess.value && !patientId.value) {
      return true;
    }

    if (patientDetailQuery.isSuccess.value && apiRecordCount.value === 0) {
      return true;
    }

    return false;
  });

  const portalData = computed(() => {
    if (!isUsingMock.value && patientDetailQuery.data.value) {
      return buildPortalFromApi(
        patientDetailQuery.data.value,
        currentUserQuery.data.value,
      );
    }

    return createPatientPortalMock(currentUserQuery.data.value);
  });

  const isLoading = computed(() => {
    if (currentUserQuery.isPending.value) {
      return true;
    }

    if (patientId.value && patientDetailQuery.isPending.value && !patientDetailQuery.data.value) {
      return true;
    }

    return false;
  });

  const isRefreshing = computed(() => {
    return currentUserQuery.isFetching.value || patientDetailQuery.isFetching.value;
  });

  const errorMessage = computed(() => {
    if (currentUserQuery.isError.value) {
      return getApiErrorMessage(currentUserQuery.error.value, "Failed to load current patient profile.");
    }

    if (patientDetailQuery.isError.value && !isUsingMock.value) {
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
    isUsingMock,
    errorMessage,
    refetchAll,
  };
};
