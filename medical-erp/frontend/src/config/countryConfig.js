export const COUNTRIES = {
  PE: { label: 'Peru', flag: '🇵🇪' },
  US: { label: 'USA', flag: '🇺🇸' },
};

export const COUNTRY_CONFIG = {
  PE: {
    documentTypes: [
      { code: 'DNI', label: 'DNI', maxLength: 8, pattern: /^\d{8}$/, placeholder: '12345678' },
      { code: 'CE', label: 'Carnet de Extranjeria', maxLength: 12, pattern: /^[a-zA-Z0-9]+$/, placeholder: '123456789012' },
      { code: 'PASSPORT', label: 'Pasaporte', maxLength: 20, pattern: /^[a-zA-Z0-9]+$/, placeholder: 'AB123456' },
      { code: 'SIN_DOC', label: 'Sin documento', maxLength: 0, pattern: null, placeholder: '' },
    ],
    defaultDocType: 'DNI',
    insurance: false,
    consent: { required: false, types: [] },
    genderOptions: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' },
    ],
    civilStatusOptions: [
      { value: 'Soltero(a)', label: 'Soltero(a)' },
      { value: 'Casado(a)', label: 'Casado(a)' },
      { value: 'Divorciado(a)', label: 'Divorciado(a)' },
      { value: 'Viudo(a)', label: 'Viudo(a)' },
      { value: 'Conviviente', label: 'Conviviente' },
    ],
  },
  US: {
    documentTypes: [
      { code: 'SSN', label: 'Social Security (SSN)', maxLength: 11, pattern: /^\d{3}-?\d{2}-?\d{4}$/, placeholder: '123-45-6789' },
      { code: 'ITIN', label: 'ITIN', maxLength: 10, pattern: /^\d{2}-?\d{7}$/, placeholder: '12-3456789' },
      { code: 'DL', label: "Driver's License", maxLength: 20, pattern: /^[a-zA-Z0-9]+$/, placeholder: 'D1234567' },
      { code: 'PASSPORT', label: 'Passport', maxLength: 20, pattern: /^[a-zA-Z0-9]+$/, placeholder: 'C12345678' },
      { code: 'INSURANCE_CARD', label: 'Insurance Card', maxLength: 20, pattern: /^[a-zA-Z0-9]+$/, placeholder: 'ABC123456789' },
      { code: 'SIN_DOC', label: 'No document', maxLength: 0, pattern: null, placeholder: '' },
    ],
    defaultDocType: 'SSN',
    insurance: true,
    insuranceTypes: ['PRINCIPAL', 'SECUNDARIO', 'SUPLEMENTARIO'],
    consent: {
      required: true,
      types: [
        { code: 'TRATAMIENTO', label: 'Consentimiento de Tratamiento' },
        { code: 'PRIVACIDAD', label: 'Aviso de Privacidad (HIPAA)' },
        { code: 'INFORMADO', label: 'Consentimiento Informado' },
      ],
    },
    genderOptions: [
      { value: 'M', label: 'Male' },
      { value: 'F', label: 'Female' },
      { value: 'Otro', label: 'Other' },
    ],
    civilStatusOptions: [
      { value: 'Single', label: 'Single' },
      { value: 'Married', label: 'Married' },
      { value: 'Divorced', label: 'Divorced' },
      { value: 'Widowed', label: 'Widowed' },
      { value: 'Domestic Partner', label: 'Domestic Partner' },
    ],
  },
};

export function getCountryConfig(pais) {
  return COUNTRY_CONFIG[pais] || COUNTRY_CONFIG.PE;
}

export function getDocTypeConfig(pais, codigo) {
  const config = getCountryConfig(pais);
  return config.documentTypes.find((d) => d.code === codigo);
}

export function getDefaultPais() {
  return 'PE';
}
