const PATIENT_NAMES = [
  "Bachtiar",
  "Rani",
  "Mufid",
  "Rizky",
  "Sinta",
  "Farah",
  "Kevin",
  "Nadia",
  "Joko",
  "Mila",
  "Aldi",
  "Mey",
  "Dinda",
  "Rafi",
  "Anita",
  "Fadli",
  "Nina",
  "Rama",
  "Dewi",
  "Lutfi",
];

const REVIEW_VARIANTS = ["PENDING", "VALIDATED", "PENDING", "PENDING", "VALIDATED"];

const AI_VARIANTS = ["Normal", "Benign", "-", "Malignant", "Benign"];

const toCode = (index) => String(index + 1).padStart(3, "0");

export function generateDoctorDummyPatients(seedPatient = {}, total = 51) {
  return Array.from({ length: total }, (_, index) => {
    const name = PATIENT_NAMES[index % PATIENT_NAMES.length];
    const review = REVIEW_VARIANTS[index % REVIEW_VARIANTS.length];
    const aiResult = AI_VARIANTS[index % AI_VARIANTS.length];
    const hasImage = aiResult !== "-";

    return {
      ...seedPatient,
      id: index + 1,
      code: toCode(index),
      name,
      email: `${name.toLowerCase()}${index + 1}@mail.com`,
      phone: null,
      address: null,
      image: hasImage ? "dummy-image" : null,
      review,
      aiResult,
      medical_records: hasImage
        ? [
            {
              ai_diagnosis:
                aiResult === "-"
                  ? null
                  : JSON.stringify({ class: aiResult }),
            },
          ]
        : [],
    };
  });
}
