export const CONFIG = {
  appName: "Langue+ Assistant",
  appSubtitle: "Votre conseiller pédagogique intelligent",
  appDescription: "Découvrez les formations, posez vos questions et préparez votre parcours linguistique.",
  logoUrl: "", // Optional School Logo
  primaryColor: "#0F4C81",
  secondaryColor: "#F5F7FA",
  accentColor: "#2BB673",
  defaultTheme: "Light",
  
  onboarding: {
    welcomeTitle: "Bienvenue dans votre futur parcours linguistique",
    welcomeMessage: "Découvrez nos formations, obtenez des réponses instantanées à vos questions et trouvez le programme qui correspond à vos objectifs.",
    ctaText: "Suivant",
    steps: [
      {
        title: "Bienvenue chez Langue+",
        message: "Apprenez les langues autrement. Moderne, interactive et centrée sur votre réussite.",
        bullets: [
          "Pratique",
          "Accessible",
          "À votre rythme"
        ]
      },
      {
        title: "Une nouvelle façon d'apprendre",
        message: "Progressez grâce à des conversations pratiques, des situations de la vie quotidienne et des ressources modernes conçues pour un apprentissage concret et efficace."
      },
      {
        title: "Ouvrez-vous de nouvelles portes",
        message: "Apprendre une langue moderne peut transformer votre quotidien et booster de nombreuses opportunités :",
        bullets: [
          "Vos études supérieures",
          "Votre carrière internationale",
          "L'entrepreneuriat ou les voyages",
          "Votre communication globale",
          "Votre développement personnel"
        ]
      },
      {
        title: "Votre assistant personnel",
        message: "Discutez directement avec votre assistant IA officiel pour découvrir les ressources disponibles, poser vos questions et bénéficier d'un accompagnement personnalisé."
      }
    ],
    trustSignals: [
      "Assistance disponible 24h/24",
      "Réponsse officielle de Langue+",
      "Protection des données élèves",
      "Accompagnement intelligent"
    ]
  },
  
  registration: {
    requiredFields: [
      { name: "name", label: "Nom complet", type: "text", required: true, placeholder: "Ex: Armel Mbiata" },
      { name: "phone", label: "Numéro de téléphone", type: "tel", required: true, placeholder: "Ex: +243 ..." }
    ],
    additionalFields: [
      { name: "email", label: "Adresse e-mail", type: "email", required: false, placeholder: "Ex: armel@example.com" },
      { name: "country", label: "Pays d'apprentissage", type: "text", required: false, placeholder: "Ex: Cameroun, Sénégal, Congo..." }
    ]
  },
  
  endpoints: {
    webhookUrl: "https://n8n-production-47ea.up.railway.app/webhook/AppSchool", // Set Webhook URL to integrate with n8n
    initUrl: "https://n8n-production-47ea.up.railway.app/webhook/AppSchool",    // Set Init URL to integrate with n8n
    pollingUrl: "", // Set Polling URL to integrate with n8n
    pollingInterval: 5000 // POLL INTERVAL
  },
  
  modules: {
    attachments: true,
    imageMessages: true,
    fileMessages: true,
    voiceMessages: false,
    pushNotifications: true,
    profilePage: true,
    settingsPage: true,
    formMessages: true,
    cardMessages: true,
    buttonMessages: true
  }
};
