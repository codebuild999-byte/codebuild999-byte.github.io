import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { Api } from './api.js';
import { MessageRegistry, getIconSvg } from './renderer.js';

// Global Client State Reference
const STATE = {
  user: null,
  activeScreen: 'onboarding', // onboarding | registration | chat
  onboardingStep: 0,
  isTyping: false,
  pollingTimer: null,
  theme: CONFIG.defaultTheme || 'Light',
  notificationsEnabled: false,
  isFallbackPolling: false
};

// DOM References
const DOM = {
  viewport: document.getElementById('app-viewport'),
  onboardingScreen: document.getElementById('onboarding-screen'),
  registrationScreen: document.getElementById('registration-screen'),
  chatScreen: document.getElementById('chat-screen'),
  
  // Onboarding
  carouselSlides: document.getElementById('carousel-slides'),
  carouselIndicators: document.getElementById('carousel-indicators'),
  onboardingCtaBtn: document.getElementById('onboarding-cta-btn'),
  trustGrid: document.getElementById('trust-grid'),
  
  // Registration
  regForm: document.getElementById('registration-form'),
  regFieldsList: document.getElementById('registration-fields-list'),
  regSubmitBtn: document.getElementById('registration-submit-btn'),
  regBackBtn: document.getElementById('registration-back-btn'),
  
  // Chat viewport
  chatHeader: document.getElementById('chat-header'),
  messagesViewport: document.getElementById('messages-viewport'),
  composerForm: document.getElementById('chat-composer-form'),
  composerInput: document.getElementById('composer-input'),
  composerSendBtn: document.getElementById('composer-send-btn'),
  attachmentBtn: document.getElementById('attachment-action-btn'),
  attachmentInput: document.getElementById('hidden-attachment-input'),
  
  // Slide Over Panels
  profileBtn: document.getElementById('header-profile-btn'),
  settingsBtn: document.getElementById('header-settings-btn'),
  profilePanel: document.getElementById('profile-panel'),
  settingsPanel: document.getElementById('settings-panel'),
  profileBackBtn: document.getElementById('profile-back-btn'),
  settingsBackBtn: document.getElementById('settings-back-btn'),
  
  // Profile Values
  profileFieldsContainer: document.getElementById('profile-fields-container'),
  profileResetBtn: document.getElementById('profile-reset-btn'),
  
  // Settings Controls
  switchThemeInput: document.getElementById('switch-theme-input'),
  switchNotifyInput: document.getElementById('switch-notify-input')
};

// 1. Initialization Core Routing
async function initApp() {
  console.log("Initializing Langue+ Assistant App...");
  
  // Load persisted user & state settings
  STATE.user = await Storage.getUser();
  STATE.theme = await Storage.getState('theme', CONFIG.defaultTheme);
  STATE.notificationsEnabled = await Storage.getState('notifications', false);
  
  applyTheme(STATE.theme);
  
  // Setup standard static views & sliders
  setupOnboardingCarousel();
  setupRegistrationForm();
  setupHeaderDetails();
  setupSlidePanels();
  setupPreferences();
  setupAttachmentUpload();
  
  // Setup textarea autogrow
  DOM.composerInput.addEventListener('input', autoGrowComposer);
  
  // Core Screen Router
  if (STATE.user) {
    switchToScreen('chat');
    await loadPersistedMessagesAndTriggerInit();
  } else {
    switchToScreen('onboarding');
  }

  // Register standard Service Worker beautifully
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('ServiceWorker registration successful with scope: ', reg.scope))
        .catch((err) => console.error('ServiceWorker registration failed: ', err));
    });
  }
}

// 2. Navigation Routing
function switchToScreen(screenId) {
  STATE.activeScreen = screenId;
  
  DOM.onboardingScreen.classList.add('hidden');
  DOM.registrationScreen.classList.add('hidden');
  DOM.chatScreen.classList.add('hidden');
  
  if (screenId === 'onboarding') {
    DOM.onboardingScreen.classList.remove('hidden');
  } else if (screenId === 'registration') {
    DOM.registrationScreen.classList.remove('hidden');
  } else if (screenId === 'chat') {
    DOM.chatScreen.classList.remove('hidden');
    updatePollingState();
  }
}

// 3. Onboarding Carousel Implementation
function setupOnboardingCarousel() {
  // Clear any placeholder
  DOM.carouselSlides.innerHTML = '';
  DOM.carouselIndicators.innerHTML = '';
  
  const steps = CONFIG.onboarding.steps;
  
  steps.forEach((step, index) => {
    // Compile Slide
    const slide = document.createElement('div');
    slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
    
    // Pick responsive icon
    const iconName = index === 0 ? 'file' : index === 1 ? 'info' : index === 2 ? 'calendar' : 'user';
    
    let bulletsHtml = '';
    if (step.bullets && step.bullets.length > 0) {
      bulletsHtml = '<ul>';
      step.bullets.forEach(b => {
        bulletsHtml += `<li>${b}</li>`;
      });
      bulletsHtml += '</ul>';
    }

    slide.innerHTML = `
      <div class="carousel-illustration">
        ${getIconSvg(iconName, 44, CONFIG.accentColor)}
      </div>
      <h2>${step.title}</h2>
      <p>${step.message}</p>
      ${bulletsHtml}
    `;
    DOM.carouselSlides.appendChild(slide);
    
    // Compile Dot indicator
    const dot = document.createElement('div');
    dot.className = `indicator ${index === 0 ? 'active' : ''}`;
    dot.setAttribute('data-target-idx', index);
    dot.addEventListener('click', () => showOnboardingSlide(index));
    DOM.carouselIndicators.appendChild(dot);
  });
  
  // Render trust signals
  DOM.trustGrid.innerHTML = '';
  (CONFIG.onboarding.trustSignals || []).forEach((badge) => {
    const item = document.createElement('div');
    item.className = 'trust-item';
    item.innerHTML = `${getIconSvg('check', 14, CONFIG.accentColor)} <span>${badge}</span>`;
    DOM.trustGrid.appendChild(item);
  });
  
  // Set CTA wireup
  DOM.onboardingCtaBtn.addEventListener('click', () => {
    if (STATE.onboardingStep < steps.length - 1) {
      showOnboardingSlide(STATE.onboardingStep + 1);
    } else {
      switchToScreen('registration');
    }
  });

  // Set default button label
  DOM.onboardingCtaBtn.innerHTML = `<span>${CONFIG.onboarding.ctaText}</span> ${getIconSvg('arrowRight', 18)}`;
}

function showOnboardingSlide(index) {
  const slides = DOM.carouselSlides.querySelectorAll('.carousel-slide');
  const dots = DOM.carouselIndicators.querySelectorAll('.indicator');
  
  slides.forEach((slide) => slide.classList.remove('active'));
  dots.forEach((dot) => dot.classList.remove('active'));
  
  slides[index].classList.add('active');
  dots[index].classList.add('active');
  
  STATE.onboardingStep = index;
  
  // If last slide, change CTA text to Registration transition
  const stepsCount = CONFIG.onboarding.steps.length;
  if (index === stepsCount - 1) {
    DOM.onboardingCtaBtn.innerHTML = `<span>S'inscrire et démarrer</span> ${getIconSvg('check', 18)}`;
  } else {
    DOM.onboardingCtaBtn.innerHTML = `<span>${CONFIG.onboarding.ctaText}</span> ${getIconSvg('arrowRight', 18)}`;
  }
}

// 4. Registration Handling
function setupRegistrationForm() {
  DOM.regFieldsList.innerHTML = '';
  
  const requiredFields = CONFIG.registration.requiredFields || [];
  const additionalFields = CONFIG.registration.additionalFields || [];
  const fields = [...requiredFields, ...additionalFields];
  
  fields.forEach((field) => {
    const control = document.createElement('div');
    control.className = 'form-control';
    control.innerHTML = `
      <label class="form-field-label">${field.label}${field.required ? ' <span class="required-star">*</span>' : ''}</label>
      <input class="form-input-el" type="${field.type}" id="reg_${field.name}" name="${field.name}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>
    `;
    DOM.regFieldsList.appendChild(control);
  });
  
  // Back button event
  if (DOM.regBackBtn) {
    DOM.regBackBtn.addEventListener('click', () => {
      switchToScreen('onboarding');
      showOnboardingSlide(CONFIG.onboarding.steps.length - 1);
    });
  }

  DOM.regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let isValid = true;
    const registrationData = {};
    
    // Check validation
    fields.forEach((field) => {
      const input = document.getElementById(`reg_${field.name}`);
      const val = input.value.trim();
      const parent = input.closest('.form-control');
      
      if (field.required && !val) {
        isValid = false;
        parent.classList.add('field-error');
      } else {
        parent.classList.remove('field-error');
        registrationData[field.name] = val;
      }
    });
    
    if (!isValid) return;
    
    // Save registration
    STATE.user = registrationData;
    await Storage.saveUser(registrationData);
    
    // Animate Submit Button State
    DOM.regSubmitBtn.disabled = true;
    DOM.regSubmitBtn.innerHTML = `<span>Chargement de la session...</span>`;
    
    // Load chat layout
    switchToScreen('chat');
    
    // Call INIT_URL/simulation stream
    showTypingLoader();
    const result = await Api.initChat(registrationData);
    hideTypingLoader();
    
    if (result && result.messages && result.messages.length > 0) {
      clearFallbackPolling();
      await Storage.saveMessages(result.messages);
      renderAllMessages(result.messages);
    } else {
      triggerFallbackPolling();
    }
  });
}

// 5. Chat Interface Rendering
function setupHeaderDetails() {
  DOM.chatHeader.querySelector('.school-title').textContent = CONFIG.appName;
  DOM.chatHeader.querySelector('.school-desc').innerHTML = `${getIconSvg('info', 11, CONFIG.accentColor)} En ligne`;
}

async function loadPersistedMessagesAndTriggerInit() {
  const history = await Storage.getMessages();
  if (history.length > 0) {
    renderAllMessages(history);
    updatePollingState();
  } else {
    // Fallback: Initial welcome if nothing exists
    showTypingLoader();
    const result = await Api.initChat(STATE.user);
    hideTypingLoader();
    if (result && result.messages && result.messages.length > 0) {
      clearFallbackPolling();
      await Storage.saveMessages(result.messages);
      renderAllMessages(result.messages);
    } else {
      triggerFallbackPolling();
    }
  }
}

function renderAllMessages(messages) {
  DOM.messagesViewport.innerHTML = '';
  messages.forEach((msg) => {
    appendMessageDom(msg);
  });
  scrollToBottom();
}

function appendMessageDom(message) {
  // Guard for existing DOM message element in viewport
  if (document.getElementById(message.id)) return;
  
  const element = MessageRegistry.render(message, handleInteractiveEvent);
  DOM.messagesViewport.appendChild(element);
  scrollToBottom();
}

function scrollToBottom() {
  setTimeout(() => {
    DOM.messagesViewport.scrollTop = DOM.messagesViewport.scrollHeight;
  }, 50);
}

// Typing indicators
function showTypingLoader() {
  if (STATE.isTyping) return;
  STATE.isTyping = true;
  
  const loader = document.createElement('div');
  loader.id = 'chat-typing-loader';
  loader.className = 'message-row incoming typing-loader';
  loader.innerHTML = `
    <div class="typing-dots-container">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  DOM.messagesViewport.appendChild(loader);
  scrollToBottom();
}

function hideTypingLoader() {
  STATE.isTyping = false;
  const loader = document.getElementById('chat-typing-loader');
  if (loader) loader.remove();
}

// Grow Textarea smoothly
function autoGrowComposer() {
  DOM.composerInput.style.height = 'auto';
  DOM.composerInput.style.height = (DOM.composerInput.scrollHeight) + 'px';
}

// 6. Composer Submit Handlers
DOM.composerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = DOM.composerInput.value.trim();
  if (!text) return;
  
  // Clear input area immediately
  DOM.composerInput.value = '';
  DOM.composerInput.style.height = 'auto';
  
  // Create and persist user outgoing message
  const userMsg = {
    id: 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
    type: 'text',
    timestamp: new Date().toISOString(),
    direction: 'outgoing',
    content: text
  };
  
  await Storage.saveMessage(userMsg);
  appendMessageDom(userMsg);
  
  // Stream to webhook calling
  showTypingLoader();
  const result = await Api.sendEvent({
    type: 'text',
    id: userMsg.id,
    content: text
  }, STATE.user);
  hideTypingLoader();
  
  if (result && result.messages && result.messages.length > 0) {
    clearFallbackPolling();
    await Storage.saveMessages(result.messages);
    result.messages.forEach(msg => appendMessageDom(msg));
  } else {
    triggerFallbackPolling();
  }
});

// Listener for Enter to send message
DOM.composerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    DOM.composerForm.dispatchEvent(new Event('submit'));
  }
});

// 7. Interactive Message Event Submissions
async function handleInteractiveEvent(eventPayload) {
  console.log("Interactive event captured:", eventPayload);
  
  // Display standard outgoing text bubble matching click values for better user guidance
  let displayValue = '';
  if (eventPayload.type === 'button_click') {
    displayValue = eventPayload.buttonLabel;
  } else if (eventPayload.type === 'card_action') {
    displayValue = `${eventPayload.cardTitle} > ${eventPayload.actionLabel}`;
  } else if (eventPayload.type === 'form_submit') {
    displayValue = "Formulaire soumis";
  } else if (eventPayload.type === 'attachment_send') {
    displayValue = `Document joint: ${eventPayload.fileName}`;
  }

  const outgoingFeedback = {
    id: 'user_action_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
    type: 'text',
    timestamp: new Date().toISOString(),
    direction: 'outgoing',
    content: displayValue
  };

  await Storage.saveMessage(outgoingFeedback);
  appendMessageDom(outgoingFeedback);

  // Send Event to backend API (or simulate locally)
  showTypingLoader();
  const response = await Api.sendEvent(eventPayload, STATE.user);
  hideTypingLoader();

  if (response && response.messages && response.messages.length > 0) {
    clearFallbackPolling();
    await Storage.saveMessages(response.messages);
    response.messages.forEach(msg => appendMessageDom(msg));
  } else {
    triggerFallbackPolling();
  }
}

// 8. Dynamic Preferences Panel Sliders
function setupSlidePanels() {
  // Open / Close Panels
  DOM.profileBtn.addEventListener('click', () => {
    renderProfileFields();
    DOM.profilePanel.classList.remove('hidden');
  });
  DOM.profileBackBtn.addEventListener('click', () => {
    DOM.profilePanel.classList.add('hidden');
  });
  
  DOM.settingsBtn.addEventListener('click', () => {
    DOM.settingsPanel.classList.remove('hidden');
  });
  DOM.settingsBackBtn.addEventListener('click', () => {
    DOM.settingsPanel.classList.add('hidden');
  });
  
  // Profile Reset Event
  DOM.profileResetBtn.addEventListener('click', async () => {
    const confirmation = confirm("Voulez-vous réinitialiser l'application ? Vos messages et vos paramètres seront effacés définitivement.");
    if (!confirmation) return;
    
    STATE.isFallbackPolling = false;
    stopPolling();
    await Storage.clearUser();
    
    STATE.user = null;
    STATE.onboardingStep = 0;
    
    // Reload fields and return to onboarding slide
    DOM.profilePanel.classList.add('hidden');
    switchToScreen('onboarding');
    setupOnboardingCarousel();
  });
}

function renderProfileFields() {
  DOM.profileFieldsContainer.innerHTML = '';
  if (!STATE.user) return;
  
  const fieldsMap = {
    name: "Nom complet",
    phone: "Téléphone",
    email: "Adresse Email",
    country: "Pays d'apprentissage"
  };
  
  Object.entries(STATE.user).forEach(([key, val]) => {
    if (!val) return;
    const label = fieldsMap[key] || key;
    
    const div = document.createElement('div');
    div.className = 'profile-field-item';
    div.innerHTML = `
      <span class="profile-field-label">${label}</span>
      <span class="profile-field-value">${val}</span>
    `;
    DOM.profileFieldsContainer.appendChild(div);
  });
}

function setupPreferences() {
  // Theme Switching
  DOM.switchThemeInput.checked = STATE.theme === 'Dark';
  DOM.switchThemeInput.addEventListener('change', async (e) => {
    const themeString = e.target.checked ? 'Dark' : 'Light';
    STATE.theme = themeString;
    applyTheme(themeString);
    await Storage.saveState('theme', themeString);
  });
  
  // Push Notifications Setup
  DOM.switchNotifyInput.checked = STATE.notificationsEnabled;
  DOM.switchNotifyInput.addEventListener('change', async (e) => {
    const val = e.target.checked;
    if (val) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          STATE.notificationsEnabled = true;
          await Storage.saveState('notifications', true);
        } else {
          e.target.checked = false;
          alert("Les notifications ont été bloquées par le navigateur. Veuillez autoriser les permissions dans vos paramètres de site.");
        }
      } else {
        STATE.notificationsEnabled = true;
        await Storage.saveState('notifications', true);
      }
    } else {
      STATE.notificationsEnabled = false;
      await Storage.saveState('notifications', false);
    }
    updatePollingState();
  });
}

function applyTheme(theme) {
  if (theme === 'Dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// 9. Document Attachments Architecture
function setupAttachmentUpload() {
  DOM.attachmentBtn.addEventListener('click', () => {
    DOM.attachmentInput.click();
  });
  
  DOM.attachmentInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // File size safety
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) {
      alert("La taille du fichier dépasse la limite autorisée de 10 Mo.");
      return;
    }
    
    const formattedSize = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';
      
    // Read and translate to base64 for submission
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result;
      
      // Emit attachment upload event
      await handleInteractiveEvent({
        type: 'attachment_send',
        fileName: file.name,
        fileSize: formattedSize,
        mimeType: file.type,
        data: base64Data
      });
    };
    
    reader.readAsDataURL(file);
    
    // Reset file input value
    DOM.attachmentInput.value = '';
  });
}

// 10. Polling Loop
function updatePollingState() {
  if (Api.isSimulationMode()) {
    stopPolling();
    return;
  }

  // Poll if user enabled notifications OR if we are in fallback polling
  const shouldPoll = STATE.notificationsEnabled || STATE.isFallbackPolling;

  if (shouldPoll) {
    if (!STATE.pollingTimer) {
      startPollingLoop();
    }
  } else {
    stopPolling();
  }
}

function startPollingLoop() {
  //return;
  stopPolling();
  
  const interval = CONFIG.endpoints.pollingInterval || 5000;
  console.log(`[Polling] Loop started. Push Notifications Enabled: ${STATE.notificationsEnabled}, Fallback Active: ${STATE.isFallbackPolling}`);
  
  STATE.pollingTimer = setInterval(async () => {
    if (!STATE.user || STATE.activeScreen !== 'chat') return;
    
    const existing = await Storage.getMessages();
    const lastId = existing.length > 0 ? existing[existing.length - 1].id : '';
    
    const result = await Api.pollMessages(STATE.user, lastId);
    if (result && result.messages && result.messages.length > 0) {
      await Storage.saveMessages(result.messages);
      result.messages.forEach(msg => appendMessageDom(msg));
      
      // Stop the fallback loop if messages are received
      if (STATE.isFallbackPolling) {
        console.log("[Polling] Fallback received messages. Turning off fallback polling.");
        STATE.isFallbackPolling = false;
        updatePollingState();
      }
    }
  }, interval);
}

function triggerFallbackPolling() {
  //return;
  if (Api.isSimulationMode()) return;
  if (STATE.notificationsEnabled) return; // Already polling, no fallback needed
  
  if (!STATE.isFallbackPolling) {
    console.log("[Polling] Webhook did not send immediate messages. Activating fallback polling...");
    STATE.isFallbackPolling = true;
    updatePollingState();
  }
}

function clearFallbackPolling() {
  if (STATE.isFallbackPolling) {
    console.log("[Polling] Webhook responded immediately. Resetting fallback polling...");
    STATE.isFallbackPolling = false;
    updatePollingState();
  }
}

function stopPolling() {
  if (STATE.pollingTimer) {
    console.log("[Polling] Loop stopped.");
    clearInterval(STATE.pollingTimer);
    STATE.pollingTimer = null;
  }
}

// Start application bootstrap
document.addEventListener('DOMContentLoaded', initApp);
