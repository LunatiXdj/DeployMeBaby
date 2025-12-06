
export type UserRole = 'admin' | 'user';

export interface CompanySettings {
    zip: any;
    city: any;
    companyAddress: any;
    companyZip: any;
    companyCity: any;
    companyPhone: any;
    companyEmail: any;
    ceo: any;
    commercialRegister: any;
    id?: 'main'; // Singleton document
    companyName: string;
    ownerName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
    vatId: string;
    bankName: string;
    iban: string;
    bic: string;
    logoUrl: string;
}

export interface ContactLogEntry {
    id: string;
    date: string; // ISO String
    type: 'Telefonat' | 'E-Mail' | 'Besuch' | 'Sonstiges';
    notes: string;
    userName: string;
}

export interface Customer {
    city: any;
    zip: any;
    id: string;
    salutation: 'Herr' | 'Frau' | 'Firma';
    name: string;
    address: string;
    phone: string;
    mobilePhone?: string;
    email: string;
    website?: string;
    socialMediaLink?: string;
    isPrivate: boolean;
    usePaypal: boolean;
    billingInfo?: string;
    contactPerson: string;
    notes: string;
    projectIds: string[];
    openBalance: number;
    dunningLevel: number;
    dunningLevelReached: boolean; // Has the customer ever reached the highest dunning level?
    status: 'active' | 'completed' | 'Kundenportal NEU';
    lastContactType?: 'Telefonisch' | 'E-Mail' | 'Persönlich' | 'Sonstiges';
    lastContactDate?: string | null;
    contactLog?: ContactLogEntry[];
    createdAt?: any;
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string;
    address: string;
    phone: string;
    email: string;
    website?: string;

    // New fields requested by user
    companyName?: string;
    legalForm?: string;
    commercialRegister?: string;
    taxNumber?: string;
    vatId?: string;
    internalSalesContact?: string;
    fieldSalesContact?: string;
    isSpecialistDealer?: boolean;
}

export interface Article {
    id: string;
    articleNumber: string;
    name: string;
    group: string;
    grossSalesPrice: number; // Renamed from price
    grossPurchasePrice: number; // Renamed from purchasePrice
    includedTax?: number; // VAT portion included in grossPurchasePrice (e.g., 19%)
    netPurchasePrice?: number; // grossPurchasePrice / 1.19
    netSalesPrice?: number;
    supplierId?: string;
    margin?: number; // Marge in %
    bhr?: number; // Bruttohandelsresultat in Euro
    bhrPercentage?: number; // Bruttohandelsresultat in %
    status?: 'Aktiv' | 'Sonderpreis';
    calculationState?: 'good' | 'medium' | 'bad'; // color indication
    unit: 'Stk' | 'Stunden' | 'Meter' | 'Pauschal';
    description: string;
    longText?: string;
    procurementLink?: string;
    imageUrl?: string | null;
    stock?: number;
    category?: string;
    createdAt?: string;
    validFrom?: string; // gültig Ab
    type?: 'article' | 'group'; // New: type of article, default is 'article'
    // New: for type 'group', specifies which articles it contains
    containsArticles?: { articleId: string; quantity: number }[];
}

export interface PlannedEvent {
    id: string;
    title: string;
    start: string;
    end: string;
}

export interface Project {
    id: string;
    projectName: string;
    projectNumber: string;
    customerId: string;
    status: 'offen' | 'Planung' | 'Aktiv' | 'Restarbeiten' | 'Abgeschlossen' | 'on-hold' | 'Kundenportal NEU' | 'Administrativ';
    startDate: string | null;
    endDate: string | null;
    plannedEvents?: PlannedEvent[];
    createdAt?: any;
}

export interface Tool {
    id: string;
    name: string;
    purchasePrice: number;
    status: 'active' | 'defective';
    notes?: string;
    createdAt?: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    address: string;
    zipCode: string;
    city: string;
    birthDate: string;
    phone: string;
    mobile?: string;
    hasDriversLicense: boolean;
    licenseClasses?: string;
    bankName: string;
    iban: string;
    bic: string;
    hourlyRate: number;
    taxId: string;
    socialSecurityNumber: string;
    healthInsuranceNumber: string;
    photoUrl?: string;
    contractUrl?: string;
    documentUrls?: string[];
    createdAt?: string;
}

export interface DocumentItem {
    articleId: string;
    description: string;
    longText?: string;
    setName?: string; // optional Positionsgruppe/Set
    groupId?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    source?: 'quote' | 'material' | 'manual';
}

interface DocumentBase {
    id: string;
    projectId: string;
    date: string;
    items: DocumentItem[];
    totalAmount: number;
    createdAt?: any;
}

export interface Quote extends DocumentBase {
    quoteNumber: string;
    status: 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';
    customer: { id: string; name: string, address: string, salutation: 'Herr' | 'Frau' | 'Firma'; email: string; } | null;
    project: Project | null;
    signatureUrl?: string;
}

export interface Invoice extends DocumentBase {
    invoiceNumber: string;
    dueDate: string;
    status: 'offen' | 'paid' | 'overdue';
    quoteId?: string;
    includeMaterials?: boolean;
    customer?: {
        zip: any;
        city: any; id: string; name: string, address: string, salutation: 'Herr' | 'Frau' | 'Firma'; email: string;
    } | null;
    project?: Project | null;
}

export interface PressureTestProtocol {
    kunde: string;
    pruefgas: string;
    anlagendruck: string;
    pruefdruck: string;
    beginn: string;
    pruefzeit: string;
    druckschwankung: string;
    temperaturausgleich: boolean;
    pumpe: string;
    zielvakuum: string;
    haltezeit: string;
    result: string;
    leckageOrt: string;
    behoben: boolean;
    datum: string;
    unterschrift: string;
}

export interface TimeSheetProtocol {
    employeeId: string;
    startTime: string;
    endTime: string;
    pauseTime: string; // in minutes
    activities: string;
}

export interface ProblemReportProtocol {
    problemDescription: string;
    proposedSolution: string;
    responsiblePerson: string;
}

export interface MaterialRequestItem {
    id: string;
    description: string;
    quantity: string; // Keep as string for easier form handling
    price: string;    // Keep as string for easier form handling
}

export interface MaterialRequestProtocol {
    items: MaterialRequestItem[];
    deliveryDate: string;
    notes: string;
}

export interface MaterialOrderItem {
    id: string;
    description: string;
    quantity: string;
    price: string;
}

export interface MaterialOrder {
    id: string;
    projectId: string;
    employeeId: string;
    items: MaterialOrderItem[];
    status: 'draft' | 'submitted' | 'ordered';
    createdAt?: string;
    submittedAt?: string;
}


export interface FinalAcceptanceProtocol {
    customerName: string;
    acceptanceDate: string;
    workDescription: string;
    defects: string;
    customerSignature: string;
    contractorSignature: string;
}


export interface SiteLog {
    id: string;
    projectId: string;
    date: string; // Datum des Eintrags
    type: 'standard' | 'druckpruefung' | 'stundenzettel' | 'problemerfassung' | 'materialbedarf' | 'endabnahme';
    description: string; // Beschreibung der durchgeführten Arbeiten (was vorher dailyReport war)
    materials: string; // Verwendete Materialien
    problems: string; // Aufgetretene Probleme
    imageUrls: string[]; // URLs der hochgeladenen Bilder (bis zu 30)
    protocolData?: Partial<PressureTestProtocol> | Partial<TimeSheetProtocol> | Partial<ProblemReportProtocol> | Partial<MaterialRequestProtocol> | Partial<FinalAcceptanceProtocol>;
    cost?: number; // For timesheets
    employeeId?: string; // For timesheets
    createdAt?: string; // Erstellungsdatum
    updatedAt?: string; // Datum der letzten Aktualisierung
}

export interface MaterialConsumption {
    id: string;
    projectId: string;
    articleId: string;
    quantity: number;
    date: string;
    createdAt?: string;
}

export interface TimeEntry {
    id: string;
    projectId: string;
    employeeId: string; // Added employeeId
    date: string;
    startTime: string;
    endTime: string;
    pauseTime: number; // in minutes
    activities: string;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    | 'Umsatzerlöse'
    | 'Materialkosten'
    | 'Personalkosten'
    | 'Fahrzeugkosten'
    | 'Miete'
    | 'Versicherungen'
    | 'Bürobedarf'
    | 'Marketing'
    | 'Steuern'
    | 'Sonstige Ausgaben'
    | 'Privateinlage'
    | 'Privatentnahme';


export interface Transaction {
    id: string;
    date: string; // YYYY-MM-DD
    type: TransactionType;
    description: string;
    amount: number; // Gross amount
    netAmount?: number;
    vatAmount?: number;
    taxRate?: 19 | 7 | 0;
    category: TransactionCategory;
    projectId?: string | null;
    receiptUrl?: string | null;
    createdAt: any; // Firestore Timestamp
}

export type ReferenceCategory = 'Bad-Umbauten (Wanne zu Dusche, Dusche zu Dusche)' | 'Hausmeisterdienste' | 'Objektpflege & Betreuung' | 'Montageservices';

export interface Reference {
    id: string;
    imageUrl: string;
    title: string;
    text: string;
    category: ReferenceCategory;
    imageScale: 'cover' | 'contain';
}
