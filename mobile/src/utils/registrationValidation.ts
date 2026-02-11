import { z } from 'zod'

/**
 * Registration Form Validation Schemas
 * Based on mobile-next implementation
 */

export const registrationSchema = z.object({
  // Personal Details
  phone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Invalid SA phone number'),
  alternatePhone: z.string().regex(/^(\+27|0)[0-9]{9}$/).optional().or(z.literal('')),
  idNumber: z.string().optional().or(z.literal('')),
  passportNumber: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  nationality: z.string().min(1, 'Nationality is required'),

  // Address
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional().or(z.literal('')),
  suburb: z.string().min(2, 'Suburb is required'),
  city: z.string().min(2, 'City is required'),
  province: z.enum([
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape'
  ]),
  postalCode: z.string().regex(/^[0-9]{4}$/, 'Must be 4 digits'),

  // Work Details
  languages: z.array(z.string()).min(1, 'Select at least one language'),

  // Banking Details (Optional)
  bankName: z.string().optional().or(z.literal('')),
  accountNumber: z.string().optional().or(z.literal('')),
  accountHolder: z.string().optional().or(z.literal('')),
  branchCode: z.string().optional().or(z.literal('')),

  // Emergency Contact
  emergencyName: z.string().min(2, 'Emergency contact name is required'),
  emergencyRelation: z.string().min(2, 'Relationship is required'),
  emergencyPhone: z.string().regex(/^(\+27|0)[0-9]{9}$/, 'Invalid SA phone number'),

  // Optional Documents
  idDocumentUrl: z.string().url().optional().or(z.literal('')),
  passportPhotoUrl: z.string().url().optional().or(z.literal('')),
  proofOfResidenceUrl: z.string().url().optional().or(z.literal('')),
  bankStatementUrl: z.string().url().optional().or(z.literal('')),
  criminalRecordUrl: z.string().url().optional().or(z.literal('')),
  referenceLetterUrl: z.string().url().optional().or(z.literal('')),
}).refine((data) => {
  // Either ID number or passport number must be provided
  const hasIdNumber = data.idNumber && data.idNumber.trim() !== ''
  const hasPassportNumber = data.passportNumber && data.passportNumber.trim() !== ''

  if (!hasIdNumber && !hasPassportNumber) return false
  if (hasIdNumber && !/^[0-9]{13}$/.test(data.idNumber!)) return false

  return true
}, {
  message: 'Either a valid 13-digit ID number or passport number is required',
  path: ['idNumber']
})

export type RegistrationFormData = z.infer<typeof registrationSchema>

/**
 * Available languages for selection
 */
export const LANGUAGES = [
  'English',
  'Afrikaans',
  'isiZulu',
  'isiXhosa',
  'Sesotho',
  'Setswana',
  'Sepedi',
  'isiSwati',
  'Tshivenda',
  'Xitsonga',
  'isiNdebele'
]

/**
 * South African provinces
 */
export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape'
]

/**
 * Nationalities - Comprehensive list
 */
export const NATIONALITIES = [
  'South African',
  // Southern Africa
  'Angolan',
  'Botswanan',
  'Lesotho',
  'Malawian',
  'Mozambican',
  'Namibian',
  'Swazi',
  'Zambian',
  'Zimbabwean',
  // East Africa
  'Burundian',
  'Comoran',
  'Congolese (DRC)',
  'Djiboutian',
  'Eritrean',
  'Ethiopian',
  'Kenyan',
  'Malagasy',
  'Mauritian',
  'Rwandan',
  'Seychellois',
  'Somali',
  'South Sudanese',
  'Sudanese',
  'Tanzanian',
  'Ugandan',
  // West Africa
  'Beninese',
  'Burkinabe',
  'Cape Verdean',
  'Gambian',
  'Ghanaian',
  'Guinean',
  'Guinean (Bissau)',
  'Ivorian',
  'Liberian',
  'Malian',
  'Mauritanian',
  'Nigerian',
  'Nigerien',
  'Senegalese',
  'Sierra Leonean',
  'Togolese',
  // Central Africa
  'Cameroonian',
  'Central African',
  'Chadian',
  'Congolese (Republic)',
  'Equatorial Guinean',
  'Gabonese',
  'Santomean',
  // North Africa
  'Algerian',
  'Egyptian',
  'Libyan',
  'Moroccan',
  'Tunisian',
  // Asia
  'Afghan',
  'Bangladeshi',
  'Chinese',
  'Indian',
  'Indonesian',
  'Pakistani',
  'Filipino',
  'Vietnamese',
  'Thai',
  'Malaysian',
  'Singaporean',
  'Japanese',
  'South Korean',
  'North Korean',
  'Nepalese',
  'Sri Lankan',
  'Burmese',
  'Cambodian',
  'Laotian',
  // Middle East
  'Saudi Arabian',
  'Emirati',
  'Iranian',
  'Iraqi',
  'Israeli',
  'Jordanian',
  'Kuwaiti',
  'Lebanese',
  'Omani',
  'Palestinian',
  'Qatari',
  'Syrian',
  'Turkish',
  'Yemeni',
  // Europe
  'Albanian',
  'Austrian',
  'Belgian',
  'British',
  'Bulgarian',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'Estonian',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Hungarian',
  'Irish',
  'Italian',
  'Latvian',
  'Lithuanian',
  'Norwegian',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Serbian',
  'Slovak',
  'Slovenian',
  'Spanish',
  'Swedish',
  'Swiss',
  'Ukrainian',
  // Americas
  'American',
  'Argentine',
  'Brazilian',
  'Canadian',
  'Chilean',
  'Colombian',
  'Cuban',
  'Dominican',
  'Ecuadorian',
  'Mexican',
  'Peruvian',
  'Venezuelan',
  // Oceania
  'Australian',
  'New Zealander',
  'Fijian',
  'Papua New Guinean',
  // Other
  'Other'
]

/**
 * Document types
 */
export const DOCUMENT_TYPES = [
  { key: 'idDocumentUrl', label: 'Identity Document / Passport', type: 'ID_DOCUMENT' },
  { key: 'passportPhotoUrl', label: 'Passport Photo', type: 'PHOTO' },
  { key: 'proofOfResidenceUrl', label: 'Proof of Residence', type: 'PROOF_OF_ADDRESS' },
  { key: 'bankStatementUrl', label: 'Bank Statement', type: 'BANK_STATEMENT' },
  { key: 'criminalRecordUrl', label: 'Criminal Record Check', type: 'POLICE_CLEARANCE' },
  { key: 'referenceLetterUrl', label: 'Reference Letter', type: 'OTHER' }
]
