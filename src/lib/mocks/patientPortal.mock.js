const DEFAULT_DOCTOR_NAME = "Dr. Bachtiar";

const formatLongDate = (isoLike) => {
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) {
    return "20 March 2026";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function createPatientPortalMock(profile = {}) {
  const patientName = profile?.name || "Hernando";
  const baseScanId = "#USG-98281";

  const statusRecords = [
    {
      id: "rec-pending-1",
      statusKey: "pending",
      statusLabel: "Pending",
      scanId: baseScanId,
      doctorName: DEFAULT_DOCTOR_NAME,
      title: "Please wait, we are processing your data",
      note: "mohon tunggu, data anda sedang di proses oleh kami",
      createdAt: "2026-04-17T21:00:00.000Z",
      verifiedDateLabel: "",
      confidence: 0,
      aiResultLabel: "-",
      imageUrl: "",
    },
    {
      id: "rec-review-1",
      statusKey: "in_review",
      statusLabel: "In Review",
      scanId: baseScanId,
      doctorName: DEFAULT_DOCTOR_NAME,
      title: "Your scan is currently reviewed by doctor",
      note: "Doctor is validating AI findings before final report is released.",
      createdAt: "2026-04-17T21:00:00.000Z",
      verifiedDateLabel: "",
      confidence: 0,
      aiResultLabel: "In Review",
      imageUrl: "",
    },
    {
      id: "rec-done-1",
      statusKey: "done",
      statusLabel: "Done",
      scanId: baseScanId,
      doctorName: "Dr. Rani",
      title: "Final review has been completed",
      note: "Finding is stable and characteristic of non-malignant tissue.",
      createdAt: "2026-04-17T21:00:00.000Z",
      verifiedDateLabel: "20 March 2026",
      confidence: 98.4,
      aiResultLabel: "Benign",
      imageUrl: "",
    },
  ];

  const doctorChatMessages = [
    {
      id: "doc-1",
      dayLabel: "17 April 2026",
      from: "patient",
      text: "Bagaimana hasilnya pak?",
      time: "21.00",
    },
    {
      id: "doc-2",
      from: "doctor",
      text: "Berdasarkan hasil analisis saya, terdapat indikasi malignant. Namun, perlu pemeriksaan lanjutan untuk memastikan diagnosis.",
      time: "21.00",
    },
    {
      id: "doc-3",
      dayLabel: "Today",
      from: "patient",
      text: "Sudah ada perkembangan Pak?",
      time: "08.00",
    },
  ];

  const aiChatMessages = [
    {
      id: "ai-1",
      dayLabel: "17 April 2026",
      from: "patient",
      text: "Bagaimana hasilnya pak?",
      time: "21.00",
    },
    {
      id: "ai-2",
      from: "assistant",
      text: "Berdasarkan hasil analisis saya, terdapat indikasi malignant. Namun, perlu pemeriksaan lanjutan untuk memastikan diagnosis.",
      time: "21.00",
    },
    {
      id: "ai-3",
      dayLabel: "Today",
      from: "patient",
      text: "Sudah ada perkembangan Pak?",
      time: "08.00",
    },
  ];

  const diagnosisHistory = [
    {
      id: "history-1",
      code: "#USG-99275-Z",
      title: "USG Biopsy",
      performedDateLabel: "Oct 14, 2025",
      resultLabel: "BENIGN (STABLE)",
      resultTone: "sky",
      recordId: "rec-done-1",
    },
    {
      id: "history-2",
      code: "#MMG-44102-X",
      title: "Screening Mammography",
      performedDateLabel: "May 22, 2025",
      resultLabel: "NORMAL",
      resultTone: "green",
      recordId: "rec-done-1",
    },
  ];

  const doctorChatHistory = [
    {
      id: "chat-history-1",
      doctorName: "Dr. Wijaya, Sp.Onk",
      specialty: "Surgical Oncologist",
      relatedCode: "#USG-99275-Z",
      dateLabel: "Oct 16, 2025",
    },
    {
      id: "chat-history-2",
      doctorName: "Dr. Tirta, Sp.Rad",
      specialty: "Radiologist",
      relatedCode: "#MMG-44102-X",
      dateLabel: "Oct 24, 2025",
    },
  ];

  const latestDoneRecord = statusRecords.find((record) => record.statusKey === "done") || statusRecords[0];

  return {
    patientProfile: {
      name: patientName,
      subtitle: "Breast Cancer Analytics",
      patientIdLabel: "ID: #USG-99275-Z",
      scanDateLabel: "Scan Date: Oct 14, 2025",
      defaultScanId: baseScanId,
      verifiedBy: latestDoneRecord?.doctorName || DEFAULT_DOCTOR_NAME,
    },
    statusRecords,
    activeDoctor: {
      name: "Dr Richard",
      subtitle: "Breast Cancer Analytics",
      activeLabel: "Active 9 Minutes Ago",
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
      confidence: latestDoneRecord?.confidence || 98.4,
      resultLabel: latestDoneRecord?.aiResultLabel || "Benign",
      note: latestDoneRecord?.note || "Finding is stable and characteristic of non-malignant tissue.",
      verifiedDateLabel: latestDoneRecord?.verifiedDateLabel || formatLongDate(new Date().toISOString()),
    },
  };
}
