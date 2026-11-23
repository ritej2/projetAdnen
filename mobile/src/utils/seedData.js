// Données initiales miroir de la base MySQL (scroll_master / DataSeeder)
export const SEED_JOBS = [
  {
    id: 1,
    titre: 'Ingénieur Full Stack Java 21 / React 19',
    nomEntreprise: 'Mohhm Cloud Technologies',
    entrepriseId: 1,
    typeContrat: 'CDI',
    localisation: 'Paris, France',
    modeTravail: 'Hybride',
    categorie: 'Ingénierie & Tech',
    salaire: 55000,
    salaireMax: 68000,
    datePublication: '2026-11-20',
    description:
      'Rejoignez notre équipe d’ingénierie pour concevoir et déployer des plateformes cloud réactives avec Java 21, Spring Boot 3 et React 19.',
    missions:
      'Développement de microservices performants, création d’interfaces temps réel, participation aux revues de code et tests d’intégration.',
    profilRecherche:
      'Diplômé Bac+5 ou école d’ingénieurs, vous maîtrisez Java 21, Spring Boot, React, TypeScript et les bases SQL relationnelles (MySQL / Postgres).',
    competencesRequises: 'Java 21, Spring Boot, React 19, TypeScript, MySQL, Docker, CI/CD',
    nombreCandidatures: 3,
  },
  {
    id: 2,
    titre: 'Lead Architect Cloud & DevOps Kubernetes',
    nomEntreprise: 'Test10 Digital Lab',
    entrepriseId: 2,
    typeContrat: 'CDI',
    localisation: 'Lyon / Télétravail',
    modeTravail: 'Télétravail',
    categorie: 'Ingénierie & Tech',
    salaire: 65000,
    salaireMax: 80000,
    datePublication: '2026-11-21',
    description:
      'Supervisez nos infrastructures multi-cloud et pipelines GitOps pour garantir la haute disponibilité de nos services critiques.',
    missions:
      'Automatisation de déploiements Kubernetes, supervision Prometheus/Grafana, optimisation des coûts d’hébergement et audit de sécurité réseau.',
    profilRecherche:
      'Minimum 5 ans d’expérience en administration Cloud/DevOps, expertises Kubernetes, Terraform, Linux et sécurité des conteneurs.',
    competencesRequises: 'Kubernetes, Docker, Terraform, AWS, CI/CD, Prometheus, Linux',
    nombreCandidatures: 2,
  },
  {
    id: 3,
    titre: 'Data Scientist & Ingénieur IA / LLM',
    nomEntreprise: 'Mohhm Cloud Technologies',
    entrepriseId: 1,
    typeContrat: 'CDI',
    localisation: 'Paris / Hybride',
    modeTravail: 'Hybride',
    categorie: 'Data & IA',
    salaire: 58000,
    salaireMax: 72000,
    datePublication: '2026-11-22',
    description:
      'Participez au développement de modèles de matching sémantique et d’assistants IA générative intégrés à nos workflows métier.',
    missions:
      'Entraînement et fine-tuning de modèles LLM, mise en place de bases de données vectorielles (RAG), tests de performance et APIs de serving.',
    profilRecherche:
      'Master en Data Science ou IA, solide maîtrise de Python, LangChain, PyTorch, SQL et des architectures Transformer.',
    competencesRequises: 'Python, PyTorch, LangChain, RAG, SQL, Docker, FastAPI',
    nombreCandidatures: 4,
  },
  {
    id: 4,
    titre: 'Product Designer UI/UX & Design System',
    nomEntreprise: 'NovaTech Studio',
    entrepriseId: 3,
    typeContrat: 'Freelance',
    localisation: 'Paris, France',
    modeTravail: 'Télétravail',
    categorie: 'Design & Produit',
    salaire: 45000,
    salaireMax: 55000,
    datePublication: '2026-11-22',
    description:
      'Donnez vie à l’identité visuelle de nos applications SaaS et optimisez le parcours utilisateur sur Web et Mobile.',
    missions:
      'Conception de maquettes interactives sur Figma, refonte du Design System Superio, tests utilisateurs et suivi d’intégration.',
    profilRecherche:
      'Portfolio démontrant une grande rigueur typographique et ergonomique, maîtrise parfaite de Figma et sens aigu du détail.',
    competencesRequises: 'Figma, UI/UX, Design System, Prototypage, Ergonomie Mobile',
    nombreCandidatures: 1,
  },
  {
    id: 5,
    titre: 'Expert Cybersécurité & Audit DevSecOps',
    nomEntreprise: 'Mohhm Cloud Technologies',
    entrepriseId: 1,
    typeContrat: 'CDI',
    localisation: 'Paris, France',
    modeTravail: 'Présentiel',
    categorie: 'Cybersécurité',
    salaire: 60000,
    salaireMax: 75000,
    datePublication: '2026-11-23',
    description:
      'Garantissez la robustesse de nos applications contre les vulnérabilités et auditez nos flux d’authentification.',
    missions:
      'Audits de sécurité réguliers, tests d’intrusion (pentesting), intégration de scanners SAST/DAST dans nos pipelines Git.',
    profilRecherche:
      'Expérience confirmée en sécurité applicative, certifications CEH / CISSP appréciées, maîtrise d’OAuth 2.0 / JWT.',
    competencesRequises: 'Cybersécurité, Pentest, OAuth2, JWT, OWASP, Docker Security',
    nombreCandidatures: 1,
  },
  {
    id: 6,
    titre: 'Développeur Mobile React Native / Expo',
    nomEntreprise: 'Test10 Digital Lab',
    entrepriseId: 2,
    typeContrat: 'CDI',
    localisation: 'Paris / Hybride',
    modeTravail: 'Hybride',
    categorie: 'Ingénierie & Tech',
    salaire: 48000,
    salaireMax: 60000,
    datePublication: '2026-11-23',
    description:
      'Concevez l’application mobile JobFlow pour iOS et Android avec React Native, Expo SDK 52 et intégration d’APIs REST sécurisées.',
    missions:
      'Développement de composants UI haute fidélité, navigation fluide avec React Navigation, gestion du cache offline et déploiement.',
    profilRecherche:
      'Maîtrise de React Native, TypeScript, Expo, Axios, intégration de fonctionnalités natives Android/iOS.',
    competencesRequises: 'React Native, Expo, TypeScript, JavaScript, Android Studio, Git',
    nombreCandidatures: 5,
  },
];

export const SEED_COMPANIES = [
  {
    id: 1,
    nomEntreprise: 'Mohhm Cloud Technologies',
    secteur: 'Cloud Native & DevSecOps',
    adresse: 'Paris, France',
    description:
      'Éditeur de solutions Cloud Native et d’orchestration Kubernetes pour les entreprises internationales.',
    nombreOffresActives: 3,
    siteWeb: 'https://mohhm.io',
    telephone: '+33 1 42 68 55 00',
    verifiee: true,
  },
  {
    id: 2,
    nomEntreprise: 'Test10 Digital Lab',
    secteur: 'Ingénierie Logicielle & IA',
    adresse: 'Lyon, France',
    description:
      'Studio d’ingénierie logicielle spécialisé dans les plateformes web haute performance et l’IA appliquée.',
    nombreOffresActives: 3,
    siteWeb: 'https://test10.io',
    telephone: '+33 4 78 92 14 30',
    verifiee: true,
  },
  {
    id: 3,
    nomEntreprise: 'NovaTech Studio',
    secteur: 'Product Design & Web3',
    adresse: 'Paris, France',
    description:
      'Studio d’innovation digitale spécialisé dans les interfaces interactives et applications métiers.',
    nombreOffresActives: 2,
    siteWeb: 'https://novatech.io',
    telephone: '+33 1 55 43 20 10',
    verifiee: true,
  },
];
