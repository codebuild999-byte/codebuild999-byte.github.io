// Helper for consistent vector icons inside the chat UI (Lucide style mock)
export function getIconSvg(name, size = 18, color = 'currentColor') {
  const icons = {
    file: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
    download: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    calendar: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    user: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    send: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
    settings: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 1 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    info: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`,
    arrowRight: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
  };
  return icons[name] || '';
}

// Simple Markdown parser specifically designed for chat messages
export function parseMarkdown(text) {
  if (!text) return '';
  let html = text;
  
  // Clean any malicious inline HTML tags first to maintain security stability
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Re-encode safe entities needed for styling
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Bullet lists
  html = html.replace(/^[-\*]\s+(.*?)$/gm, '<li>$1</li>');
  // Wrap list tags
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul class="chat-md-list">$1</ul>');
  
  // Links: [label](href)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="chat-md-link" rel="noopener noreferrer">$1</a>');
  
  // Inline linebreaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Format Date/ISO String into "14:23"
export function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

// Create wrapper message bubble structure
function createBubbleWrapper(message, contentHtml, isEmbedBlock = false) {
  const container = document.createElement('div');
  container.id = message.id;
  container.className = `message-row ${message.direction}`;
  
  // Position label of time
  const time = formatTime(message.timestamp);
  
  if (isEmbedBlock) {
    container.className += ' embed-row';
    container.innerHTML = `
      <div class="embed-content">
        ${contentHtml}
        <div class="msg-meta-time">${time}</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="bubble">
        <div class="bubble-body">${contentHtml}</div>
        <div class="msg-meta-time">${time}</div>
      </div>
    `;
  }
  
  return container;
}

export const MessageRegistry = {
  registry: {},

  register(type, rendererFn) {
    this.registry[type] = rendererFn;
  },

  render(message, onEventEmit) {
    const renderer = this.registry[message.type] || this.registry['fallback'];
    if (!renderer) {
      return this.renderFallback(message);
    }
    return renderer(message, onEventEmit);
  },

  renderFallback(message) {
    const html = `
      <div class="fallback-bubble">
        <div class="fallback-header">
          ${getIconSvg('info', 16, '#E53E3E')}
          <span>Format de message non supporté (${message.type})</span>
        </div>
        <div class="fallback-meta">Une mise à jour de l'établissement est disponible pour soutenir ces nouveaux flux interactifs.</div>
      </div>
    `;
    return createBubbleWrapper(message, html);
  }
};

// 1. Text Renderer
MessageRegistry.register('text', (msg) => {
  const parsed = parseMarkdown(msg.content);
  return createBubbleWrapper(msg, parsed);
});

// 2. Buttons Renderer
MessageRegistry.register('buttons', (msg, emit) => {
  const headingText = msg.text ? `<p class="button-msg-heading">${parseMarkdown(msg.text)}</p>` : '';
  
  // Custom container layout for grid vs vertical buttons
  const layoutClass = msg.buttons && msg.buttons.length > 2 ? 'button-layout-grid' : 'button-layout-stack';
  
  let buttonsHtml = `<div class="button-msg-list ${layoutClass}">`;
  (msg.buttons || []).forEach((btn) => {
    buttonsHtml += `
      <button class="msg-interactive-btn" data-id="${btn.id}" data-label="${btn.label}">
        <span>${btn.label}</span>
      </button>
    `;
  });
  buttonsHtml += '</div>';

  const row = createBubbleWrapper(msg, headingText + buttonsHtml);
  
  // Attach event interaction
  row.querySelectorAll('.msg-interactive-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      emit({
        type: 'button_click',
        buttonId: btn.getAttribute('data-id'),
        buttonLabel: btn.getAttribute('data-label')
      });
    });
  });
  
  return row;
});

// 3. Images Renderer
MessageRegistry.register('images', (msg) => {
  const url = msg.url || '';
  const caption = msg.caption ? `<div class="image-caption">${parseMarkdown(msg.caption)}</div>` : '';
  const html = `
    <div class="image-bubble-container">
      <img src="${url}" class="chat-photo-img" loading="lazy" alt="Visual content" referrerPolicy="no-referrer">
      ${caption}
    </div>
  `;
  const row = createBubbleWrapper(msg, html, true);

  // Implement Fullscreen Preview Click handler
  const imgElement = row.querySelector('.chat-photo-img');
  if (imgElement) {
    imgElement.addEventListener('click', () => {
      // Create lightweight overlay portal
      const overlay = document.createElement('div');
      overlay.className = 'fullscreen-image-overlay';
      overlay.innerHTML = `
        <div class="fullscreen-close-btn">&times;</div>
        <img src="${url}" class="fullscreen-prime-img" referrerPolicy="no-referrer">
        ${msg.caption ? `<div class="fullscreen-caption">${msg.caption}</div>` : ''}
      `;
      document.body.appendChild(overlay);
      
      const closeOverlay = () => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 250);
      };
      
      overlay.addEventListener('click', closeOverlay);
      overlay.querySelector('.fullscreen-close-btn').addEventListener('click', closeOverlay);
    });
  }

  return row;
});

// 4. Files Renderer
MessageRegistry.register('files', (msg) => {
  const fileName = msg.fileName || 'document.pdf';
  const fileSize = msg.fileSize || 'N/A';
  const url = msg.url || '#';
  
  const html = `
    <div class="file-bubble-container">
      <div class="file-icon-box">
        ${getIconSvg('file', 24, '#0F4C81')}
      </div>
      <div class="file-details">
        <div class="file-name" title="${fileName}">${fileName}</div>
        <div class="file-meta">${fileSize} • PDF Document</div>
      </div>
      <a href="${url}" class="file-download-action-btn" download="${fileName}" aria-label="Télécharger">
        ${getIconSvg('download', 20, '#2BB673')}
      </a>
    </div>
  `;
  return createBubbleWrapper(msg, html, false);
});

// 5. Cards Renderer (Carousel layouts)
MessageRegistry.register('cards', (msg, emit) => {
  const cards = msg.cards || [];
  
  let cardsHtml = '<div class="cards-scroller-view">';
  cards.forEach((card, index) => {
    let cardButtonsHtml = '<div class="card-action-bar">';
    (card.buttons || []).forEach((btn) => {
      cardButtonsHtml += `
        <button class="card-action-btn" data-card-idx="${index}" data-action-id="${btn.id}" data-action-label="${btn.label}">
          ${btn.label}
        </button>
      `;
    });
    cardButtonsHtml += '</div>';

    cardsHtml += `
      <div class="feature-card-item">
        ${card.imageUrl ? `
          <div class="card-image-aspect">
            <img src="${card.imageUrl}" class="card-visual-header" loading="lazy" alt="${card.title}" referrerPolicy="no-referrer">
          </div>` : ''
        }
        <div class="card-content-body">
          <h3 class="card-title-text">${card.title}</h3>
          <p class="card-desc-text">${card.description || ''}</p>
          ${cardButtonsHtml}
        </div>
      </div>
    `;
  });
  cardsHtml += '</div>';

  const row = createBubbleWrapper(msg, cardsHtml, true);

  // Carousel item swipe listeners
  row.querySelectorAll('.card-action-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cardIdx = parseInt(btn.getAttribute('data-card-idx'), 10);
      const card = cards[cardIdx];
      emit({
        type: 'card_action',
        cardTitle: card ? card.title : '',
        actionId: btn.getAttribute('data-action-id'),
        actionLabel: btn.getAttribute('data-action-label')
      });
    });
  });

  return row;
});

// 6. Dynamic Form Renderer
MessageRegistry.register('form', (msg, emit) => {
  const formId = msg.formId || 'form_' + Date.now();
  const fields = msg.fields || [];
  const title = msg.title || 'Formulaire';
  const submitLabel = msg.submitLabel || 'Envoyer';

  let formFieldsHtml = '';
  fields.forEach((field) => {
    const requiredAttr = field.required ? 'required' : '';
    const name = field.name;
    const label = field.label || name;
    
    formFieldsHtml += `<div class="form-control">`;
    formFieldsHtml += `<label class="form-field-label">${label}${field.required ? ' <span class="required-star">*</span>' : ''}</label>`;

    if (field.type === 'select') {
      formFieldsHtml += `<select class="form-input-el form-select-el" name="${name}" ${requiredAttr}>`;
      formFieldsHtml += `<option value="" disabled selected>Choisir une option...</option>`;
      (field.options || []).forEach(opt => {
        formFieldsHtml += `<option value="${opt}">${opt}</option>`;
      });
      formFieldsHtml += `</select>`;
    } else if (field.type === 'textarea') {
      formFieldsHtml += `<textarea class="form-input-el form-textarea-el" name="${name}" rows="3" placeholder="${field.placeholder || ''}" ${requiredAttr}></textarea>`;
    } else {
      formFieldsHtml += `<input class="form-input-el" type="${field.type || 'text'}" name="${name}" placeholder="${field.placeholder || ''}" ${requiredAttr}>`;
    }
    formFieldsHtml += `</div>`;
  });

  const formBodyHtml = `
    <div class="embedded-form-card" id="form-container-${formId}">
      <h3 class="form-h3">${title}</h3>
      <form class="dynamic-chat-form" novalidate>
        ${formFieldsHtml}
        <button type="submit" class="form-submit-prime-btn">
          <span>${submitLabel}</span>
          ${getIconSvg('arrowRight', 18)}
        </button>
      </form>
    </div>
  `;

  // Wrap inside embed columns
  const row = createBubbleWrapper(msg, formBodyHtml, true);
  const formElement = row.querySelector('.dynamic-chat-form');

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Check form validation
    let isValid = true;
    const formData = {};
    const inputs = formElement.querySelectorAll('.form-input-el');
    
    inputs.forEach((input) => {
      const val = input.value.trim();
      const parent = input.closest('.form-control');
      if (input.hasAttribute('required') && !val) {
        isValid = false;
        parent.classList.add('field-error');
      } else {
        parent.classList.remove('field-error');
        formData[input.getAttribute('name')] = val;
      }
    });

    if (!isValid) {
      const firstError = formElement.querySelector('.field-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // Disable all fields after submission to prevent re-submitting stale data
    inputs.forEach(el => el.disabled = true);
    const submitBtn = formElement.querySelector('.form-submit-prime-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('submitted');
      submitBtn.innerHTML = `<span>Demande envoyée</span> ${getIconSvg('check', 18)}`;
    }

    // Emit event with payloads to main coordinator
    emit({
      type: 'form_submit',
      formId: formId,
      formData: formData
    });
  });

  return row;
});

// Register fallback under key fallback
MessageRegistry.register('fallback', (msg) => {
  return MessageRegistry.renderFallback(msg);
});
