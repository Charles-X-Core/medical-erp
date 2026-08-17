// ============================================
// Attention Types Configuration
// Maps to paper form sections
// ============================================

export const ATTENTION_TYPES = [
  {
    id: 'primera_consulta',
    label: 'Primera Consulta',
    description: 'Paciente nuevo — historia, diagnóstico y plan',
    fields: {
      vitalSigns: ['peso', 'estatura', 'presionArterial', 'temperatura', 'pulso'],
      sections: ['motivoConsulta', 'tiempoEnfermedad', 'signosSintomas', 'examenClinico', 'diagnostico', 'planTratamiento'],
    },
  },
  {
    id: 'continuar_tratamiento',
    label: 'Continuar Tratamiento',
    description: 'Paciente con tratamiento activo — sesión',
    fields: {
      vitalSigns: ['peso', 'estatura', 'presionArterial', 'temperatura'],
      sections: ['sesionTratamiento', 'procedimiento', 'evolucion'],
    },
  },
  {
    id: 'control',
    label: 'Control',
    description: 'Tratamiento finalizado — seguimiento',
    fields: {
      vitalSigns: ['peso', 'estatura', 'presionArterial', 'temperatura', 'pulso'],
      sections: ['motivoControl', 'evolucion', 'observaciones'],
    },
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    description: 'Paciente sin tratamiento activo — nueva consulta',
    fields: {
      vitalSigns: ['peso', 'estatura', 'presionArterial', 'temperatura', 'pulso'],
      sections: ['motivoConsulta', 'evolucion', 'observaciones'],
    },
  },
];

export const getAttentionTypeById = (id) => ATTENTION_TYPES.find((t) => t.id === id);

// ============================================
// Treatment Categories (22 treatments from Optimal Health NOW)
// ============================================

export const TREATMENT_CATEGORIES = [
  {
    id: 'regenerativa_celular',
    label: 'Medicina Regenerativa Celular',
    treatments: [
      { id: 'PRISTINE', label: 'Pristine Autologous Regenerative Cells' },
      { id: 'VICELL', label: 'Vicell Regenerative Cells' },
      { id: 'EXOSOMES', label: 'Exosomes' },
      { id: 'ESC', label: 'Embryonic Regenerative Cells' },
      { id: 'MSC', label: 'Mesenchymal Regenerative Cells' },
      { id: 'PLURIPOTENT', label: 'Pluripotent Regenerative Cells' },
      { id: 'PRP', label: 'Platelet-Rich Plasma (PRP)' },
      { id: 'OXYVIT', label: 'Oxygenation & Vitaminization Therapy' },
    ],
  },
  {
    id: 'estetica_celular',
    label: 'Medicina Estética Celular',
    treatments: [
      { id: 'FACIAL', label: 'Facial Rejuvenation' },
      { id: 'HAIR', label: 'Hair Regeneration' },
      { id: 'ORTHOPEDIC', label: 'Regenerative Medicine & Orthopedics' },
      { id: 'WOUND', label: 'Wound & Ulcer Healing' },
      { id: 'PLACENTAL', label: 'Placental Cell Therapy' },
      { id: 'DERMAL', label: 'Rejuvenation Dermal Fillers with Cells' },
    ],
  },
  {
    id: 'regenerativa_iv',
    label: 'Medicina Regenerativa Intravenosa',
    treatments: [
      { id: 'NAD', label: 'NAD Plus Cellular Rejuvenation' },
      { id: 'GLUT', label: 'Glutathione - Immune System Booster' },
      { id: 'MYERS', label: 'Myers Cocktail - Nutritional Therapy' },
      { id: 'DETOX', label: 'Detoxification Therapy' },
      { id: 'VITC', label: 'Vitamin C - Ascorbic Acid Therapy' },
      { id: 'BONE', label: 'Osteopenia & Bone Fracture Therapy' },
    ],
  },
  {
    id: 'hormonal_biodentica',
    label: 'Medicina Hormonal Biodéntica',
    treatments: [
      { id: 'HORM_M', label: "Men's Hormone Pellets" },
      { id: 'HORM_W', label: "Women's Hormone Pellets" },
    ],
  },
];

export const getAllTreatments = () =>
  TREATMENT_CATEGORIES.flatMap((cat) =>
    cat.treatments.map((t) => ({ ...t, category: cat.label }))
  );

export const getTreatmentById = (id) =>
  getAllTreatments().find((t) => t.id === id);

export const getTreatmentLabel = (id) => {
  if (!id) return 'Tratamiento';
  const treatment = getTreatmentById(id);
  return treatment?.label || id;
};

export const getCategoryLabel = (id) => {
  if (!id) return '';
  const cat = TREATMENT_CATEGORIES.find((c) => c.id === id);
  return cat?.label || '';
};
