import { CONFIG } from './config.js';

// Simple UUID generator for mock purposes
function generateUUID() {
  return 'msg_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export const Api = {
  // Checks if we should act in local simulation mode
  isSimulationMode() {
    const urls = CONFIG.endpoints;
    return !urls.webhookUrl || urls.webhookUrl === '[TO CONFIGURE]';
  },

  // Post initialization event when user starts or registers
  async initChat(userProfile) {
    if (this.isSimulationMode()) {
      console.log("[Simulation Mode] Sending chat_opened init event for:", userProfile);
      
      // Simulate real initial incoming welcome stream
      return new Promise((resolve) => {
        setTimeout(() => {
          const welcomeMessages = [
            {
              id: 'init_welcome',
              type: 'text',
              timestamp: new Date().toISOString(),
              direction: 'incoming',
              content: `Bonjour **${userProfile.name}** ! 👋 Bienvenue chez **Langue+**. 

Je suis votre conseiller pédagogique intelligent. Je suis à votre entière disposition pour vous guider dans votre apprentissage, planifier vos cours et vous inscrire.`
            },
            {
              id: 'init_banner',
              type: 'images',
              timestamp: new Date(Date.now() + 100).toISOString(),
              direction: 'incoming',
              url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=640&auto=format&fit=crop',
              caption: "Bienvenue sur notre campus moderne et chaleureux !"
            },
            {
              id: 'init_menu_buttons',
              type: 'buttons',
              timestamp: new Date(Date.now() + 200).toISOString(),
              direction: 'incoming',
              text: "Que préférez-vous faire aujourd'hui ?",
              buttons: [
                { id: 'explore_courses', label: 'Découvrir nos formations 📚' },
                { id: 'view_pricing', label: 'Tarifs et financements 💶' },
                { id: 'book_meeting', label: 'Prendre rendez-vous 📅' },
                { id: 'download_brochures', label: 'Télécharger les brochures 📄' }
              ]
            }
          ];
          resolve({ messages: welcomeMessages });
        }, 800);
      });
    }

    // Real API integration
    try {
      const response = await fetch(CONFIG.endpoints.initUrl || CONFIG.endpoints.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "chat_opened",
          name: userProfile.name,
          phone: userProfile.phone,
          email: userProfile.email || "",
          country: userProfile.country || "",
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      return data; // Expected structure: { messages: [ ... ] }
    } catch (err) {
      console.error("Error calling INIT_URL:", err);
      return { messages: [], error: err.message };
    }
  },

  // Send interactive user events/text to webhook
  async sendEvent(eventPayload, userProfile) {
    if (this.isSimulationMode()) {
      console.log("[Simulation Mode] Outgoing Event:", eventPayload);
      return this.handleSimulationLogic(eventPayload, userProfile);
    }

    try {
      const response = await fetch(CONFIG.endpoints.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventPayload,
          user: {
            name: userProfile.name,
            phone: userProfile.phone,
            email: userProfile.email || "",
            country: userProfile.country || ""
          },
          timestamp: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      return data; // Expected structures: { messages: [ ... ] } or simple ack
    } catch (err) {
      console.error("Error sending event to Webhook:", err);
      return { messages: [], error: err.message };
    }
  },

  // Poll for new messaging events
  async pollMessages(userProfile, lastReceivedId) {
    if (this.isSimulationMode()) {
      // In simulation mode, polling is a pass-through
      return { messages: [] };
    }

    try {
      const url = CONFIG.endpoints.pollingUrl || CONFIG.endpoints.webhookUrl;
      const response = await fetch(`${url}?phone=${encodeURIComponent(userProfile.phone)}&lastId=${encodeURIComponent(lastReceivedId || '')}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP status ${response.status}`);
      const data = await response.json();
      return data; // Expected: { messages: [ ... ] }
    } catch (err) {
      console.warn("Polling failed:", err);
      return { messages: [] };
    }
  },

  // Implements the mock educational dialogue state for immediate preview
  async handleSimulationLogic(event, userProfile) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString();
        let replies = [];

        if (event.type === 'text') {
          const text = event.content.toLowerCase().trim();
          if (text.includes('bonjour') || text.includes('salut') || text.includes('hello')) {
            replies.push({
              id: generateUUID(),
              type: 'text',
              timestamp,
              direction: 'incoming',
              content: `Bonjour **${userProfile.name}** ! Content de vous revoir. Comment puis-je vous aider aujourd'hui ?`
            });
            replies.push(this.getMenuButtonsMessage(timestamp));
          } else if (text.includes('tarif') || text.includes('prix') || text.includes('coût') || text.includes('coûte')) {
            replies = this.getPricingResponse(timestamp);
          } else if (text.includes('cours') || text.includes('formation') || text.includes('programme')) {
            replies = this.getExploreResponse(timestamp);
          } else if (text.includes('brochure') || text.includes('document')) {
            replies = this.getBrochuresResponse(timestamp);
          } else if (text.includes('rendez-vous') || text.includes('rdv') || text.includes('conseiller')) {
            replies = this.getApointmentFormResponse(timestamp);
          } else {
            // General assistant default response
            replies.push({
              id: generateUUID(),
              type: 'text',
              timestamp,
              direction: 'incoming',
              content: `J'ai bien reçu votre message. En tant que conseiller pédagogique Langue+, je peux vous présenter nos cursus ou vous organiser un échange direct.`
            });
            replies.push(this.getMenuButtonsMessage(timestamp));
          }
        } 
        
        else if (event.type === 'button_click') {
          const btnId = event.buttonId;
          if (btnId === 'explore_courses') {
            replies = this.getExploreResponse(timestamp);
          } else if (btnId === 'view_pricing') {
            replies = this.getPricingResponse(timestamp);
          } else if (btnId === 'book_meeting') {
            replies = this.getApointmentFormResponse(timestamp);
          } else if (btnId === 'download_brochures') {
            replies = this.getBrochuresResponse(timestamp);
          } else if (btnId === 'talk_advisor_agent') {
            replies.push({
              id: generateUUID(),
              type: 'text',
              timestamp,
              direction: 'incoming',
              content: `D'accord ! Notre équipe d'admission est prévenue. Un conseiller pédagogique va vous appeler sur le numéro **${userProfile.phone}** dans les plus brefs délais.`
            });
            replies.push({
              id: generateUUID(),
              type: 'images',
              timestamp,
              direction: 'incoming',
              url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=640&auto=format&fit=crop',
              caption: "Sophie, votre conseillère d'orientation académique."
            });
            replies.push(this.getMenuButtonsMessage(timestamp));
          } else if (btnId === 'main_menu') {
            replies.push({
              id: generateUUID(),
              type: 'text',
              timestamp,
              direction: 'incoming',
              content: "Voici notre menu principal d'orientation :"
            });
            replies.push(this.getMenuButtonsMessage(timestamp));
          } else {
            // Default response for unhandled simulated buttons
            replies.push({
              id: generateUUID(),
              type: 'text',
              timestamp,
              direction: 'incoming',
              content: `Vous avez cliqué sur : *${event.buttonLabel}* (ID: ${btnId}). Cet événement a été envoyé avec succès à n8n pour traitement.`
            });
            replies.push(this.getMenuButtonsMessage(timestamp));
          }
        } 
        
        else if (event.type === 'card_action') {
          replies.push({
            id: generateUUID(),
            type: 'text',
            timestamp,
            direction: 'incoming',
            content: `Superbe choix ! Vous avez sélectionné la formation : **${event.cardTitle}** (Action: ${event.actionId}). \n\nSouhaitez-vous planifier un test de niveau gratuit ou bloquer un créneau d'inscription ?`
          });
          replies.push({
            id: generateUUID(),
            type: 'buttons',
            timestamp,
            direction: 'incoming',
            text: "Options d'inscription :",
            buttons: [
              { id: 'book_meeting', label: 'Planifier un appel d\'inscription 📅' },
              { id: 'talk_advisor_agent', label: 'Parler à un conseiller maintenant 👤' },
              { id: 'main_menu', label: 'Retour au menu principal ☰' }
            ]
          });
        } 
        
        else if (event.type === 'form_submit') {
          // Construct nice summary of submitted values
          const answers = event.formData;
          const formattedAnswers = Object.entries(answers)
            .map(([k, v]) => `- **${k}**: ${v}`)
            .join('\n');

          replies.push({
            id: generateUUID(),
            type: 'text',
            timestamp,
            direction: 'incoming',
            content: `✨ **Formulaire Soumis avec Succès !** ✨\n\nMerci d'avoir complété votre demande. Voici les détails enregistrés :\n${formattedAnswers}\n\nn8n a traité les informations. Notre secrétariat pédagogique confirme la pré-demande d'admission.`
          });
          replies.push({
            id: generateUUID(),
            type: 'cards',
            timestamp,
            direction: 'incoming',
            cards: [
              {
                imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=640&auto=format&fit=crop',
                title: "Dossier d'inscription en cours",
                description: "Votre créneau de réservation est pré-bloqué. Téléchargez votre fiche récapitative d'admission.",
                buttons: [
                  { id: 'main_menu', label: 'Menu Principal ☰' }
                ]
              }
            ]
          });
        } 
        
        else if (event.type === 'attachment_send') {
          replies.push({
            id: generateUUID(),
            type: 'text',
            timestamp,
            direction: 'incoming',
            content: `📎 Merci, j'ai bien reçu votre document : **${event.fileName}** (${event.fileSize}). Il a été transmis dans l'espace étudiant pour validation.`
          });
          replies.push(this.getMenuButtonsMessage(timestamp));
        }

        resolve({ messages: replies });
      }, 900);
    });
  },

  // Shared UI components for simulation responses
  getMenuButtonsMessage(timestamp) {
    return {
      id: generateUUID(),
      type: 'buttons',
      timestamp,
      direction: 'incoming',
      text: "Que souhaitez-vous faire à présent ?",
      buttons: [
        { id: 'explore_courses', label: 'Découvrir nos formations 📚' },
        { id: 'view_pricing', label: 'Tarifs et financements 💶' },
        { id: 'book_meeting', label: 'Prendre rendez-vous 📅' },
        { id: 'download_brochures', label: 'Télécharger les brochures 📄' }
      ]
    };
  },

  getExploreResponse(timestamp) {
    return [
      {
        id: generateUUID(),
        type: 'text',
        timestamp,
        direction: 'incoming',
        content: `📚 **Voici nos formations linguistiques d'excellence** :\n\nNous proposons des programmes certifiés adaptés aux professionnels et aux étudiants souhaitant valider leur niveau de langue de façon académique.`
      },
      {
        id: generateUUID(),
        type: 'cards',
        timestamp,
        direction: 'incoming',
        cards: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=400&auto=format&fit=crop',
            title: "Français Général Intensif",
            description: "20h de cours par semaine. Maîtrisez la communication professionnelle et le vocabulaire du travail.",
            buttons: [
              { id: 'action_details_intensif', label: 'En savoir plus ℹ️' },
              { id: 'book_meeting', label: 'S\'inscrire 💼' }
            ]
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop',
            title: "Préparation DELF / DALF",
            description: "Ciblez les épreuves du DELF B2/DALF C1. Examens blancs réguliers et suivi personnalisé par des jurys.",
            buttons: [
              { id: 'action_details_delf', label: 'Fiche programme' },
              { id: 'book_meeting', label: 'Réserver 📅' }
            ]
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop',
            title: "Anglais d'Affaires Pro",
            description: "Idéal pour booster votre carrière à l'international. Gagnez en aisance pour vos pitchs et négociations.",
            buttons: [
              { id: 'action_details_affair', label: 'Détails Pro' },
              { id: 'book_meeting', label: 'Planifier 🚀' }
            ]
          }
        ]
      }
    ];
  },

  getPricingResponse(timestamp) {
    return [
      {
        id: generateUUID(),
        type: 'text',
        timestamp,
        direction: 'incoming',
        content: `💶 **Grille Tarifaire et Financement** :\n
Nos formations sont pensées pour offrir un rapport académique d'excellence. 

- **Français Général**: À partir de 150 000 FCFA / mois
- **Examens Officiels**: À partir de 220 000 FCFA (Module complet de 6 semaines)
- **Anglais Pro**: Formule flexible entreprise ou personnel

Inclus dans chaque forfait : tests d'évaluation hebdomadaires, accès à la médiathèque physique et aux licences e-learning en ligne.`
      },
      {
        id: generateUUID(),
        type: 'files',
        timestamp,
        direction: 'incoming',
        url: '#dummy_pricing_brochure',
        fileName: 'Grille_Tarifaire_LanguePlus_2026.pdf',
        fileSize: '468 KB'
      },
      {
        id: generateUUID(),
        type: 'buttons',
        timestamp,
        direction: 'incoming',
        text: "Des questions sur les facilités de paiement ou bourses ?",
        buttons: [
          { id: 'talk_advisor_agent', label: 'Parler à un conseiller 👤' },
          { id: 'main_menu', label: 'Menu Principal ☰' }
        ]
      }
    ];
  },

  getBrochuresResponse(timestamp) {
    return [
      {
        id: generateUUID(),
        type: 'text',
        timestamp,
        direction: 'incoming',
        content: `📄 **Documents et brochures officiels** :\n
Consultez directement la plaquette d'admission ainsi que le calendrier annuel.`
      },
      {
        id: generateUUID(),
        type: 'files',
        timestamp,
        direction: 'incoming',
        url: '#dummy_brochure_pdf',
        fileName: 'Brochure_LanguePlus_A4.pdf',
        fileSize: '2.4 MB'
      },
      {
        id: generateUUID(),
        type: 'files',
        timestamp,
        direction: 'incoming',
        url: '#dummy_calendar_pdf',
        fileName: 'Calendrier_Academique_Sessions.pdf',
        fileSize: '312 KB'
      },
      {
        id: generateUUID(),
        type: 'buttons',
        timestamp,
        direction: 'incoming',
        text: "Poursuivre votre parcours :",
        buttons: [
          { id: 'book_meeting', label: 'Prendre rendez-vous 📅' },
          { id: 'main_menu', label: 'Menu Principal ☰' }
        ]
      }
    ];
  },

  getApointmentFormResponse(timestamp) {
    return [
      {
        id: generateUUID(),
        type: 'text',
        timestamp,
        direction: 'incoming',
        content: `📅 **Planifiez votre conseiller pédagogique individuel** :\n
Complétez le formulaire ci-dessous pour choisir votre horaire de consultation gratuite.`
      },
      {
        id: generateUUID(),
        type: 'form',
        timestamp,
        direction: 'incoming',
        formId: 'form_orientation_appointment',
        title: "Demande de rendez-vous d'orientation",
        fields: [
          {
            name: "formation",
            label: "Formation souhaitée",
            type: "select",
            required: true,
            options: ["Français Général Intensif", "Préparation DELF / DALF", "Anglais d'Affaires Pro", "Pas encore fixé"]
          },
          {
            name: "date",
            label: "Date souhaitée",
            type: "date",
            required: true
          },
          {
            name: "moment",
            label: "Tranche Horaire recommandée",
            type: "select",
            required: true,
            options: ["Matin (09:00 - 12:00)", "Début d'après-midi (13:30 - 15:30)", "Fin d'après-midi (16:00 - 18:00)"]
          },
          {
            name: "remarques",
            label: "Remarques complémentaires (Optionnel)",
            type: "textarea",
            required: false,
            placeholder: "Indiquez par exemple votre niveau actuel..."
          }
        ],
        submitLabel: "Valider mon rendez-vous"
      }
    ];
  }
};
