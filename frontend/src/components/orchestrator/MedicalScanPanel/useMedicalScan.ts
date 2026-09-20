import { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type OCRStep = 'idle' | 'uploading' | 'preparing' | 'reading' | 'checking' | 'complete' | 'error';

export interface MedicationItem {
  name: string | null;
  raw_name: string | null;
  strength: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  timing: string | null;
  instructions: string | null;
  generic_alternative?: string | null;
  confidence: number;
  is_uncertain: boolean;
  uncertainty_reason: string | null;
  alternatives?: string[];
  is_user_corrected?: boolean;
}

export interface ProbableDiagnosis {
  condition: string;
  clinical_rationale: string;
  confidence_level: string;
}

export interface StructuredPrescription {
  success: boolean;
  document_type: string;
  patient: {
    name: string | null;
    age: string | null;
    gender: string | null;
  };
  doctor: {
    name: string | null;
    registration_number: string | null;
    specialization: string | null;
    hospital?: string | null;
  };
  prescription_date: string | null;
  medications: MedicationItem[];
  probable_diagnosis?: ProbableDiagnosis;
  diagnosis: string | null;
  preventive_measures?: string[];
  precautions_and_rules?: string[];
  red_flag_warnings?: string[];
  generic_savings_tip?: string | null;
  tests: string[];
  additional_instructions: string | null;
  raw_text: string | null;
  uncertain_text: string[];
  overall_confidence: number;
  requires_human_verification: boolean;
  total_pages?: number;
  pages?: any[];
}

export const SAMPLE_PRESCRIPTIONS: { id: string; label: string; icon: string; previewUrl: string; data: StructuredPrescription }[] = [
  {
    id: 'respiratory_fever',
    label: 'Acute Respiratory Tract Infection & Fever',
    icon: '🫁',
    previewUrl: '/images/1st-photo-new.jpg',
    data: {
      success: true,
      document_type: "medical_prescription",
      patient: {
        name: "Rachit Tiwari",
        age: "28",
        gender: "Male"
      },
      doctor: {
        name: "Dr. Rajesh K. Varma, MD (Med)",
        registration_number: "MCI/DMC-84920",
        specialization: "Internal Medicine & Pulmonology",
        hospital: "City Care Super Speciality Hospital, New Delhi"
      },
      prescription_date: "04-SEP-2026",
      raw_text: "Rx\n1. Tab. Augmentin 625mg (Amoxycillin + Clavulanic Acid) — 1 tab PO BD (1-0-1) x 5 days (After food)\n2. Tab. Dolo 650mg (Paracetamol) — 1 tab PO TDS SOS for fever > 100°F (After food)\n3. Tab. Pan-40 (Pantoprazole 40mg) — 1 tab PO OD (1-0-0) x 5 days (Empty stomach 30 mins before breakfast)\n4. Tab. Levocet (Levocetirizine 5mg) — 1 tab PO HS (0-0-1) x 5 days at bedtime\n5. Syp. Ascoril-D Cough Syrup — 10ml PO TDS x 5 days\n\nAdvise: Warm water saline gargles, steam inhalation twice daily, drink 3L fluids. Review if fever > 3 days.",
      medications: [
        {
          name: "Augmentin 625",
          raw_name: "Tab. Augmentin 625mg (Amoxycillin + Pot. Clavulanate)",
          strength: "625 mg",
          dosage: "1 tablet",
          frequency: "1-0-1 (Twice Daily)",
          duration: "5 days",
          route: "Oral",
          timing: "After meals (Morning & Night)",
          instructions: "Complete entire 5-day antibiotic course even if feeling better",
          generic_alternative: "Jan Aushadhi Amoxycillin + Clavulanic Acid 625mg (Save ~65%)",
          confidence: 0.98,
          is_uncertain: false,
          uncertainty_reason: null
        },
        {
          name: "Dolo 650",
          raw_name: "Tab. Dolo 650 (Paracetamol)",
          strength: "650 mg",
          dosage: "1 tablet",
          frequency: "SOS / Thrice Daily",
          duration: "3-5 days",
          route: "Oral",
          timing: "After food (Interval of min 6 hours between doses)",
          instructions: "Take when body temperature exceeds 100°F or severe body ache",
          generic_alternative: "Jan Aushadhi Paracetamol 650mg (PMBJP Price: ₹12/strip)",
          confidence: 0.99,
          is_uncertain: false,
          uncertainty_reason: null
        },
        {
          name: "Pan 40",
          raw_name: "Tab. Pan-40 (Pantoprazole)",
          strength: "40 mg",
          dosage: "1 tablet",
          frequency: "1-0-0 (Once Daily)",
          duration: "5 days",
          route: "Oral",
          timing: "Before breakfast on empty stomach",
          instructions: "Take 30 minutes before morning tea/breakfast to prevent gastric irritation from antibiotics",
          generic_alternative: "Jan Aushadhi Pantoprazole 40mg",
          confidence: 0.96,
          is_uncertain: false,
          uncertainty_reason: null
        },
        {
          name: "Levocet 5",
          raw_name: "Tab. Levocet (Levocetirizine)",
          strength: "5 mg",
          dosage: "1 tablet",
          frequency: "0-0-1 (Nightly)",
          duration: "5 days",
          route: "Oral",
          timing: "At bedtime after dinner",
          instructions: "May cause mild drowsiness; avoid driving after taking dose",
          generic_alternative: "Jan Aushadhi Levocetirizine 5mg (₹6/strip)",
          confidence: 0.95,
          is_uncertain: false,
          uncertainty_reason: null
        }
      ],
      probable_diagnosis: {
        condition: "Acute Upper Respiratory Tract Infection (URTI) & Viral Rhinotracheitis",
        clinical_rationale: "The combination of broad-spectrum antibiotic (Augmentin), antipyretic/analgesic (Dolo 650), H1 antihistamine (Levocetirizine), and gastroprotective PPI (Pantoprazole) strongly points to a secondary bacterial or severe viral respiratory tract infection with acute fever and nasal congestion.",
        confidence_level: "High (95%)"
      },
      diagnosis: "Acute Upper Respiratory Tract Infection (URTI) & Fever",
      preventive_measures: [
        "Hydration: Drink 2.5 to 3 Liters of warm fluids, herbal teas, or warm water daily.",
        "Steam & Gargles: Inhale steam for 10 minutes and gargle with warm saline water twice daily.",
        "Dietary Care: Consume soft, easily digestible warm meals (khichdi, vegetable soups); avoid ice-cold drinks and oily snacks.",
        "Hygiene: Wear a mask around family members to prevent viral transmission and wash hands frequently."
      ],
      precautions_and_rules: [
        "CRITICAL: Complete the full 5-day antibiotic course. Stopping prematurely promotes antimicrobial resistance.",
        "Take Pantoprazole strictly on an empty stomach with plain water 30 minutes before breakfast.",
        "Do not exceed 4 grams of Paracetamol in 24 hours.",
        "Avoid alcohol while on antihistamine and antibiotic therapy."
      ],
      red_flag_warnings: [
        "Shortness of breath, rapid breathing, or chest pain.",
        "Persistent high-grade fever > 102.5°F not responding to antipyretics after 48 hours.",
        "Hemoptysis (coughing blood) or extreme lethargy and inability to maintain fluid intake."
      ],
      generic_savings_tip: "Switching to Jan Aushadhi generic equivalents (Amoxy-Clav, Paracetamol, Pantoprazole) reduces total prescription cost from ~₹480 to ~₹110.",
      tests: ["Complete Blood Count (CBC) if fever persists > 4 days", "Chest X-Ray PA View (optional)"],
      additional_instructions: "Adequate rest, isolate if sneezing/coughing, follow up in 5 days if unresolved.",
      uncertain_text: [],
      overall_confidence: 0.96,
      requires_human_verification: false
    }
  },
  {
    id: 'diabetes_hypertension',
    label: 'Type-2 Diabetes & Hypertension Management',
    icon: '❤️',
    previewUrl: '/images/1st-photo-new.jpg',
    data: {
      success: true,
      document_type: "medical_prescription",
      patient: {
        name: "Mausam Kar",
        age: "52",
        gender: "Male"
      },
      doctor: {
        name: "Dr. Sunita Deshmukh, MD, DM (Endocrinology)",
        registration_number: "MMC-49210",
        specialization: "Consultant Diabetologist & Cardiometabolic Specialist",
        hospital: "Apex Heart & Diabetes Institute, Mumbai"
      },
      prescription_date: "01-SEP-2026",
      raw_text: "Rx\n1. Tab. Glycomet-GP 1 (Metformin 500mg + Glimepiride 1mg) — 1 tab PO BD (1-0-1) With meals\n2. Tab. Telma-40 (Telmisartan 40mg) — 1 tab PO OD (1-0-0) Morning after breakfast\n3. Tab. Rosuvas-10 (Rosuvastatin 10mg) — 1 tab PO HS (0-0-1) At bedtime\n4. Tab. Ecospirin-75 (Aspirin 75mg) — 1 tab PO Post-Lunch\n\nAdvise: 45 min brisk walk daily, strictly low salt (< 4g/day), zero refined sugars. Check Fasting & PP Blood Glucose weekly. HbA1c in 3 months.",
      medications: [
        {
          name: "Glycomet-GP 1",
          raw_name: "Tab. Glycomet-GP 1 (Metformin + Glimepiride)",
          strength: "500mg / 1mg",
          dosage: "1 tablet",
          frequency: "1-0-1 (Twice Daily)",
          duration: "30 days",
          route: "Oral",
          timing: "Immediately before or with breakfast and dinner",
          instructions: "Take with first bite of meal to avoid hypoglycemia and reduce stomach upset",
          generic_alternative: "Jan Aushadhi Metformin 500 + Glimepiride 1mg (₹18/strip of 10)",
          confidence: 0.97,
          is_uncertain: false,
          uncertainty_reason: null
        },
        {
          name: "Telma 40",
          raw_name: "Tab. Telma-40 (Telmisartan)",
          strength: "40 mg",
          dosage: "1 tablet",
          frequency: "1-0-0 (Once Daily)",
          duration: "30 days",
          route: "Oral",
          timing: "Morning after breakfast",
          instructions: "Take at the exact same hour every morning for continuous 24h blood pressure control",
          generic_alternative: "Jan Aushadhi Telmisartan 40mg (₹14/strip)",
          confidence: 0.98,
          is_uncertain: false,
          uncertainty_reason: null
        },
        {
          name: "Rosuvas 10",
          raw_name: "Tab. Rosuvas-10 (Rosuvastatin)",
          strength: "10 mg",
          dosage: "1 tablet",
          frequency: "0-0-1 (Nightly)",
          duration: "30 days",
          route: "Oral",
          timing: "Bedtime after dinner",
          instructions: "Statin for lipid & plaque stabilization; take at night when hepatic cholesterol synthesis is highest",
          generic_alternative: "Jan Aushadhi Rosuvastatin 10mg (₹20/strip)",
          confidence: 0.96,
          is_uncertain: false,
          uncertainty_reason: null
        }
      ],
      probable_diagnosis: {
        condition: "Type-2 Diabetes Mellitus with Essential Hypertension & Dyslipidemia",
        clinical_rationale: "Dual oral hypoglycemic agent (Metformin + Glimepiride) alongside an Angiotensin II receptor blocker (Telmisartan) and HMG-CoA reductase inhibitor (Rosuvastatin) confirms clinical management of metabolic syndrome and cardiovascular risk reduction.",
        confidence_level: "High (98%)"
      },
      diagnosis: "Type 2 Diabetes Mellitus & Hypertension",
      preventive_measures: [
        "Dietary Control: Strictly eliminate refined sugar, sweets, sodas, and maida; opt for high-fiber millets, oats, and green leafy vegetables.",
        "Salt Limitation: Limit dietary sodium to less than 1 teaspoon (3-4 grams) per day; avoid packaged papads, pickles, and chips.",
        "Daily Physical Activity: Engage in 30-45 minutes of brisk walking or moderate aerobic exercise at least 5 days a week.",
        "Foot Care: Check feet daily for minor cuts, blisters, or dry cracks; wear comfortable cushioned footwear."
      ],
      precautions_and_rules: [
        "Carry 2-3 glucose candies or fruit juice sachets to rapidly treat symptoms of sudden sweating, tremors, or dizziness (hypoglycemia).",
        "Never skip meals while taking Glimepiride.",
        "Monitor blood pressure and fasting glucose weekly and log in a digital record."
      ],
      red_flag_warnings: [
        "Severe dizziness, cold sweats, confusion, or fainting (Severe Hypoglycemia).",
        "Sudden chest heaviness, pressure radiating to jaw/left shoulder, or severe sudden breathlessness.",
        "Systolic Blood Pressure > 180 mmHg or Diastolic > 110 mmHg with headache."
      ],
      generic_savings_tip: "Monthly expenditure on branded Telma, Glycomet, and Rosuvas (~₹950/month) drops to ~₹180/month via PM Jan Aushadhi generic substitutes.",
      tests: ["Fasting Blood Sugar (FBS) & PPBS", "HbA1c Glycated Hemoglobin", "Lipid Profile & Serum Creatinine"],
      additional_instructions: "Maintain medical diary, avoid smoking, consult for dose titration based on HbA1c.",
      uncertain_text: [],
      overall_confidence: 0.97,
      requires_human_verification: false
    }
  }
];

export function useMedicalScan() {
  const [structuredPrescription, setStructuredPrescription] = useState<StructuredPrescription | null>(SAMPLE_PRESCRIPTIONS[0].data);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(SAMPLE_PRESCRIPTIONS[0].previewUrl);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>("sample_respiratory_prescription.jpg");
  const [loading, setLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<OCRStep>('idle');
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'diagnosis' | 'preventive' | 'transcription' | 'medications'>('details');
  const [isVerifiedByUser, setIsVerifiedByUser] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('respiratory_fever');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectSample = (sampleId: string) => {
    const sample = SAMPLE_PRESCRIPTIONS.find(s => s.id === sampleId);
    if (sample) {
      setSelectedSampleId(sample.id);
      setStructuredPrescription(sample.data);
      setUploadedImagePreview(sample.previewUrl);
      setUploadedFileName(sample.label);
      setOcrError(null);
      setIsVerifiedByUser(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setOcrError(null);
    setLoading(true);
    setOcrStep('uploading');

    // Create local image preview URL
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target?.result as string;
      setUploadedImagePreview(base64Data);

      try {
        setOcrStep('preparing');
        await new Promise(r => setTimeout(r, 400));

        setOcrStep('reading');
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_BASE}/api/prescription/ocr`, {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.data) {
          setOcrStep('checking');
          setStructuredPrescription(data.data);
          setIsVerifiedByUser(!data.data.requires_human_verification);
          setOcrStep('complete');
        } else {
          throw new Error(data?.error?.message || 'Failed to extract prescription data');
        }
      } catch (err: any) {
        console.warn('Prescription OCR live call fallback:', err);
        setOcrError(err?.message || 'Could not connect to OCR service. Displaying standard sample extraction.');
        // Graceful fallback to sample data if offline
        setStructuredPrescription(SAMPLE_PRESCRIPTIONS[0].data);
        setOcrStep('error');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const updateMedicationItem = (index: number, updated: Partial<MedicationItem>) => {
    if (!structuredPrescription) return;
    const newMeds = [...structuredPrescription.medications];
    newMeds[index] = { ...newMeds[index], ...updated, is_user_corrected: true };
    setStructuredPrescription({
      ...structuredPrescription,
      medications: newMeds
    });
  };

  const verifyByUser = () => {
    setIsVerifiedByUser(true);
  };

  return {
    structuredPrescription,
    setStructuredPrescription,
    uploadedImagePreview,
    setUploadedImagePreview,
    uploadedFileName,
    setUploadedFileName,
    loading,
    ocrStep,
    ocrError,
    activeTab,
    setActiveTab,
    isVerifiedByUser,
    verifyByUser,
    updateMedicationItem,
    handleFileUpload,
    fileInputRef,
    selectedSampleId,
    selectSample,
    samples: SAMPLE_PRESCRIPTIONS
  };
}
