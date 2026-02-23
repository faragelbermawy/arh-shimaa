import React from 'react';
import { 
  ShieldCheck, 
  Hand, 
  Stethoscope, 
  UserRound, 
  AlertCircle,
  Users,
  LucideIcon,
  UserPlus,
  Zap,
  Droplets,
  UserCheck,
  Home,
  ClipboardList,
  Wand2,
  Clock,
  Archive,
  Search,
  Truck,
  Trash2,
  BellRing,
  Activity,
  ShieldAlert,
  Dna,
  FileText,
  Shirt,
  Eye,
  Shield,
  Trash,
  Wind,
  Layers,
  Sparkles,
  Signpost,
  Library
} from 'lucide-react';
import { ModuleId, PPEProtocol } from './types';

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  shortDesc: string;
  icon: LucideIcon;
  color: string;
  videoUrl?: string; 
  displayVideoUrl?: string;
}

export const MODULES: ModuleDefinition[] = [
  {
    id: ModuleId.GENERAL_LEARNING,
    title: 'BICSL Manual',
    shortDesc: 'Official GDIPC BICSL Manual V3.0 (2025).',
    icon: Library,
    color: 'bg-slate-800'
  },
  {
    id: ModuleId.MDRO_BASICS,
    title: 'MDRO Awareness',
    shortDesc: 'Multi-Drug Resistant Organisms education.',
    icon: AlertCircle,
    color: 'bg-red-500',
    videoUrl: 'https://www.youtube.com/embed/5v9foYv7cNo',
    displayVideoUrl: 'https://youtu.be/5v9foYv7cNo?si=IBVWrUW0lR2wvt8b'
  },
  {
    id: ModuleId.HAND_HYGIENE,
    title: 'Hand Hygiene',
    shortDesc: 'WHO 5 Moments & Proper Techniques.',
    icon: Hand,
    color: 'bg-blue-500',
    videoUrl: 'https://www.youtube.com/embed/3PmVJQUCm4E',
    displayVideoUrl: 'https://youtu.be/3PmVJQUCm4E?si=yXQP5kYJXBA_g_28'
  },
  {
    id: ModuleId.PPE_PROTOCOLS,
    title: 'PPE Mastery',
    shortDesc: 'Donning & Doffing clinical sequence.',
    icon: ShieldCheck,
    color: 'bg-emerald-500',
    videoUrl: 'https://www.youtube.com/embed/n0plcoKo6ig',
    displayVideoUrl: 'https://youtu.be/n0plcoKo6ig?si=yreQZe37Fn8BvCiX'
  },
  {
    id: ModuleId.VISITOR_EDUCATION,
    title: 'Family & Visitors',
    shortDesc: 'Protect your loved ones from infection.',
    icon: Users,
    color: 'bg-purple-500',
    videoUrl: 'https://www.youtube.com/embed/1rxSD7ndL6A',
    displayVideoUrl: 'https://youtu.be/1rxSD7ndL6A?si=dRzVAQO87C9ySOoN'
  },
  {
    id: ModuleId.PATIENT_TYPES,
    title: 'Patient Precautions',
    shortDesc: 'Clean vs. Contact status logic.',
    icon: UserRound,
    color: 'bg-amber-500',
    videoUrl: 'https://www.youtube.com/embed/dXqy1wXyXZg',
    displayVideoUrl: 'https://youtu.be/dXqy1wXyXZg?si=fwX2udo16uXRQUXk'
  },
  {
    id: ModuleId.EQUIPMENT_CLEANING,
    title: 'Equipment Care',
    shortDesc: 'Sanitization of medical instruments.',
    icon: Stethoscope,
    color: 'bg-indigo-500',
    videoUrl: 'https://www.youtube.com/embed/kgy3Y1YnoNk',
    displayVideoUrl: 'https://youtu.be/kgy3Y1YnoNk?si=2VNAl0SY8nCUmSM0'
  },
];

// PERMANENT APPLICATION CONTENT: BICSL MANUAL V3.0
export const BICSL_MANUAL_2025 = {
  header: {
    authority: "General Directorate of Infection Prevention and Control (GDIPC)",
    title: "Basic Infection Control Skills License (BICSL) Manual",
    date: "February 2025",
    version: "3.0"
  },
  sections: [
    {
      id: "intro",
      title: "Introduction & Aim",
      content: "BICSL is a mandatory training program aimed at providing healthcare workers (HCWs) with essential skills in infection prevention and control. These competencies are applied in healthcare facilities to minimize the risk of infection transmission and maintain a safe environment for HCWs, patients, and visitors. The program targets preventing healthcare-associated infections and minimizing negative consequences."
    },
    {
      id: "hh",
      title: "A. Hand Hygiene (HH)",
      content: "Hand Hygiene is a general term that applies to handwashing, antiseptic hand rub, or hand antisepsis. It includes alcohol-based hand rubs (preferred in most situations), hand washing with soap and water (mandatory if hands are visibly soiled or for spore-forming pathogens like C. diff), and surgical hand scrubs. Duration for hand rub is 20-30 sec, and hand wash is 40-60 sec."
    },
    {
      id: "ppe",
      title: "B. Personal Protective Equipment (PPE)",
      content: "PPE includes specialized clothing worn for protection against infectious materials. Key items: Gowns (Contact/Standard), Surgical Masks (Droplet/Standard), N95 Respirators (Airborne), and Goggles/Face Shields. Critical: All HCWs must be fit-tested for N95 every 2 years. Proper sequence (Donning: Gown -> Mask -> Eyes -> Gloves; Doffing: Gloves -> Eyes -> Gown -> Mask)."
    },
    {
      id: "spills",
      title: "C. Biological Spill Management",
      content: "Management of blood and body fluid spillages involves using specific spill kits (Biohazard, Urine/Vomit, Chemical, Cytotoxic). Large spills require biological spill kits and 5000 ppm chlorine disinfectant for blood. Essential to secure the area and contain the spill before final disinfection."
    },
    {
      id: "nsi",
      title: "D. Sharp Injuries / NSI Management",
      content: "Needle sticks and sharps injuries are serious hazards. Immediate measures: Stop procedure, dispose of sharp, encourage wound to bleed under water, clean with soap, apply dressing, and immediate reporting. Follow-up includes testing for HBV, HCV, and HIV based on source status."
    },
    {
      id: "tbp",
      title: "E. Transmission Based Precautions",
      content: "Implemented in addition to standard precautions based on route of transmission: Contact (VRE, MRSA, C. diff), Droplet (Influenza, Mumps, Rubella), and Airborne (TB, Measles, Varicella). Airborne requires AIIR negative pressure rooms and N95 masks."
    },
    {
      id: "fittest",
      title: "F. Respirator Fit Test",
      content: "Required for all HCWs with potential airborne exposure. Two types: Quantitative (machine-based, preferred) and Qualitative (pass/fail based on taste). Must be clean-shaven. Repeat fit tests every 2 years or if facial changes occur (weight loss, surgery)."
    },
    {
      id: "papr",
      title: "G. Powered Air Purifying Respirator (PAPR)",
      content: "Battery-powered blowers providing positive HEPA-filtered airflow. Indications: HCW has facial hair, facial deformity, or failed N95 fit testing. PAPR components: Hood, Breathing tube, Blower, and Battery. Must be turned on BEFORE entering exposure area."
    }
  ]
};

export const ENVIRONMENTAL_CHECKLIST = [
  { title: "Bed Rails & High Touch Areas", ar: "حواجز السرير والأسطح الأكثر تلامساً", icon: Sparkles },
  { title: "Overbed Table Cleanliness", ar: "نظافة طاولة المريض", icon: Layers },
  { title: "Floor Cleanliness", ar: "نظافة الأرضيات", icon: Wind },
  { title: "Waste Management / Bins", ar: "إدارة النفايات والحاويات", icon: Trash }
];

export const EQUIPMENT_CHECKLIST = [
  { title: "Stethoscope Disinfection", ar: "تطهير السماعة الطبية", icon: Stethoscope },
  { title: "BP Cuff / Vital Monitor Clean", ar: "نظافة جهاز الضغط ومراقب العلامات", icon: Activity },
  { title: "IV Pump / Pole Cleanliness", ar: "نظافة مضخة المحاليل وحاملها", icon: ShieldCheck },
  { title: "Dedicated Equipment Policy", ar: "سياسة استخدام أدوات مخصصة", icon: Archive }
];

export const ISOLATION_CHECKLIST = [
  { title: "Correct Door Signage Posted", ar: "اللوحات الإرشادية الصحيحة على الباب", icon: Signpost },
  { title: "Room Setup (Negative Pressure if needed)", ar: "تجهيز الغرفة بشكل صحيح", icon: Wind },
  { title: "Dedicated Equipment in Room", ar: "وجود أدوات مخصصة داخل الغرفة", icon: Stethoscope },
  { title: "Biohazard Bin Available", ar: "توفر حاوية النفايات الطبية", icon: Trash2 }
];

export const VISITOR_CHECKLIST = [
  { title: "Visitor Wearing PPE Correctly", ar: "ارتداء الزائر للملابس الواقية", icon: Shirt },
  { title: "Hand Hygiene on Entry", ar: "تطهير اليدين عند الدخول", icon: Droplets },
  { title: "No Sitting on Patient Bed", ar: "عدم الجلوس على سرير المريض", icon: AlertCircle },
  { title: "Hand Hygiene on Exit", ar: "تطهير اليدين عند الخروج", icon: Home }
];

export const WHO_5_MOMENTS = [
  {
    id: 1,
    icon: UserPlus,
    en: "Before Touching a Patient",
    ar: "قبل ملامسة المريض",
    descEn: "Clean your hands before touching a patient when approaching him/her.",
    descAr: "طهر يديك قبل ملامسة المريض عند الاقتراب منه.",
    color: "bg-blue-600"
  },
  {
    id: 2,
    icon: Zap,
    en: "Before Clean/Aseptic Procedure",
    ar: "قبل الإجراءات النظيفة والمعقمة",
    descEn: "Clean your hands immediately before any aseptic procedure.",
    descAr: "طهر يديك مباشرة قبل البدء بأي إجراء طبي معقم.",
    color: "bg-amber-500"
  },
  {
    id: 3,
    icon: Droplets,
    en: "After Body Fluid Exposure Risk",
    ar: "بعد التعرض لسوائل الجسم",
    descEn: "Clean your hands immediately after an exposure risk to body fluids.",
    descAr: "طهر يديك مباشرة بعد خطر التعرض لسوائل الجسم.",
    color: "bg-red-500"
  },
  {
    id: 4,
    icon: UserCheck,
    en: "After Touching a Patient",
    ar: "بعد ملامسة المريض",
    descEn: "Clean your hands after touching a patient and his/her immediate surroundings.",
    descAr: "طهر يديك بعد ملامسة المريض ومحيطه المباشر.",
    color: "bg-green-600"
  },
  {
    id: 5,
    icon: Home,
    en: "After Touching Patient Surroundings",
    ar: "بعد ملامسة محيط المريض",
    descEn: "Clean your hands after touching any object or furniture in the patient's area.",
    descAr: "طهر يديك بعد لمس أي جسم أو أثاث في منطقة المريض.",
    color: "bg-indigo-600"
  }
];

export const PPE_DATA: PPEProtocol = {
  donning: [
    { 
      title: '1. Gown (المئزر الواقي)', 
      description: 'Fully cover torso from neck to knees, arms to end of wrists, and wrap around the back.',
      icon: Shirt,
      color: 'bg-blue-500'
    },
    { 
      title: '2. Mask (القناع الطبي)', 
      description: 'Secure ties or elastic bands. Fit flexible band to nose bridge. Fit snug to face and below chin.',
      icon: Shield,
      color: 'bg-emerald-500'
    },
    { 
      title: '3. Eye Protection (حماية العين)', 
      description: 'Place goggles or face shield over eyes and face. Adjust to fit comfortably.',
      icon: Eye,
      color: 'bg-amber-500'
    },
    { 
      title: '4. Gloves (القفازات)', 
      description: 'Extend to cover the wrist of the isolation gown completely.',
      icon: Hand,
      color: 'bg-indigo-500'
    }
  ],
  doffing: [
    { 
      title: '1. Gloves (نزع القفازات)', 
      description: 'Peel off from outside. Slide fingers under remaining glove at wrist to remove.',
      icon: Hand,
      color: 'bg-indigo-500'
    },
    { 
      title: '2. Eye Protection (نزع الحماية)', 
      description: 'Remove goggles or face shield from the back by lifting the headband.',
      icon: Eye,
      color: 'bg-amber-500'
    },
    { 
      title: '3. Gown (نزع المئزر)', 
      description: 'Unfasten ties. Pull away from neck and shoulders, touching inside only.',
      icon: Shirt,
      color: 'bg-blue-500'
    },
    { 
      title: '4. Mask (نزع القناع)', 
      description: 'Grasp bottom ties then top ones. Remove without touching the front.',
      icon: Shield,
      color: 'bg-emerald-500'
    }
  ]
};

export const MODULE_STEPS: Record<string, { en: string, ar: string, descEn: string, descAr: string, img?: string, icon?: LucideIcon, iconColor?: string }[]> = {
  [ModuleId.MDRO_BASICS]: [
    { 
      en: "Identification of MDROs", 
      ar: "التعرف على الميكروبات المقاومة", 
      descEn: "Recognize common resistant bacteria such as MRSA, VRE, and CRE in clinical reports.", 
      descAr: "القدرة على تمييز البكتيريا المقاومة الشائعة مثل MRSA و VRE و CRE في التقارير الطبية.",
      icon: Dna,
      iconColor: "text-red-500"
    },
    { 
      en: "Understanding Transmission", 
      ar: "فهم طرق انتقال العدوى", 
      descEn: "MDROs primarily spread via contaminated hands and shared medical equipment.", 
      descAr: "تنتقل الميكروبات المقاومة بشكل أساسي عبر الأيدي الملوثة والمعدات الطبية المشتركة بين المرضى.",
      icon: Activity,
      iconColor: "text-orange-500"
    },
    { 
      en: "Baseline Prevention", 
      ar: "الوقاية الأساسية", 
      descEn: "Universal hand hygiene and environmental cleaning are the most effective barriers.", 
      descAr: "تعتبر نظافة اليدين الشاملة وتنظيف البيئة المحيطة أكثر الحواجز فعالية ضد انتشار العدوى.",
      icon: ShieldCheck,
      iconColor: "text-blue-500"
    },
    { 
      en: "Case Isolation Protocols", 
      ar: "بروتوكولات عزل الحالات", 
      descEn: "Initiate contact precautions (Gown/Gloves) immediately for colonized patients.", 
      descAr: "تفعيل احتياطات التلامس (المئزر والقفازات) فوراً للمرضى الذين ثبت حملهم للميكروبات المقاومة.",
      icon: ShieldAlert,
      iconColor: "text-red-600"
    },
    { 
      en: "Clinical Documentation", 
      ar: "التوثيق السريري", 
      descEn: "Ensure MDRO status is clearly flagged in the electronic health record (EHR).", 
      descAr: "التأكد من توثيق حالة الإصابة بوضوح في السجل الصحي الإلكتروني لتنبيه جميع الكوادر.",
      icon: FileText,
      iconColor: "text-slate-600"
    }
  ],
  [ModuleId.HAND_HYGIENE]: [
    { 
      en: "Before Patient Contact", 
      ar: "قبل ملامسة المريض", 
      descEn: "Clean hands before touching a patient or their immediate surroundings.", 
      descAr: "نظّف يديك قبل لمس المريض أو محيطه المباشر.",
      icon: UserPlus,
      iconColor: "text-blue-500"
    },
    { 
      en: "Before an Aseptic Task", 
      ar: "قبل إجراء معقم", 
      descEn: "Clean hands immediately before performing any aseptic procedure.", 
      descAr: "نظّف يديك فوراً قبل القيام بأي إجراء معقم.",
      icon: Zap,
      iconColor: "text-amber-500"
    },
    { 
      en: "After Body Fluid Exposure Risk", 
      ar: "بعد خطر التعرض لسوائل الجسم", 
      descEn: "Clean hands immediately after any potential exposure to body fluids.", 
      descAr: "نظّف يديك فوراً بعد أي احتمال للتعرض لسوائل الجسم.",
      icon: Droplets,
      iconColor: "text-red-500"
    },
    { 
      en: "After Patient Contact", 
      ar: "بعد ملامسة المريض", 
      descEn: "Clean hands after touching a patient or their immediate surroundings.", 
      descAr: "نظّف يديك بعد لمس المريض أو محيطه المباشر.",
      icon: UserCheck,
      iconColor: "text-green-500"
    },
    { 
      en: "After Contact with Patient Surroundings", 
      ar: "بعد ملامسة محيط المريض", 
      descEn: "Clean hands after touching any object or furniture in the patient's environment.", 
      descAr: "نظّف يديك بعد لمس أي شيء أو أثاث في بيئة المريض.",
      icon: Home,
      iconColor: "text-indigo-500"
    },
    { 
      en: "Simple Signs", 
      ar: "علامات بسيطة", 
      descEn: "Recognizing simple signs of contamination is key to preventing spread.", 
      descAr: "يعد التعرف على العلامات البسيطة للتلوث أمرًا أساسيًا لمنع الانتشار.",
      icon: Eye,
      iconColor: "text-emerald-500"
    }
  ],
  [ModuleId.VISITOR_EDUCATION]: [
    { 
      en: "Hand Hygiene on Entry", 
      ar: "نظافة اليدين عند الدخول", 
      descEn: "Use alcohol sanitizer immediately before touching anything.", 
      descAr: "استخدم المعقم الكحولي فوراً قبل لمس أي شيء في الغرفة.",
      icon: Droplets,
      iconColor: "text-blue-500"
    },
    { 
      en: "Wear Protective Gown", 
      ar: "ارتداء المئزر الواقي", 
      descEn: "Creates a barrier to prevent bacteria from adhering to your clothes.", 
      descAr: "يخلق حاجزاً يمنع البكتيريا من الالتصاق بملابسك الشخصية.",
      icon: ShieldCheck,
      iconColor: "text-emerald-500"
    },
    { 
      en: "Avoid Patient Bed", 
      ar: "تجنب الجلوس على سرير المريض", 
      descEn: "The bed is the most contaminated area in the room.", 
      descAr: "يعتبر سرير المريض أكثر المناطق تلوثاً بالبكتيريا في الغرفة.",
      icon: AlertCircle,
      iconColor: "text-red-500"
    },
    { 
      en: "Exit Protocol", 
      ar: "بروتوكول الخروج", 
      descEn: "Remove PPE inside the room and wash hands before exiting.", 
      descAr: "انزع الملابس الواقية داخل الغرفة واغسل يديك قبل الخروج.",
      icon: Home,
      iconColor: "text-purple-500"
    }
  ],
  [ModuleId.EQUIPMENT_CLEANING]: [
    { 
      en: "Pre-Cleaning Check", 
      ar: "فحص ما قبل التنظيف", 
      descEn: "Inspect equipment for any visible soil or organic matter.", 
      descAr: "فحص الجهاز للتأكد من خلوه من أي أوساخ أو مواد عضوية مرئية.",
      icon: ClipboardList,
      iconColor: "text-indigo-500"
    },
    { 
      en: "Apply Disinfectant", 
      ar: "تطبيق المطهر", 
      descEn: "Use hospital-approved wipes (70% alcohol or bleach wipes).", 
      descAr: "استخدم المناديل المعتمدة من المستشفى (كحول 70% أو مناديل الكلور).",
      icon: Wand2,
      iconColor: "text-blue-400"
    },
    { 
      en: "Surface Scrubbing", 
      ar: "فرك الأسطح", 
      descEn: "Ensure mechanical friction on all surfaces, especially knobs.", 
      descAr: "التأكد من الفرك الميكانيكي لجميع الأسطح، وخاصة المقابض والأزرار.",
      icon: Hand,
      iconColor: "text-emerald-500"
    },
    { 
      en: "Required Contact Time", 
      ar: "وقت التلامس المطلوب", 
      descEn: "Leave surface wet for the manufacturer's recommended 'Kill Time'.", 
      descAr: "اترك السطح مبللاً للمدة الموصى بها من المصنع لقتل الجراثيم فعلياً.",
      icon: Clock,
      iconColor: "text-orange-500"
    },
    { 
      en: "Safe Storage", 
      ar: "التخزين الآمن", 
      descEn: "Store cleaned equipment in a designated clean area.", 
      descAr: "تخزين الأجهزة النظيفة في منطقة نظيفة مخصصة لذلك.",
      icon: Archive,
      iconColor: "text-indigo-600"
    }
  ],
  [ModuleId.PATIENT_TYPES]: [
    { 
      en: "Verify Isolation Status", 
      ar: "التحقق من حالة العزل", 
      descEn: "Check medical chart and door signage for precaution type.", 
      descAr: "تحقق من الملف الطبي واللوحات الموجودة على الباب لمعرفة نوع الاحتياطات.",
      icon: Search,
      iconColor: "text-blue-500"
    },
    { 
      en: "Apply Correct Signage", 
      ar: "وضع اللوحات الإرشادية الصحيحة", 
      descEn: "Ensure clear visual warnings are posted outside the patient's room.", 
      descAr: "التأكد من وضع تحذيرات مرئية واضحة خارج غرفة المريض للتنبيه.",
      icon: BellRing,
      iconColor: "text-red-500"
    },
    { 
      en: "Dedicated Patient Equipment", 
      ar: "أدوات مخصصة للمريض", 
      descEn: "Use dedicated non-critical equipment only for that patient.", 
      descAr: "استخدم أدوات طبية مخصصة لهذا المريض فقط.",
      icon: Stethoscope,
      iconColor: "text-indigo-500"
    },
    { 
      en: "Patient Transportation", 
      ar: "نقل المريض", 
      descEn: "Limit movement; if necessary, wrap patient in a clean sheet.", 
      descAr: "الحد من الحركة؛ عند الضرورة، قم بتغطية المريض بملاءة نظيفة.",
      icon: Truck,
      iconColor: "text-amber-600"
    },
    { 
      en: "Safe Biohazard Disposal", 
      ar: "التخزين الآمن للنفايات", 
      descEn: "Dispose of all PPE and waste in designated clinical waste bins.", 
      descAr: "تخلص من جميع الملابس الواقية والنفايات في الحاويات الطبية المخصصة.",
      icon: Trash2,
      iconColor: "text-red-700"
    }
  ],
  [ModuleId.PPE_PROTOCOLS]: [
    {
      en: "Donning: Gown",
      ar: "الارتداء: المئزر الواقي",
      descEn: "Select appropriate size and tie all fastenings securely.",
      descAr: "اختر الحجم المناسب واربط جميع الأربطة بإحكام.",
      icon: Shirt,
      iconColor: "text-blue-500"
    },
    {
      en: "Donning: Mask/Respirator",
      ar: "الارتداء: القناع/الكمامة",
      descEn: "Ensure it covers both nose and mouth with a good seal.",
      descAr: "تأكد من أنه يغطي الأنف والفم مع إحكام جيد.",
      icon: Shield,
      iconColor: "text-emerald-500"
    },
    {
      en: "Donning: Goggles/Face Shield",
      ar: "الارتداء: النظارات الواقية/واقي الوجه",
      descEn: "Place over face and eyes and adjust to fit.",
      descAr: "ضعه على الوجه والعينين واضبطه ليلائم.",
      icon: Eye,
      iconColor: "text-amber-500"
    },
    {
      en: "Donning: Gloves",
      ar: "الارتداء: القفازات",
      descEn: "Pull gloves over the cuffs of the gown.",
      descAr: "اسحب القفازات فوق أكمام المئزر.",
      icon: Hand,
      iconColor: "text-indigo-500"
    },
    {
      en: "Doffing: Gloves",
      ar: "الخلع: القفازات",
      descEn: "Grasp outside of one glove and peel off, hold in gloved hand. Slide ungloved finger under the remaining glove and peel off.",
      descAr: "أمسك الجزء الخارجي من أحد القفازات وانزعه، وأمسكه باليد التي لا تزال بها القفاز. مرر الإصبع الخالي من القفاز تحت القفاز المتبقي وانزعه.",
      icon: Hand,
      iconColor: "text-indigo-500"
    },
    {
      en: "Doffing: Gown",
      ar: "الخلع: المئزر الواقي",
      descEn: "Unfasten gown ties, pull away from the body, touching the inside only, and roll into a bundle.",
      descAr: "فك أربطة المئزر، واسحبه بعيدًا عن الجسم، المس الجزء الداخلي فقط، ولفه على شكل حزمة.",
      icon: Shirt,
      iconColor: "text-blue-500"
    },
    {
      en: "Doffing: Goggles/Face Shield",
      ar: "الخلع: النظارات الواقية/واقي الوجه",
      descEn: "Remove from the back by lifting the headband.",
      descAr: "انزعه من الخلف عن طريق رفع طوق الرأس.",
      icon: Eye,
      iconColor: "text-amber-500"
    },
    {
      en: "Doffing: Mask/Respirator",
      ar: "الخلع: القناع/الكمامة",
      descEn: "Untie the bottom, then top, and remove without touching the front.",
      descAr: "فك الرباط السفلي، ثم العلوي، وانزعه دون لمس الجزء الأمامي.",
      icon: Shield,
      iconColor: "text-emerald-500"
    },
    {
      en: "Simple Signs of Failure",
      ar: "علامات الفشل البسيطة",
      descEn: "Visible tears, holes, or saturation of any PPE item indicates a breach.",
      descAr: "التمزقات أو الثقوب أو التشبع المرئي لأي من معدات الوقاية الشخصية يشير إلى حدوث خرق.",
      icon: ShieldAlert,
      iconColor: "text-red-600"
    }
  ]
};