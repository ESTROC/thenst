export interface Course {
  id: string;
  title: string;
  category: string;
  level: "Foundational" | "Intermediate" | "Advanced";
  duration: string;
  instructor: string;
  instructorTitle?: string;
  description: string;
  overview?: string;
  modules?: string[];
  prerequisites?: string;
  format?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  authorRole?: string;
  readTime: string;
  summary: string;
  content?: string[];
  keyTakeaways?: string[];
  image?: string;
  featured?: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  type: "Collaboration" | "Participation" | "Project" | "Fellowship" | "Direct Placement";
  category: string;
  location: string;
  date: string;
  description: string;
  requirements?: string[];
  compensation?: string;
  payAmount?: number;
  deadline?: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  domain: string;
  location?: string;
  expertise?: string[];
  clearance?: string;
  initials: string;
  bio?: string;
}

export interface OrganisationEntity {
  id: string;
  name: string;
  type: string;
  focusArea: string;
  location: string;
  description: string;
}

export const COURSES: Course[] = [
  {
    id: "foundations-nat-sec",
    title: "Foundations of National Security",
    category: "National Security",
    level: "Foundational",
    duration: "6 weeks",
    instructor: "TheNST Learning Desk",
    instructorTitle: "Senior Strategic Faculty",
    description: "An introductory pathway covering institutions, intelligence frameworks, legal doctrines and contemporary multi-domain threat environments.",
    overview: "This course establishes the essential conceptual frameworks and operational vocabulary of sovereign security. Participants examine constitutional architectures, state intelligence apparatuses, asymmetric threat vectors, and multi-agency crisis coordination.",
    modules: [
      "Constitutional Architectures & Command Authority",
      "Intelligence Gathering Frameworks & OSINT Verification",
      "Asymmetric Warfare & State-Sponsored Proxy Vectors",
      "Crisis Decision Protocols & Inter-Agency Deconfliction"
    ],
    prerequisites: "None. Open to security professionals, researchers, and public policy practitioners.",
    format: "Structured modular curriculum with case study reviews"
  },
  {
    id: "cyber-ops-strategic",
    title: "Cyber Operations for Strategic Decision-Makers",
    category: "Cybersecurity",
    level: "Intermediate",
    duration: "8 weeks",
    instructor: "Cyber Strategy Group",
    instructorTitle: "Principal Cyber Analysts",
    description: "Offensive and defensive digital capabilities, strategic deterrence, critical infrastructure resilience and command authority.",
    overview: "A strategic-level examination of cyber power in modern statecraft. Focuses on critical national infrastructure defense, cyber deterrence doctrine, escalation management, and sovereign root-of-trust verification.",
    modules: [
      "State-Sponsored Threat Groups & Attribution Methodologies",
      "Deterrence Dynamics & Thresholds of Armed Conflict",
      "Critical National Infrastructure Defense & Redundancy",
      "Incident Governance & High-Velocity Command Decisions"
    ],
    prerequisites: "Familiarity with IT fundamentals or institutional risk management.",
    format: "Case analyses and scenario-based simulation drills"
  },
  {
    id: "ai-autonomy-stability",
    title: "AI, Autonomy and Strategic Stability",
    category: "Emerging Technology",
    level: "Advanced",
    duration: "10 weeks",
    instructor: "Emerging Tech Policy Unit",
    instructorTitle: "Technology & Geopolitics Fellows",
    description: "Autonomous weapons doctrine, algorithmic decision support in command hierarchies and international non-proliferation frameworks.",
    overview: "Analyzes the integration of machine learning and autonomous systems in defence operations. Explores algorithmic confidence thresholds, sensor fusion, human-machine teaming, and strategic stability implications.",
    modules: [
      "Machine Perception in Contested & Jammed Environments",
      "Algorithmic Decision Support & Human-in-the-Loop Safeguards",
      "Autonomous Swarm Architectures & Countermeasures",
      "Treaty Frameworks, Norms & Verification Protocols"
    ],
    prerequisites: "Foundational background in national security or technical systems.",
    format: "Seminar modules, policy drafting workshops, and guest lectures"
  },
  {
    id: "modern-defence-systems",
    title: "Modern Defence Systems: A Technical Primer",
    category: "Defence Technology",
    level: "Intermediate",
    duration: "7 weeks",
    instructor: "Tactical Defense Advisory",
    instructorTitle: "Defense Systems Engineers & Former Officers",
    description: "Air defence networks, electronic warfare spectra, radar architecture, counter-UAS and multi-domain integration.",
    overview: "Provides a rigorous engineering and doctrinal primer on kinetic and electronic defence systems. Covers integrated air and missile defence, radar cross-section analysis, EW spectral superiority, and counter-drone systems.",
    modules: [
      "Electromagnetic Spectrum Dominance & Electronic Attack",
      "Integrated Air & Missile Defence (IAMD) Sensor Meshes",
      "Counter-UAS Detection, RF Interdiction & Kinetic Neutralization",
      "Multi-Domain Command and Control (MDC2) Standards"
    ],
    prerequisites: "Engineering, defense, or analytical background recommended.",
    format: "Technical walkthroughs and architectural case studies"
  },
  {
    id: "strategic-affairs-contested",
    title: "Strategic Affairs in a Contested Order",
    category: "Strategic Affairs",
    level: "Intermediate",
    duration: "6 weeks",
    instructor: "Strategic Affairs Faculty",
    instructorTitle: "Senior Geopolitical Fellows",
    description: "Great-power competition, maritime chokepoints, supply chain vulnerabilities and economic statecraft.",
    overview: "Explores the shifting balance of power across the Indo-Pacific and Eurasian corridors. Assesses choke-point geography, semiconductor supply chains, weaponized interdependence, and alliance coordination.",
    modules: [
      "Indo-Pacific Maritime Corridors & Subsea Geopolitics",
      "Critical Mineral & Semiconductor Supply Chain Security",
      "Economic Statecraft, Sanctions & Financial Warfare",
      "Deterrence Architecture in Multi-Polar Alignments"
    ],
    prerequisites: "Undergraduate degree or relevant professional experience.",
    format: "Guided readings, analytical writing, and policy debates"
  },
  {
    id: "digital-infra-resilience",
    title: "Digital Infrastructure and National Resilience",
    category: "AI & Technology",
    level: "Foundational",
    duration: "5 weeks",
    instructor: "Resilience Engineering Desk",
    instructorTitle: "Infrastructure Security Specialists",
    description: "Subsea cabling, satellite constellations, sovereign cloud infrastructure and sovereign AI compute security.",
    overview: "Surveys physical and logical layers of national telecommunications and data storage. Teaches continuity-of-government frameworks, undersea cable surveillance, and sovereign data enclaves.",
    modules: [
      "Subsea Fiber Protection & Repair Contingencies",
      "Low-Earth-Orbit Satellite Constellations & Ground Segments",
      "Sovereign Cloud Enclaves & Hardware Root of Trust",
      "Civil Protection & Post-Disruption Continuity Frameworks"
    ],
    prerequisites: "None.",
    format: "Self-paced modules with periodic faculty evaluations"
  }
];

export const ARTICLES: Article[] = [
  {
    id: "contested-order-maritime",
    title: "The Contested Order: Indo-Pacific Maritime Security and Subsea Surveillance",
    category: "Strategic Affairs",
    date: "March 2026",
    author: "TheNST Research Desk",
    authorRole: "Maritime Security Working Group",
    readTime: "12 min read",
    featured: true,
    summary: "An in-depth intelligence review of maritime surveillance networks, chokepoint control, and unmanned undersea deterrence in the eastern maritime corridors.",
    keyTakeaways: [
      "Subsea sensor meshes are transitioning from acoustic hydrophone lines to autonomous seabed crawlers.",
      "Chokepoint control in the Malacca and Sunda straits requires multilateral data sharing rather than unilateral patrols.",
      "Commercial undersea fiber routes represent the primary asymmetric vulnerability in maritime communication architecture."
    ],
    content: [
      "The maritime corridors of the Indo-Pacific have entered a period of structural competition characterized by dual-use commercial infrastructure, distributed sensor networks, and autonomous underwater systems.",
      "Traditional blue-water surface supremacy is increasingly complicated by anti-access and area-denial (A2/AD) capabilities operating from littoral shores. In this contested domain, persistent subsurface surveillance has emerged as the decisive intelligence layer.",
      "As sovereign nations deploy autonomous unmanned underwater vehicles (UUVs) to monitor critical subsea communication cables and seabed energy pipelines, the legal and operational thresholds of underwater sovereignty are being tested.",
      "Strategic stability will depend on clear doctrines of maritime domain awareness (MDA) and verifiable communication protocols between sovereign naval commands."
    ],
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "counter-uas-doctrine",
    title: "Counter-UAS Doctrine: Tactical Sensor Fusion in Urban and Border Theatres",
    category: "Defence Technology",
    date: "February 2026",
    author: "Tactical Research Group",
    authorRole: "Air Defence & Autonomy Fellows",
    readTime: "9 min read",
    featured: false,
    summary: "Evaluating RF jamming, directed energy, and kinetic interceptors against coordinated autonomous drone swarms.",
    keyTakeaways: [
      "Single-frequency RF jamming is obsolete against autonomous, visual-inertial odometry swarms.",
      "Layered defense requires acoustic, micro-Doppler radar, and optical tracking tied to AI classification.",
      "Directed energy provides the lowest cost-per-intercept for high-density saturation attacks."
    ],
    content: [
      "The proliferation of inexpensive, commercially derived unmanned aerial systems (UAS) has inverted the cost dynamics of low-altitude air defense.",
      "Modern counter-UAS operations require an integrated sensor architecture that combines passive RF scanners, 3D radar, thermal imaging, and acoustic arrays into a unified tracking matrix.",
      "Field trials indicate that autonomous swarm tactics will render single-point electronic countermeasures ineffective, necessitating hard-kill kinetic and directed-energy interception capabilities."
    ],
    image: "https://images.unsplash.com/photo-1506947411487-a56738267384?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400"
  },
  {
    id: "ai-command-decision",
    title: "Algorithmic Decision Support: Cognitive Load and Authority in High-Velocity Encounters",
    category: "Emerging Technology",
    date: "January 2026",
    author: "Emerging Tech Policy Unit",
    authorRole: "Computational Strategy Working Group",
    readTime: "15 min read",
    featured: false,
    summary: "Examining machine confidence thresholds, human-in-the-loop validation, and legal liability in real-time air defence.",
    keyTakeaways: [
      "Human cognitive capacity degrades during multi-vector hypersonic engagements, forcing reliance on algorithmic triage.",
      "Confidence intervals must be explicitly visualised for commanding officers rather than binary recommendations.",
      "Chain of command and legal accountability must remain strictly anchored to human decision authorities."
    ],
    content: [
      "As engagement timelines compress from minutes to seconds, military decision-makers face severe cognitive overload.",
      "Algorithmic decision support systems offer real-time threat prioritization, but introduce critical questions regarding automation bias and system opacity.",
      "This monograph proposes an institutional framework for graduated human oversight based on verifiable model interpretability and strict boundary conditions."
    ],
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "sovereign-cloud-supply-chains",
    title: "Sovereign Hardware Assurance: Supply Chain Interdiction in Critical Defence Microelectronics",
    category: "Cybersecurity",
    date: "January 2026",
    author: "National Resilience Group",
    authorRole: "Supply Chain & Hardware Security Desk",
    readTime: "11 min read",
    featured: false,
    summary: "Frameworks for silicon root-of-trust verification and cryptographic lifecycle protection for national hardware assets.",
    keyTakeaways: [
      "Unverified third-party IP cores in defence semiconductors represent covert backdoors.",
      "Zero-trust silicon verification must accompany procurement from wafer fabrication to packaging.",
      "National foundries and trusted packaging facilities are prerequisites for strategic autonomy."
    ],
    content: [
      "Globalized semiconductor manufacturing creates pervasive opportunities for malicious hardware modification and counterfeit component insertion.",
      "Protecting critical defence platforms requires rigorous physical inspection, side-channel verification, and cryptographically signed firmware roots of trust.",
      "Institutions must develop trusted foundry consortia and standardized verification pipelines to ensure sovereign hardware integrity."
    ],
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80"
  }
];

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-drone-pilot",
    title: "Drone Pilot — Site & Perimeter Inspection",
    organisation: "AeroShield Drone Services",
    type: "Project",
    category: "Drone Operations",
    location: "Hybrid / Field Sites",
    date: "Active Phase II",
    description: "Fly camera drones to inspect security boundaries, record clear aerial footage, and check site perimeter safety.",
    requirements: [
      "Basic drone flying experience or drone pilot certificate",
      "Ability to operate camera gimbal and monitor battery levels safely",
      "Good communication skills to share flight logs with the ground team"
    ],
    compensation: "₹50,000 / month",
    payAmount: 50000,
    deadline: "15 April 2026"
  },
  {
    id: "opp-security-supervisor",
    title: "Security Supervisor — Campus & Facility Safety",
    organisation: "ShieldPoint Security Solutions",
    type: "Direct Placement",
    category: "Security & Guarding",
    location: "New Delhi",
    date: "Immediate Hiring",
    description: "Lead daily guard patrols, manage visitor check-in desks, and ensure prompt response to building safety alarms.",
    requirements: [
      "1-2 years experience in security guarding or team supervision",
      "Clear verbal communication and calm emergency response",
      "Familiarity with visitor log books and basic CCTV monitoring"
    ],
    compensation: "₹38,000 / month",
    payAmount: 38000,
    deadline: "30 April 2026"
  },
  {
    id: "opp-cyber-trainer",
    title: "Cyber Security Trainer — Beginner Workshops",
    organisation: "TheNST Learning Desk",
    type: "Participation",
    category: "Training & Teaching",
    location: "Remote",
    date: "Rolling Admissions",
    description: "Teach practical internet safety, strong password practices, and virus protection to beginners and college students.",
    requirements: [
      "Working knowledge of computer security, phishing protection, and firewalls",
      "Friendly, encouraging communication style with beginners",
      "Ability to conduct 2 live interactive video sessions each week"
    ],
    compensation: "₹45,000 / batch",
    payAmount: 45000,
    deadline: "Rolling"
  },
  {
    id: "opp-threat-researcher",
    title: "Threat News Analyst — Daily Safety Briefs",
    organisation: "TheNST Research Desk",
    type: "Collaboration",
    category: "Research & Reports",
    location: "Remote",
    date: "Open for Q2",
    description: "Track public news reports and regional security alerts, verify facts, and write brief, easy-to-read daily summaries.",
    requirements: [
      "Strong reading, fact-checking, and summary writing skills in English",
      "Keen interest in current events, defense news, and safety trends",
      "Ability to submit concise bullet-point morning briefings on time"
    ],
    compensation: "₹42,000 / month",
    payAmount: 42000,
    deadline: "Rolling"
  },
  {
    id: "opp-security-fellow",
    title: "Senior Defense & Safety Fellow",
    organisation: "TheNST Strategy Hub",
    type: "Fellowship",
    category: "Fellowship",
    location: "New Delhi / Hybrid",
    date: "Applications Open",
    description: "Lead research on power station safety, emergency communication backups, and national disaster preparedness.",
    requirements: [
      "Background in engineering, risk management, or security policy",
      "Ability to write 2 practical safety guides and lead discussions",
      "Strong analytical mindset and interest in national infrastructure"
    ],
    compensation: "₹75,000 / month + Grant",
    payAmount: 75000,
    deadline: "30 May 2026"
  },
  {
    id: "opp-cctv-technician",
    title: "CCTV & Security Systems Technician",
    organisation: "Apex Surveillance Networks",
    type: "Direct Placement",
    category: "Technical Support",
    location: "Mumbai / On-site",
    date: "Urgent Hiring",
    description: "Install, test, and maintain security cameras, motion sensors, and recording monitors across office and industrial buildings.",
    requirements: [
      "Hands-on experience with CCTV camera wiring and network cables",
      "Knowledge of DVR/NVR setup and basic WiFi router configuration",
      "Willingness to visit client sites for maintenance and repairs"
    ],
    compensation: "₹32,000 / month",
    payAmount: 32000,
    deadline: "20 April 2026"
  },
  {
    id: "opp-drone-data-annotator",
    title: "Drone Video & Image Tagging Specialist",
    organisation: "VisionAir AI Labs",
    type: "Project",
    category: "Drone Operations",
    location: "Remote",
    date: "New Opening",
    description: "Label and tag objects in aerial drone videos (vehicles, buildings, boundaries) to train smart automated safety detection models.",
    requirements: [
      "Basic computer skills with careful attention to detail",
      "Own a laptop/PC with reliable high-speed internet",
      "No coding needed — complete step-by-step training provided"
    ],
    compensation: "₹28,000 / month",
    payAmount: 28000,
    deadline: "Rolling"
  },
  {
    id: "opp-emergency-response-trainer",
    title: "First Aid & Emergency Response Coach",
    organisation: "Community Guard Initiative",
    type: "Participation",
    category: "Training & Teaching",
    location: "Bengaluru / On-site",
    date: "Weekend Batches",
    description: "Demonstrate practical first aid, CPR, fire extinguisher operation, and rapid building evacuation procedures to corporate teams.",
    requirements: [
      "Certified First Aid / Emergency Response instructor qualification",
      "Confident and engaging speaker in group workshops",
      "Available on select weekend mornings for hands-on drills"
    ],
    compensation: "₹35,000 / month",
    payAmount: 35000,
    deadline: "10 May 2026"
  }
];

export const NETWORK_PEOPLE: Person[] = [
  {
    id: "p-1",
    name: "Dr. Vikramaditya Sen",
    role: "Senior Strategic Advisor",
    affiliation: "TheNST Research Desk",
    domain: "Strategic Affairs",
    location: "New Delhi",
    expertise: ["Maritime Strategy", "Indo-Pacific Geopolitics", "Chokepoint Security"],
    clearance: "Level 4 Verified",
    initials: "VS",
    bio: "Specializes in Indo-Pacific maritime security, naval doctrine, and multi-lateral security cooperation frameworks."
  },
  {
    id: "p-2",
    name: "Col. Raghavendra Nair (Retd.)",
    role: "Director of Field Operations",
    affiliation: "Tactical Defense Advisory",
    domain: "Defence Technology",
    location: "Bengaluru",
    expertise: ["Counter-UAS", "Border Surveillance", "Air Defence Integration"],
    clearance: "Level 5 Verified",
    initials: "RN",
    bio: "Over 25 years of command experience across integrated air defence, radar networks, and electronic warfare trials."
  },
  {
    id: "p-3",
    name: "Dr. Ananya Ray",
    role: "Lead Researcher — AI Governance",
    affiliation: "Emerging Tech Policy Unit",
    domain: "Emerging Technology",
    location: "Hyderabad",
    expertise: ["Autonomous Weapons Norms", "Algorithmic Verification", "Human-Machine Teaming"],
    clearance: "Level 3 Verified",
    initials: "AR",
    bio: "Researches verification frameworks for autonomous algorithms and cognitive decision support in critical command systems."
  },
  {
    id: "p-4",
    name: "Karanbir S. Grewal",
    role: "Chief UAS Operations Lead",
    affiliation: "Aerial Capability Group",
    domain: "Drone Systems",
    location: "Pune",
    expertise: ["BVLOS Operations", "Thermal Payloads", "Tactical Mesh Relays"],
    clearance: "Level 4 Verified",
    initials: "KG",
    bio: "Commercial and tactical UAV pilot lead with extensive flight testing in contested RF and high-altitude environments."
  },
  {
    id: "p-5",
    name: "Priyanka Deshmukh",
    role: "Principal Cyber Threat Analyst",
    affiliation: "Critical Infra Defense Hub",
    domain: "Cybersecurity",
    location: "Mumbai",
    expertise: ["SCADA/ICS Protection", "APT Threat Hunting", "Zero Trust Architecture"],
    clearance: "Level 5 Verified",
    initials: "PD",
    bio: "Leads investigations into state-sponsored threats targeting electrical transmission grids and financial clearing networks."
  },
  {
    id: "p-6",
    name: "Maj. Gen. Alok Mathur (Retd.)",
    role: "Chair of Academic Council",
    affiliation: "TheNST Academic Board",
    domain: "National Security",
    location: "New Delhi",
    expertise: ["National Security Doctrine", "Inter-Agency Coordination", "Crisis Leadership"],
    clearance: "Council Board",
    initials: "AM",
    bio: "Former commander with wide experience across joint operations, strategic deterrence, and institutional education."
  }
];

export const ORGANISATIONS: OrganisationEntity[] = [
  {
    id: "org-1",
    name: "National Security Research Foundation",
    type: "Research Think Tank",
    focusArea: "Strategic Geopolitics & Foreign Policy",
    location: "New Delhi",
    description: "Independent institutional foundation producing strategic assessments and multilateral policy dialogue."
  },
  {
    id: "org-2",
    name: "Sovereign Cyber Resilience Institute",
    type: "Technical Institute",
    focusArea: "Critical Infrastructure Defence & Cryptography",
    location: "Bengaluru",
    description: "Collaborative research laboratory dedicated to safeguarding power grids, telecommunications, and banking."
  },
  {
    id: "org-3",
    name: "Autonomous Systems Flight Centre",
    type: "Field Operations & Testing Hub",
    focusArea: "UAV Capabilities, Sensor Fusion & BVLOS Trials",
    location: "Pune",
    description: "Dedicated flight testing range and engineering hub for next-generation unmanned aerial systems."
  },
  {
    id: "org-4",
    name: "Defence Electronics Consortium",
    type: "Industry & Engineering Alliance",
    focusArea: "Radar Systems, EW & Trusted Silicon",
    location: "Hyderabad",
    description: "Consortium of high-precision defense manufacturers, software architects, and verification labs."
  }
];

export const ROLE_COPY: Record<string, { title: string; subtitle: string; heroTitle: string; heroDesc: string; steps: { num: string; title: string; desc: string }[]; benefits: string[] }> = {
  "security-professional": {
    title: "Security Professional",
    subtitle: "Guards & Security Officers",
    heroTitle: "Build your security career with verified credentials.",
    heroDesc: "Complete practical security training, get your background verified, and find hiring opportunities with top companies and agencies.",
    steps: [
      { num: "01", title: "Create Your Account", desc: "Sign up and tell us about your experience and skills." },
      { num: "02", title: "Complete Verification", desc: "Submit your background details and official identity documents." },
      { num: "03", title: "Choose Your Training", desc: "Pick courses in site security, cyber safety, or emergency response." },
      { num: "04", title: "Earn Certificates", desc: "Complete lessons, take quizzes, and earn your verified certificate." },
      { num: "05", title: "Get Hired & Deploy", desc: "Connect directly with companies and agencies looking for trained staff." }
    ],
    benefits: [
      "Official Verified Profile",
      "Government-Aligned Training",
      "Direct Job & Hiring Access",
      "Career Growth & Skill Badges"
    ]
  },
  "drone-pilot": {
    title: "Drone Pilot",
    subtitle: "UAV Flight & Operations",
    heroTitle: "Become a certified drone pilot and find flight missions.",
    heroDesc: "Learn flight safety, camera and sensor handling, government airspace rules, and connect with companies hiring drone pilots.",
    steps: [
      { num: "01", title: "Create Your Account", desc: "Sign up as a pilot and enter your flight experience." },
      { num: "02", title: "Register Your Skills", desc: "List the drones you fly, camera types, and flight hours." },
      { num: "03", title: "Choose Mission Types", desc: "Select areas like site security, mapping, surveying, or inspections." },
      { num: "04", title: "Explore Open Missions", desc: "Browse open jobs, flight projects, and training courses." },
      { num: "05", title: "Fly & Earn", desc: "Complete missions with verified companies and build your flying record." }
    ],
    benefits: [
      "Verified Pilot Profile",
      "Flight Training & Exam Prep",
      "Direct Access to Drone Jobs",
      "Equipment & Mission Network"
    ]
  },
  "educator": {
    title: "Educator & Instructor",
    subtitle: "Teachers & Trainers",
    heroTitle: "Teach courses and share your security expertise.",
    heroDesc: "Turn your practical knowledge and field experience into simple, accredited courses for students and working professionals.",
    steps: [
      { num: "01", title: "Create Your Account", desc: "Sign up as an educator and share your teaching background." },
      { num: "02", title: "Submit Course Plan", desc: "Create a simple lesson outline and learning goals." },
      { num: "03", title: "Course Review", desc: "Our team reviews your curriculum to ensure high quality." },
      { num: "04", title: "Publish on TheNST", desc: "Your course goes live for thousands of students and teams." },
      { num: "05", title: "Teach & Earn", desc: "Lead video classes, grade assignments, and earn royalties." }
    ],
    benefits: [
      "Instructor Pay & Royalties",
      "Reach Thousands of Learners",
      "Easy-to-Use Course Builder",
      "Teaching Support & Feedback"
    ]
  },
  "organisation": {
    title: "Companies & Agencies",
    subtitle: "Employers & Partners",
    heroTitle: "Hire verified security staff and train your team.",
    heroDesc: "Find pre-screened security guards and drone pilots, train your workforce with online courses, and commission expert reports.",
    steps: [
      { num: "01", title: "Create Company Account", desc: "Register your company or security agency in minutes." },
      { num: "02", title: "Post Job Openings", desc: "List the roles, skills, and number of people you need to hire." },
      { num: "03", title: "Review Verified Candidates", desc: "Browse background-checked guards and certified drone pilots." },
      { num: "04", title: "Train Your Team", desc: "Enroll your team in structured online courses and track progress." },
      { num: "05", title: "Hire & Deploy", desc: "Message candidates directly and manage your workforce easily." }
    ],
    benefits: [
      "Direct Access to Vetted Staff",
      "Bulk Team Training Courses",
      "Verified Background Checks",
      "Simple Candidate Messaging"
    ]
  },
  "researcher": {
    title: "Researcher",
    subtitle: "Analysis & Reports",
    heroTitle: "Publish research and analyze security trends.",
    heroDesc: "Share in-depth analysis on modern security, drone technology, cyber safety, and international defense topics.",
    steps: [
      { num: "01", title: "Create Your Account", desc: "Sign up as a researcher and share your areas of interest." },
      { num: "02", title: "Submit Research Proposals", desc: "Share your research topics, papers, or case studies." },
      { num: "03", title: "Peer Review", desc: "Collaborate with other experts to refine your paper." },
      { num: "04", title: "Publish & Share", desc: "Publish your reports on TheNST for leaders and readers." },
      { num: "05", title: "Join Projects", desc: "Participate in paid research fellowships and expert panels." }
    ],
    benefits: [
      "Published Author Profile",
      "Research Grants & Retainers",
      "Access to Data & Experts",
      "Wide Audience of Leaders"
    ]
  },
  "learner": {
    title: "Learner & Student",
    subtitle: "Skills & Certifications",
    heroTitle: "Learn in-demand security skills at your own pace.",
    heroDesc: "Take practical courses in drone operations, security guard training, cyber defense, and AI technology.",
    steps: [
      { num: "01", title: "Create Your Account", desc: "Sign up for free and choose what you want to learn." },
      { num: "02", title: "Explore Courses", desc: "Browse beginner to advanced courses with video lessons." },
      { num: "03", title: "Learn Online", desc: "Watch lessons anytime, take quizzes, and track your progress." },
      { num: "04", title: "Earn Certificates", desc: "Get an official certificate to prove your new skills." },
      { num: "05", title: "Find Opportunities", desc: "Use your certificates to apply for jobs and internships." }
    ],
    benefits: [
      "Self-Paced Video Lessons",
      "Official Verified Certificates",
      "Job & Internship Board",
      "Support from Instructors"
    ]
  }
};
