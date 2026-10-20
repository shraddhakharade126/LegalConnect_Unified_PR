import bcrypt from 'bcryptjs';
import { DataStore, persistToDisk } from './models/store.ts';
import { connectDB } from './config/db.ts';

export async function seedDatabase(): Promise<void> {
  console.log('Synchronizing LegalConnect platform records...');

  // Common password hashes
  const salt = await bcrypt.genSalt(10);
  const adminPassHash = await bcrypt.hash('AdminPass123!', salt);
  const lawyerPassHash = await bcrypt.hash('LawyerPass123!', salt);
  const clientPassHash = await bcrypt.hash('ClientPass123!', salt);

  // 1. Seed Legal Domains / Practice Categories (if none exist)
  const existingDomains = await DataStore.getAllDomains();
  if (!existingDomains || existingDomains.length === 0) {
    const categories = [
      {
        name: 'Corporate & Commercial',
        slug: 'corporate-commercial',
        description: 'Business formation, contracts, M&A, regulatory compliance, and corporate governance.',
        icon: 'Briefcase',
        isPopular: true,
      },
      {
        name: 'Intellectual Property',
        slug: 'intellectual-property',
        description: 'Patents, trademarks, copyrights, trade secrets, and software licensing agreements.',
        icon: 'ShieldCheck',
        isPopular: true,
      },
      {
        name: 'Criminal Defense',
        slug: 'criminal-defense',
        description: 'White-collar investigations, bail applications, appeals, and courtroom representation.',
        icon: 'Scale',
        isPopular: true,
      },
      {
        name: 'Family & Matrimonial',
        slug: 'family-matrimonial',
        description: 'Divorce, child custody, marital agreements, probate, and domestic disputes.',
        icon: 'Users',
        isPopular: true,
      },
      {
        name: 'Real Estate & Property',
        slug: 'real-estate-property',
        description: 'Title deeds, land acquisition, lease agreements, tenancy conflicts, and zoning laws.',
        icon: 'Building',
        isPopular: true,
      },
      {
        name: 'Labor & Employment',
        slug: 'labor-employment',
        description: 'Workplace contracts, wrongful termination, severance negotiations, and labor compliance.',
        icon: 'FileText',
        isPopular: false,
      },
      {
        name: 'Cyber & Technology Law',
        slug: 'cyber-technology',
        description: 'Data privacy regulations, GDPR compliance, cyber fraud, and digital contracts.',
        icon: 'Cpu',
        isPopular: true,
      },
      {
        name: 'Taxation & Wealth Planning',
        slug: 'taxation-wealth',
        description: 'Direct & indirect taxes, corporate restructuring, estate planning, and tax appeals.',
        icon: 'DollarSign',
        isPopular: false,
      },
    ];

    for (const cat of categories) {
      await DataStore.createDomain(cat);
    }
  }

  // 2. Seed Platform Administrator
  const existingAdmin = await DataStore.findUserByEmail('admin@legalconnect.com');
  if (!existingAdmin) {
    await DataStore.createUser({
      name: 'Platform Administrator',
      email: 'admin@legalconnect.com',
      passwordHash: adminPassHash,
      role: 'admin',
      phone: '+1 (555) 019-2834',
      city: 'New York',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });
  }

  // 3. Seed Verified Client Accounts
  const clientSeeds = [
    {
      name: 'Sarah Jenkins (Verified Client)',
      email: 'client@legalconnect.com',
      phone: '+1 (555) 234-5678',
      city: 'San Francisco',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Jenkins',
      email: 'client.sarah@example.com',
      phone: '+1 (555) 234-5678',
      city: 'San Francisco',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Shraddha Kharade (Client)',
      email: 'shrddhkharade@gmail.com',
      phone: '+1 (555) 882-9102',
      city: 'San Francisco',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const c of clientSeeds) {
    const existing = await DataStore.findUserByEmail(c.email);
    if (!existing) {
      await DataStore.createUser({
        name: c.name,
        email: c.email,
        passwordHash: clientPassHash,
        role: 'client',
        phone: c.phone,
        city: c.city,
        avatar: c.avatar,
      });
    }
  }

  // 4. Seed Verified Legal Practitioners (8 diverse advocates across major domains)
  const lawyerSeeds = [
    {
      user: {
        name: 'Adv. Rajesh Sharma',
        email: 'rajesh.lawyer@example.com',
        phone: '+1 (555) 456-7890',
        city: 'New York',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'NY-BAR-2008-84910',
        barCouncilState: 'New York',
        yearOfAdmission: 2008,
        verificationStatus: 'approved',
        verificationNotes: 'State Bar Registry credentials verified in good standing.',
        verificationDocuments: [
          {
            title: 'State Bar of New York Certificate of Good Standing',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Corporate & Commercial', 'Taxation & Wealth Planning', 'M&A Advisory'],
        primaryDomain: 'Corporate & Commercial',
        bio: 'Senior partner with over 16 years advising high-growth tech ventures, corporate structuring, seed-to-IPO fundraising, and international commercial arbitration.',
        education: 'LL.M. Columbia Law School; B.A. LL.B. NLSIU',
        experienceYears: 16,
        consultationFee: 180,
        consultationDurationMinutes: 45,
        officeAddress: 'Rockefeller Center, 45 Rockefeller Plaza, New York, NY 10111',
        city: 'New York',
        state: 'NY',
        languages: ['English', 'Hindi'],
        courtAdmissions: ['New York Supreme Court', 'U.S. District Court SDNY'],
        rating: 4.9,
        reviewCount: 38,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Elena Rostova',
        email: 'elena.lawyer@example.com',
        phone: '+1 (555) 567-8901',
        city: 'San Francisco',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'CA-BAR-2012-49201',
        barCouncilState: 'California',
        yearOfAdmission: 2012,
        verificationStatus: 'approved',
        verificationNotes: 'Credentialed by California State Bar and USPTO.',
        verificationDocuments: [
          {
            title: 'California State Bar Certificate & USPTO Registration',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Intellectual Property', 'Cyber & Technology Law', 'Software Licensing'],
        primaryDomain: 'Intellectual Property',
        bio: 'Specialist IP counsel representing technology innovators in trademark defense, patent prosecution, open-source licensing, and AI copyright protection.',
        education: 'J.D. UC Berkeley School of Law; B.S. Stanford University',
        experienceYears: 12,
        consultationFee: 210,
        consultationDurationMinutes: 45,
        officeAddress: '555 California Street, Suite 3200, San Francisco, CA 94104',
        city: 'San Francisco',
        state: 'CA',
        languages: ['English', 'Spanish'],
        courtAdmissions: ['California Supreme Court', 'USPTO Bar'],
        rating: 5.0,
        reviewCount: 42,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Marcus Vance',
        email: 'marcus.lawyer@example.com',
        phone: '+1 (555) 678-9012',
        city: 'Chicago',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'IL-BAR-2004-11823',
        barCouncilState: 'Illinois',
        yearOfAdmission: 2004,
        verificationStatus: 'approved',
        verificationNotes: 'Verified bar standing with Supreme Court of Illinois.',
        verificationDocuments: [
          {
            title: 'Illinois Supreme Court License to Practice Law',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Criminal Defense', 'White Collar Defense', 'Appellate Advocacy'],
        primaryDomain: 'Criminal Defense',
        bio: 'Seasoned trial advocate with 20 years defending clients in complex regulatory investigations, corporate fraud defense, and state/federal trials.',
        education: 'J.D. Northwestern Pritzker School of Law',
        experienceYears: 20,
        consultationFee: 195,
        consultationDurationMinutes: 45,
        officeAddress: 'One Prudential Plaza, 130 E Randolph St, Chicago, IL 60601',
        city: 'Chicago',
        state: 'IL',
        languages: ['English'],
        courtAdmissions: ['Illinois Supreme Court', 'U.S. 7th Circuit Court of Appeals'],
        rating: 4.8,
        reviewCount: 29,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Maya Lin',
        email: 'maya.lawyer@example.com',
        phone: '+1 (555) 789-0123',
        city: 'Seattle',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'WA-BAR-2015-33821',
        barCouncilState: 'Washington',
        yearOfAdmission: 2015,
        verificationStatus: 'approved',
        verificationNotes: 'Washington State Bar Association certified.',
        verificationDocuments: [
          {
            title: 'Washington State Bar License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Family & Matrimonial', 'Real Estate & Property', 'Custody & Mediation'],
        primaryDomain: 'Family & Matrimonial',
        bio: 'Compassionate family law and property settlement counsel with exceptional trial and mediation records in contested divorces, custody agreements, and prenuptials.',
        education: 'J.D. University of Washington School of Law',
        experienceYears: 9,
        consultationFee: 165,
        consultationDurationMinutes: 45,
        officeAddress: '1201 Third Avenue, Suite 2200, Seattle, WA 98101',
        city: 'Seattle',
        state: 'WA',
        languages: ['English', 'Mandarin'],
        courtAdmissions: ['Washington State Supreme Court'],
        rating: 4.9,
        reviewCount: 24,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. David Sterling',
        email: 'david.lawyer@example.com',
        phone: '+1 (555) 890-1234',
        city: 'Miami',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'FL-BAR-2011-55823',
        barCouncilState: 'Florida',
        yearOfAdmission: 2011,
        verificationStatus: 'approved',
        verificationNotes: 'Florida Bar Board Certified Real Estate Specialist.',
        verificationDocuments: [
          {
            title: 'The Florida Bar Certificate of Standing',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Real Estate & Property', 'Zoning & Land Use', 'Commercial Leases'],
        primaryDomain: 'Real Estate & Property',
        bio: 'Premier commercial real estate attorney specializing in multi-million dollar property transactions, title due diligence, zoning disputes, and leasing.',
        education: 'J.D. University of Miami School of Law',
        experienceYears: 13,
        consultationFee: 175,
        consultationDurationMinutes: 45,
        officeAddress: 'Brickell World Plaza, 600 Brickell Ave, Miami, FL 33131',
        city: 'Miami',
        state: 'FL',
        languages: ['English', 'Spanish'],
        courtAdmissions: ['Florida Supreme Court', 'U.S. District Court SDFL'],
        rating: 4.9,
        reviewCount: 31,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Priya Patel',
        email: 'priya.lawyer@example.com',
        phone: '+1 (555) 901-2345',
        city: 'Austin',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'TX-BAR-2017-66291',
        barCouncilState: 'Texas',
        yearOfAdmission: 2017,
        verificationStatus: 'approved',
        verificationNotes: 'State Bar of Texas & IAPP Certified Privacy Professional (CIPP/US).',
        verificationDocuments: [
          {
            title: 'State Bar of Texas Law License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Cyber & Technology Law', 'Data Privacy (GDPR/CCPA)', 'AI Compliance'],
        primaryDomain: 'Cyber & Technology Law',
        bio: 'Tech regulatory attorney guiding SaaS enterprises, fintechs, and AI founders through privacy laws, security incident response, and vendor risk audits.',
        education: 'J.D. University of Texas School of Law; B.S. Computer Science',
        experienceYears: 7,
        consultationFee: 160,
        consultationDurationMinutes: 45,
        officeAddress: '100 Congress Avenue, Suite 1900, Austin, TX 78701',
        city: 'Austin',
        state: 'TX',
        languages: ['English', 'Gujarati'],
        courtAdmissions: ['Texas Supreme Court'],
        rating: 5.0,
        reviewCount: 22,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Jonathan Hayes',
        email: 'jonathan.lawyer@example.com',
        phone: '+1 (555) 012-3456',
        city: 'Boston',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'MA-BAR-2013-11849',
        barCouncilState: 'Massachusetts',
        yearOfAdmission: 2013,
        verificationStatus: 'approved',
        verificationNotes: 'Massachusetts Board of Bar Overseers credentialed.',
        verificationDocuments: [
          {
            title: 'Commonwealth of Massachusetts Bar License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Labor & Employment', 'Severance Negotiations', 'Executive Compensation'],
        primaryDomain: 'Labor & Employment',
        bio: 'Top employment law attorney defending employees and consulting startups in non-compete agreements, executive contracts, wage claims, and workplace rights.',
        education: 'J.D. Harvard Law School',
        experienceYears: 11,
        consultationFee: 190,
        consultationDurationMinutes: 45,
        officeAddress: 'Exchange Place, 53 State Street, Boston, MA 02109',
        city: 'Boston',
        state: 'MA',
        languages: ['English', 'French'],
        courtAdmissions: ['Massachusetts Supreme Judicial Court', 'First Circuit Court of Appeals'],
        rating: 4.9,
        reviewCount: 35,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Amara Okafor',
        email: 'amara.lawyer@example.com',
        phone: '+1 (555) 123-4567',
        city: 'Washington',
        avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'DC-BAR-2014-99382',
        barCouncilState: 'District of Columbia',
        yearOfAdmission: 2014,
        verificationStatus: 'approved',
        verificationNotes: 'District of Columbia Bar member in good standing.',
        verificationDocuments: [
          {
            title: 'District of Columbia Bar Certificate',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Taxation & Wealth Planning', 'Estate Planning', 'Corporate Tax Structuring'],
        primaryDomain: 'Taxation & Wealth Planning',
        bio: 'Former Federal Tax advisor counseling high-net-worth individuals and corporations on domestic/offshore asset protection, tax controversy, and family trusts.',
        education: 'LL.M. in Taxation, Georgetown University Law Center; J.D. Yale Law School',
        experienceYears: 10,
        consultationFee: 200,
        consultationDurationMinutes: 45,
        officeAddress: '1050 Connecticut Ave NW, Suite 500, Washington, DC 20036',
        city: 'Washington',
        state: 'DC',
        languages: ['English'],
        courtAdmissions: ['District of Columbia Court of Appeals', 'U.S. Tax Court'],
        rating: 5.0,
        reviewCount: 27,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Carlos Mendez',
        email: 'carlos.lawyer@example.com',
        phone: '+1 (555) 345-6789',
        city: 'Houston',
        avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'TX-BAR-2009-38291',
        barCouncilState: 'Texas',
        yearOfAdmission: 2009,
        verificationStatus: 'approved',
        verificationNotes: 'State Bar of Texas Civil Trial Specialist in good standing.',
        verificationDocuments: [
          {
            title: 'State Bar of Texas Certificate of Good Standing',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Civil Litigation', 'Corporate & Commercial', 'Commercial Arbitration'],
        primaryDomain: 'Corporate & Commercial',
        bio: 'Seasoned civil trial attorney with 15 years representing businesses in complex contract disputes, partnership breakups, trade secrets, and arbitration hearings.',
        education: 'J.D. University of Texas School of Law',
        experienceYears: 15,
        consultationFee: 170,
        consultationDurationMinutes: 45,
        officeAddress: '1000 Louisiana St, Suite 4000, Houston, TX 77002',
        city: 'Houston',
        state: 'TX',
        languages: ['English', 'Spanish'],
        courtAdmissions: ['Texas Supreme Court', 'U.S. District Court SDTX'],
        rating: 4.9,
        reviewCount: 34,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Sarah Al-Mansoor',
        email: 'sarah.almansoor.lawyer@example.com',
        phone: '+1 (555) 456-7812',
        city: 'New York',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'NY-BAR-2016-55910',
        barCouncilState: 'New York',
        yearOfAdmission: 2016,
        verificationStatus: 'approved',
        verificationNotes: 'New York Bar Association and AILA immigration practitioner member.',
        verificationDocuments: [
          {
            title: 'New York Supreme Court License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Immigration & Naturalization', 'Corporate & Commercial', 'Family & Matrimonial'],
        primaryDomain: 'Family & Matrimonial',
        bio: 'Passionate counsel assisting founders, engineers, and families navigate corporate employment visas (H-1B, L-1, O-1), investor petitions, and permanent residency.',
        education: 'J.D. NYU School of Law; B.A. International Relations',
        experienceYears: 8,
        consultationFee: 140,
        consultationDurationMinutes: 45,
        officeAddress: '405 Lexington Ave, Chrysler Building, New York, NY 10174',
        city: 'New York',
        state: 'NY',
        languages: ['English', 'Arabic'],
        courtAdmissions: ['New York Supreme Court', 'EOIR Immigration Courts'],
        rating: 5.0,
        reviewCount: 41,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Benjamin Thorne',
        email: 'benjamin.lawyer@example.com',
        phone: '+1 (555) 567-8923',
        city: 'Charlotte',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'NC-BAR-2006-22481',
        barCouncilState: 'North Carolina',
        yearOfAdmission: 2006,
        verificationStatus: 'approved',
        verificationNotes: 'North Carolina State Bar certified financial compliance counsel.',
        verificationDocuments: [
          {
            title: 'North Carolina Bar License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Banking & Financial Law', 'Corporate & Commercial', 'Taxation & Wealth Planning'],
        primaryDomain: 'Corporate & Commercial',
        bio: 'Senior financial regulatory attorney advising regional banks, fintech payment rails, credit unions, and private equity funds on SEC, CFPB, and BSA compliance.',
        education: 'J.D. Duke University School of Law; B.S. Finance',
        experienceYears: 18,
        consultationFee: 220,
        consultationDurationMinutes: 45,
        officeAddress: '301 S College St, Suite 2800, Charlotte, NC 28202',
        city: 'Charlotte',
        state: 'NC',
        languages: ['English'],
        courtAdmissions: ['North Carolina Supreme Court', 'U.S. 4th Circuit Court of Appeals'],
        rating: 4.9,
        reviewCount: 39,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Kavita Deshmukh',
        email: 'kavita.lawyer@example.com',
        phone: '+1 (555) 678-9034',
        city: 'Philadelphia',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'PA-BAR-2014-77312',
        barCouncilState: 'Pennsylvania',
        yearOfAdmission: 2014,
        verificationStatus: 'approved',
        verificationNotes: 'Supreme Court of Pennsylvania and American Health Law Association member.',
        verificationDocuments: [
          {
            title: 'Pennsylvania Supreme Court Certificate',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Labor & Employment', 'Healthcare Law', 'Corporate & Commercial'],
        primaryDomain: 'Labor & Employment',
        bio: 'Healthcare compliance and employment lawyer counseling hospitals, medical practitioners, and health-tech founders on HIPAA, physician contracts, and regulatory licensing.',
        education: 'J.D. University of Pennsylvania Carey Law School; M.P.H.',
        experienceYears: 10,
        consultationFee: 185,
        consultationDurationMinutes: 45,
        officeAddress: '1735 Market St, Suite 3300, Philadelphia, PA 19103',
        city: 'Philadelphia',
        state: 'PA',
        languages: ['English', 'Marathi', 'Hindi'],
        courtAdmissions: ['Supreme Court of Pennsylvania', 'U.S. District Court EDPA'],
        rating: 4.8,
        reviewCount: 26,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Liam O\'Connor',
        email: 'liam.lawyer@example.com',
        phone: '+1 (555) 789-0145',
        city: 'Denver',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'CO-BAR-2010-99413',
        barCouncilState: 'Colorado',
        yearOfAdmission: 2010,
        verificationStatus: 'approved',
        verificationNotes: 'Colorado Supreme Court certified environmental regulatory counsel.',
        verificationDocuments: [
          {
            title: 'Colorado Supreme Court Certificate of Good Standing',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Real Estate & Property', 'Environmental Law', 'Corporate & Commercial'],
        primaryDomain: 'Real Estate & Property',
        bio: 'Natural resources and real property attorney guiding clean-tech ventures, land conservation trusts, and solar developers through water rights, zoning, and EPA reviews.',
        education: 'J.D. University of Colorado Law School',
        experienceYears: 14,
        consultationFee: 190,
        consultationDurationMinutes: 45,
        officeAddress: '1144 15th St, Suite 2100, Denver, CO 80202',
        city: 'Denver',
        state: 'CO',
        languages: ['English'],
        courtAdmissions: ['Colorado Supreme Court', 'Tenth Circuit Court of Appeals'],
        rating: 4.9,
        reviewCount: 28,
        isAcceptingNewClients: true,
      },
    },
    {
      user: {
        name: 'Adv. Ananya Iyer',
        email: 'ananya.lawyer@example.com',
        phone: '+1 (555) 890-1256',
        city: 'Los Angeles',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
      },
      lawyer: {
        barRegistrationNumber: 'CA-BAR-2015-66180',
        barCouncilState: 'California',
        yearOfAdmission: 2015,
        verificationStatus: 'approved',
        verificationNotes: 'State Bar of California Entertainment & IP Section member in good standing.',
        verificationDocuments: [
          {
            title: 'California State Bar License',
            documentType: 'bar_license',
            url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            verifiedAt: new Date(),
          },
        ],
        practiceAreas: ['Intellectual Property', 'Entertainment Law', 'Cyber & Technology Law'],
        primaryDomain: 'Intellectual Property',
        bio: 'Media and entertainment attorney negotiating studio production deals, music distribution, digital creator IP syndication, brand endorsements, and licensing agreements.',
        education: 'J.D. UCLA School of Law; B.A. Media Studies',
        experienceYears: 9,
        consultationFee: 175,
        consultationDurationMinutes: 45,
        officeAddress: '1999 Avenue of the Stars, Century City, Los Angeles, CA 90067',
        city: 'Los Angeles',
        state: 'CA',
        languages: ['English', 'Tamil'],
        courtAdmissions: ['California Supreme Court', 'U.S. District Court CDCA'],
        rating: 5.0,
        reviewCount: 33,
        isAcceptingNewClients: true,
      },
    },
  ];

  const workDays = [1, 2, 3, 4, 5]; // Mon - Fri
  for (const s of lawyerSeeds) {
    let existingUser = await DataStore.findUserByEmail(s.user.email);
    if (!existingUser) {
      existingUser = await DataStore.createUser({
        name: s.user.name,
        email: s.user.email,
        passwordHash: lawyerPassHash,
        role: 'lawyer',
        phone: s.user.phone,
        city: s.user.city,
        avatar: s.user.avatar,
      });
    }

    let existingLawyer = await DataStore.findLawyerByUserId(existingUser._id);
    if (!existingLawyer) {
      existingLawyer = await DataStore.createLawyer({
        userId: existingUser._id,
        ...s.lawyer,
      });
    }

    // Ensure availability slots exist
    const currentSlots = await DataStore.getAvailability(existingLawyer._id);
    if (!currentSlots || currentSlots.length === 0) {
      const slots = workDays.map((d) => ({
        dayOfWeek: d,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: existingLawyer.consultationDurationMinutes || 45,
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        isAvailable: true,
        blockedDates: [],
      }));
      await DataStore.setAvailability(existingLawyer._id, slots);
    }
  }

  // Ensure disk state is saved immediately
  persistToDisk();

  console.log('LegalConnect platform successfully synchronized with 14 verified lawyers and active client accounts.');
}

// Allow direct execution: `node src/server/seed.ts` or `tsx src/server/seed.ts`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  })();
}
