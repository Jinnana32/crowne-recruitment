import type { DemoCatalog } from "@/lib/data/types";

const qualifications = [
  "Relevant work experience in the position.",
  "Ability to follow workplace safety procedures.",
  "Valid passport or willingness to process required travel documents.",
  "Additional qualifications may be assessed during screening.",
];

const responsibilities = [
  "Carry out assigned duties based on the employer's requirements.",
  "Maintain safe and professional working practices.",
  "Coordinate with supervisors and the assigned team.",
];

export function createSeedCatalog(): DemoCatalog {
  return {
    illustrative: true,
    employers: [
      { id: "emp-alnoor", name: "Al Noor Industrial Co.", country: "Qatar", status: "Active", contactName: "Faisal Rahman" },
      { id: "emp-riyadh", name: "Riyadh Care Partners", country: "Saudi Arabia", status: "Active", contactName: "Layla Al Harbi" },
      { id: "emp-gulf", name: "Gulf Build LLC", country: "United Arab Emirates", status: "Active", contactName: "Omar Hassan" },
      { id: "emp-kuwait", name: "Kuwait Hospitality Group", country: "Kuwait", status: "On hold", contactName: "Noura Al Sabah" },
    ],
    jobOrders: [
      { id: "jo-024", reference: "JO-2026-024", title: "Welder", employerId: "emp-alnoor", country: "Qatar", vacancies: 60, status: "Recruiting", channels: ["Website", "WorkAbroad"] },
      { id: "jo-031", reference: "JO-2026-031", title: "Caregiver", employerId: "emp-riyadh", country: "Saudi Arabia", vacancies: 30, status: "Recruiting", channels: ["Website"] },
      { id: "jo-021", reference: "JO-2026-021", title: "Electrician", employerId: "emp-gulf", country: "United Arab Emirates", vacancies: 25, status: "Recruiting", channels: ["Website", "WorkAbroad"] },
      { id: "jo-018", reference: "JO-2026-018", title: "Heavy Equipment Operator", employerId: "emp-alnoor", country: "Saudi Arabia", vacancies: 40, status: "Recruiting", channels: ["Website"] },
      { id: "jo-011", reference: "JO-2026-011", title: "Hotel Staff", employerId: "emp-kuwait", country: "Kuwait", vacancies: 18, status: "On hold", channels: ["Website"] },
      { id: "jo-009", reference: "JO-2026-009", title: "Cook", employerId: "emp-kuwait", country: "Bahrain", vacancies: 8, status: "On hold", channels: ["Website"] },
    ],
    publications: [
      { id: "pub-welder", jobOrderId: "jo-024", title: "Welder", category: "Construction", employmentType: "Full-time", salaryLabel: "QAR 1,800–2,200", description: "Perform welding work according to project specifications, safety procedures, and employer requirements.", qualifications, responsibilities, published: true },
      { id: "pub-caregiver", jobOrderId: "jo-031", title: "Caregiver", category: "Healthcare", employmentType: "Full-time", salaryLabel: "SAR 1,800–2,200", description: "Support daily care for assigned residents and follow the employer's care plan.", qualifications, responsibilities, published: true },
      { id: "pub-electrician", jobOrderId: "jo-021", title: "Electrician", category: "Engineering", employmentType: "Full-time", salaryLabel: "AED 1,600–2,000", description: "Install and maintain electrical systems according to employer and site requirements.", qualifications, responsibilities, published: true },
      { id: "pub-operator", jobOrderId: "jo-018", title: "Heavy Equipment Operator", category: "Construction", employmentType: "Full-time", salaryLabel: "SAR 2,000–2,500", description: "Operate assigned heavy equipment safely on the employer site.", qualifications, responsibilities, published: true },
      { id: "pub-hotel", jobOrderId: "jo-011", title: "Hotel Staff", category: "Hospitality", employmentType: "Full-time", salaryLabel: "KWD 180–220", description: "Support guest services for a hospitality employer.", qualifications, responsibilities, published: true },
      { id: "pub-cook", jobOrderId: "jo-009", title: "Cook", category: "Hospitality", employmentType: "Full-time", salaryLabel: "BHD 180–220", description: "Prepare meals according to the employer kitchen plan. This publication is still a draft.", qualifications, responsibilities, published: false },
    ],
    candidates: [
      { id: "cand-maria", reference: "CND-2026-0281", fullName: "Maria Santos", email: "maria.santos@email.com", status: "Active", source: "Agency portal", mobile: "+63 917 000 0000", dateOfBirth: "1995-06-12", nationality: "Filipino", preferredRole: "Caregiver", experience: "4 years", education: "Caregiving NC II", languages: "English, Filipino", preferredDestination: "Saudi Arabia" },
      { id: "cand-roberto", reference: "CND-2026-0274", fullName: "Roberto Lim", email: "roberto.lim@email.com", status: "Active", source: "WorkAbroad", mobile: "+63 918 000 0001", dateOfBirth: "1992-02-02", nationality: "Filipino", preferredRole: "Electrician", experience: "6 years", education: "Electrical NC II", languages: "English, Filipino", preferredDestination: "United Arab Emirates" },
      { id: "cand-paolo", reference: "CND-2026-0266", fullName: "Paolo Garcia", email: "paolo.garcia@email.com", status: "Active", source: "Walk-in", mobile: "+63 919 000 0002", dateOfBirth: "1990-11-20", nationality: "Filipino", preferredRole: "Welder", experience: "8 years", education: "Vocational", languages: "Filipino", preferredDestination: "Qatar" },
      { id: "cand-jose", reference: "CND-2026-0261", fullName: "Jose Mendoza", email: "jose.mendoza@email.com", status: "Active", source: "Agency portal", mobile: "+63 920 000 0003", dateOfBirth: "1988-04-14", nationality: "Filipino", preferredRole: "Welder", experience: "10 years", education: "Vocational", languages: "English, Filipino", preferredDestination: "Qatar" },
      { id: "cand-liza", reference: "CND-2026-0255", fullName: "Liza Flores", email: "liza.flores@email.com", status: "Active", source: "Referral", mobile: "+63 921 000 0004", dateOfBirth: "1994-09-01", nationality: "Filipino", preferredRole: "Caregiver", experience: "5 years", education: "Caregiving NC II", languages: "English, Filipino", preferredDestination: "Saudi Arabia" },
      { id: "cand-ramon", reference: "CND-2026-0244", fullName: "Ramon Cruz", email: "ramon.cruz@email.com", status: "Active", source: "Agency portal", mobile: "+63 922 000 0005", dateOfBirth: "1987-07-19", nationality: "Filipino", preferredRole: "Welder", experience: "12 years", education: "Vocational", languages: "English, Filipino", preferredDestination: "Qatar" },
      { id: "cand-ana", reference: "CND-2026-0238", fullName: "Ana Bautista", email: "ana.bautista@email.com", status: "Active", source: "WorkAbroad", mobile: "+63 923 000 0006", dateOfBirth: "1993-01-28", nationality: "Filipino", preferredRole: "Electrician", experience: "4 years", education: "Electrical NC II", languages: "English, Filipino", preferredDestination: "United Arab Emirates" },
      { id: "cand-ahmed", reference: "CND-2026-0220", fullName: "Ahmed Hassan", email: "ahmed.hassan@email.com", status: "Active", source: "Agency portal", mobile: "+63 924 000 0007", dateOfBirth: "1991-03-03", nationality: "Filipino", preferredRole: "Welder", experience: "9 years", education: "Vocational", languages: "English, Filipino, Arabic", preferredDestination: "Qatar" },
      { id: "cand-carlo", reference: "CND-2026-0214", fullName: "Carlo Reyes", email: "carlo.reyes@email.com", status: "Active", source: "Agency portal", mobile: "+63 925 000 0008", dateOfBirth: "1996-12-12", nationality: "Filipino", preferredRole: "Caregiver", experience: "3 years", education: "Caregiving NC II", languages: "English, Filipino", preferredDestination: "Kuwait" },
      { id: "cand-mark", reference: "CND-2026-0202", fullName: "Mark Villanueva", email: "mark.villanueva@email.com", status: "For processing", source: "Agency portal", mobile: "+63 926 000 0009", dateOfBirth: "1989-08-08", nationality: "Filipino", preferredRole: "Electrician", experience: "11 years", education: "Electrical NC III", languages: "English, Filipino", preferredDestination: "United Arab Emirates" },
    ],
    applications: [
      { id: "app-1048", reference: "APP-2026-1048", candidateId: "cand-maria", jobOrderId: "jo-031", publicationId: "pub-caregiver", stage: "New application", source: "Agency portal", appliedOn: "2026-11-19", recruiter: "Ana Reyes" },
      { id: "app-0982", reference: "APP-2026-0982", candidateId: "cand-maria", jobOrderId: "jo-024", publicationId: "pub-welder", stage: "Shortlisted", source: "Agency portal", appliedOn: "2026-11-05", recruiter: "John Dela Cruz" },
      { id: "app-1047", reference: "APP-2026-1047", candidateId: "cand-roberto", jobOrderId: "jo-021", publicationId: "pub-electrician", stage: "New application", source: "WorkAbroad", appliedOn: "2026-11-18", recruiter: "Ana Reyes" },
      { id: "app-1042", reference: "APP-2026-1042", candidateId: "cand-paolo", jobOrderId: "jo-024", publicationId: "pub-welder", stage: "New application", source: "Walk-in", appliedOn: "2026-11-17", recruiter: "John Dela Cruz" },
      { id: "app-1039", reference: "APP-2026-1039", candidateId: "cand-jose", jobOrderId: "jo-024", publicationId: "pub-welder", stage: "Screening", source: "Agency portal", appliedOn: "2026-11-16", recruiter: "John Dela Cruz" },
      { id: "app-1037", reference: "APP-2026-1037", candidateId: "cand-liza", jobOrderId: "jo-031", publicationId: "pub-caregiver", stage: "Screening", source: "Referral", appliedOn: "2026-11-15", recruiter: "Ana Reyes" },
      { id: "app-1028", reference: "APP-2026-1028", candidateId: "cand-ramon", jobOrderId: "jo-024", publicationId: "pub-welder", stage: "Shortlisted", source: "Agency portal", appliedOn: "2026-11-14", recruiter: "John Dela Cruz" },
      { id: "app-1025", reference: "APP-2026-1025", candidateId: "cand-ana", jobOrderId: "jo-021", publicationId: "pub-electrician", stage: "Shortlisted", source: "WorkAbroad", appliedOn: "2026-11-13", recruiter: "Ana Reyes" },
      { id: "app-1018", reference: "APP-2026-1018", candidateId: "cand-ahmed", jobOrderId: "jo-024", publicationId: "pub-welder", stage: "Employer review", source: "Agency portal", appliedOn: "2026-11-12", recruiter: "John Dela Cruz" },
      { id: "app-1016", reference: "APP-2026-1016", candidateId: "cand-carlo", jobOrderId: "jo-031", publicationId: "pub-caregiver", stage: "Employer review", source: "Agency portal", appliedOn: "2026-11-11", recruiter: "Ana Reyes" },
      { id: "app-1009", reference: "APP-2026-1009", candidateId: "cand-mark", jobOrderId: "jo-021", publicationId: "pub-electrician", stage: "Selected", source: "Agency portal", appliedOn: "2026-11-10", recruiter: "Ana Reyes" },
    ],
    processing: [
      {
        id: "prc-0188",
        reference: "PRC-2026-0188",
        applicationId: "app-1009",
        nextAction: "Contract signing",
        status: "In progress",
        checklist: [
          { label: "Passport verification", state: "Done" },
          { label: "Police clearance", state: "Done" },
          { label: "Medical examination", state: "Passed" },
          { label: "Employment contract", state: "Pending" },
          { label: "Pre-departure orientation", state: "Pending" },
        ],
      },
    ],
    deployments: [],
    transactions: [
      { id: "trx-0812", reference: "TRX-2026-0812", description: "Employer payment", relatedRecord: "Al Noor Industrial · JO-024", recordedOn: "2026-11-19", amountDecimal: "180000.00", currency: "PHP", status: "Posted", kind: "income" },
      { id: "trx-0811", reference: "TRX-2026-0811", description: "Medical examination", relatedRecord: "Mark Villanueva · PRC-2026-0188", recordedOn: "2026-11-19", amountDecimal: "4500.00", currency: "PHP", status: "Approved", kind: "expense" },
      { id: "trx-0809", reference: "TRX-2026-0809", description: "Office supplies", relatedRecord: "General operations", recordedOn: "2026-11-18", amountDecimal: "3250.00", currency: "PHP", status: "For review", kind: "expense" },
    ],
    documents: [
      { id: "doc-cv", candidateId: "cand-maria", name: "Resume / CV", requestId: null, originalFilename: null, mimeType: null, sizeBytes: null, hasFile: false, uploadedAt: "2026-11-10T09:00:00.000Z", status: "Verified", sensitivity: "standard" },
      { id: "doc-passport", candidateId: "cand-maria", name: "Passport", requestId: "req-passport", originalFilename: null, mimeType: null, sizeBytes: null, hasFile: false, uploadedAt: "2026-11-12T09:00:00.000Z", status: "For review", sensitivity: "standard" },
      { id: "doc-training", candidateId: "cand-maria", name: "Training Certificate", requestId: null, originalFilename: null, mimeType: null, sizeBytes: null, hasFile: false, uploadedAt: "2026-11-12T10:00:00.000Z", status: "Verified", sensitivity: "standard" },
    ],
    documentRequests: [
      { id: "req-passport", candidateId: "cand-maria", name: "Passport", description: "Illustrative request for the demo.", sensitivity: "standard", requestedAt: "2026-11-11T09:00:00.000Z" },
    ],
    workExperience: [],
    education: [],
  };
}
