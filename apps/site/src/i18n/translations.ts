export const languages = {
  en: 'EN',
  it: 'IT',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const translations = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.docs': 'Docs',
    'nav.github': 'GitHub',
    'nav.docsMenu': 'Docs navigation',

    // Hero
    'hero.subtitle': 'Full-Stack Developer · Backend & Cloud',
    'hero.description': 'I build backend services and manage their infrastructure on AWS.',
    'hero.projects': 'View projects',
    'hero.docs': 'Documentation',

    // About
    'about.title': 'About',
    'about.p1': 'Freelance developer with 10+ years of experience. I work embedded in development teams, managing application architecture, backend, APIs and code quality.',
    'about.p2': 'Focused on backend and cloud: I design REST APIs with NestJS and PostgreSQL, organize code in Nx monorepos and implement CI/CD pipelines with GitHub Actions and Docker. Currently deepening Infrastructure as Code with AWS CDK.',
    'about.p3': 'On the frontend side, I build user interfaces and component libraries with React, Vue and Angular, delivering responsive and maintainable applications.',

    // Tech Stack
    'stack.title': 'Tech Stack',

    // Projects
    'projects.title': 'Projects',
    'projects.cloudrift.description': 'CLI that analyzes AWS accounts to identify wasted resources and estimate their monthly cost. DDD architecture (Ports & Adapters), plugin model, Nx monorepo, AWS SDK v3.',
    'projects.cloudrift-cdk-test.description': 'CDK infrastructure for live testing of cloudrift. Deploys intentionally wasted AWS resources to validate scanners in a real environment.',
    'projects.ellevas.description': 'This website. Astro 7, Tailwind CSS v4, deployed on S3 + CloudFront via AWS CDK, CI/CD with GitHub Actions.',

    // Contact
    'contact.title': 'Contact',
    'contact.description': 'Have a project in mind? Let\'s talk.',

    // Footer
    'footer.rights': 'All rights reserved.',

    // 404
    '404.message': 'This page does not exist.',
    '404.back': 'Back to home',
  },
  it: {
    // Nav
    'nav.home': 'Home',
    'nav.docs': 'Docs',
    'nav.github': 'GitHub',
    'nav.docsMenu': 'Navigazione docs',

    // Hero
    'hero.subtitle': 'Full-Stack Developer · Backend & Cloud',
    'hero.description': 'Sviluppo servizi backend e gestisco la loro infrastruttura su AWS.',
    'hero.projects': 'Vedi progetti',
    'hero.docs': 'Documentazione',

    // About
    'about.title': 'About',
    'about.p1': 'Freelance developer con oltre 10 anni di esperienza. Lavoro embedded nei team di sviluppo, gestendo architettura applicativa, backend, API e qualità del codice.',
    'about.p2': 'Focus su backend e cloud: progetto API REST con NestJS e PostgreSQL, organizzo codice in monorepo Nx e implemento pipeline CI/CD con GitHub Actions e Docker. Sto approfondendo Infrastructure as Code con AWS CDK.',
    'about.p3': 'Lato frontend, sviluppo interfacce utente e librerie di componenti con React, Vue e Angular, realizzando applicazioni responsive e manutenibili.',

    // Tech Stack
    'stack.title': 'Tech Stack',

    // Projects
    'projects.title': 'Progetti',
    'projects.cloudrift.description': 'CLI che analizza account AWS per identificare risorse sprecate e stimarne il costo mensile. Architettura DDD (Ports & Adapters), plugin model, Nx monorepo, AWS SDK v3.',
    'projects.cloudrift-cdk-test.description': 'Infrastruttura CDK per test live di cloudrift. Deploya risorse AWS volutamente sprecate per validare gli scanner in ambiente reale.',
    'projects.ellevas.description': 'Questo sito. Astro 7, Tailwind CSS v4, deploy su S3 + CloudFront via AWS CDK, CI/CD con GitHub Actions.',

    // Contact
    'contact.title': 'Contatti',
    'contact.description': 'Hai un progetto in mente? Parliamone.',

    // Footer
    'footer.rights': 'Tutti i diritti riservati.',

    // 404
    '404.message': 'Questa pagina non esiste.',
    '404.back': 'Torna alla home',
  },
} as const;
