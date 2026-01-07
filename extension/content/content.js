// SearchThatTerm - Content Script
// Multi-popup support with streaming responses

(function () {
    'use strict';

    // Constants
    const MAX_DEEP_DIVE_POPUPS = 3;

    // Global state
    let triggerButton = null;
    let popups = []; // Array of popup objects
    let pendingQuickGlance = null; // Quick glance popup waiting for potential deep dive

    // Drag state
    let isDragging = false;
    let dragPopupId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // Remember last popup position
    let savedPopupPosition = null;

    // Icons
    const ICONS = {
        close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
        send: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
        chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
        sparkle: `<svg viewBox="0 0 24 24"><path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/></svg>`,
        drag: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`
    };

    // Generate unique popup ID
    let popupIdCounter = 0;
    function generatePopupId() {
        return 'stt-popup-' + (++popupIdCounter);
    }

    // Get deep dive popup count
    function getDeepDiveCount() {
        return popups.filter(p => p.isInChatMode).length;
    }

    // Get all popups count
    function getTotalPopupCount() {
        return popups.length;
    }

    // Update all popup titles with numbers
    function updatePopupNumbers() {
        const deepDivePopups = popups.filter(p => p.isInChatMode);
        const needsNumbers = deepDivePopups.length > 1;

        deepDivePopups.forEach((popup, index) => {
            const titleEl = popup.element.querySelector('.stt-title');
            if (titleEl) {
                if (needsNumbers) {
                    titleEl.textContent = `SearchThatTerm #${index + 1}`;
                } else {
                    titleEl.textContent = 'SearchThatTerm';
                }
            }
        });

        // Also update non-deep-dive popups (quick glance) - no numbers
        popups.filter(p => !p.isInChatMode).forEach(popup => {
            const titleEl = popup.element.querySelector('.stt-title');
            if (titleEl) {
                titleEl.textContent = 'SearchThatTerm';
            }
        });
    }

    // Initialize
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleDragMove);

    // Listen for streaming updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'streamUpdate') {
            handleStreamUpdate(message);
        }
    });

    function handleStreamUpdate(data) {
        // Find the popup that's currently loading
        const popup = popups.find(p => p.isLoading);
        if (!popup) return;

        switch (data.type) {
            case 'start':
                popup.streamingContent = '';
                popup.isLoading = true;
                if (popup.isInChatMode) {
                    updateChatWithStreaming(popup);
                } else {
                    renderPopup(popup);
                }
                break;

            case 'chunk':
                popup.streamingContent = data.content;
                updateStreamingContent(popup);
                break;

            case 'done':
                popup.isLoading = false;
                if (data.messageType === 'explanation') {
                    popup.chatMessages = [{ role: 'assistant', content: data.content }];
                } else if (data.messageType === 'chat') {
                    popup.chatMessages.push({ role: 'assistant', content: data.content });
                }
                popup.streamingContent = '';
                renderPopup(popup);

                if (popup.isInChatMode) {
                    setTimeout(() => popup.element?.querySelector('#stt-input')?.focus(), 50);
                }
                break;

            case 'error':
                popup.isLoading = false;
                if (data.messageType === 'explanation' || popup.chatMessages.length === 0) {
                    popup.chatMessages = [{ role: 'assistant', content: 'ERROR:' + data.error }];
                } else {
                    popup.chatMessages.push({ role: 'assistant', content: 'Sorry, an error occurred: ' + data.error });
                }
                popup.streamingContent = '';
                renderPopup(popup);
                break;
        }
    }

    function updateChatWithStreaming(popup) {
        const contentArea = popup.element.querySelector('#stt-content');
        if (!contentArea) return;

        const isNearBottom = contentArea.scrollHeight - contentArea.scrollTop - contentArea.clientHeight < 50;

        contentArea.innerHTML = `
      <div class="stt-messages">
        ${popup.chatMessages.map(msg => `
          <div class="stt-message stt-message-${msg.role}">
            ${msg.role === 'assistant' ? formatText(msg.content) : escapeHtml(msg.content)}
          </div>
        `).join('')}
        <div class="stt-message stt-message-assistant" id="stt-streaming-bubble">
          <span id="stt-streaming-text"><span class="stt-cursor"></span></span>
        </div>
      </div>
    `;

        if (isNearBottom) {
            contentArea.scrollTop = contentArea.scrollHeight;
        }
    }

    function updateStreamingContent(popup) {
        const streamingText = popup.element.querySelector('#stt-streaming-text');
        if (streamingText) {
            streamingText.innerHTML = formatText(popup.streamingContent) + '<span class="stt-cursor"></span>';

            const scrollContainer = popup.element.querySelector('#stt-content');
            if (scrollContainer) {
                const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 50;
                if (isNearBottom) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }
            }
        }
    }

    function handleMouseDown(e) {
        // Check if clicking on any popup
        const clickedOnPopup = popups.some(p => p.element?.contains(e.target));

        // Check if clicking on trigger button
        if (triggerButton?.contains(e.target)) {
            return;
        }

        if (clickedOnPopup) {
            return;
        }

        // Clicking outside all popups
        // If there's only one popup and it's NOT in chat mode, close it
        if (popups.length === 1 && !popups[0].isInChatMode) {
            closePopup(popups[0].id);
        }

        // Remove trigger button
        if (triggerButton) {
            removeTriggerButton();
        }
    }

    function handleMouseUp(e) {
        if (isDragging) {
            isDragging = false;
            dragPopupId = null;
            return;
        }

        if (triggerButton?.contains(e.target) || popups.some(p => p.element?.contains(e.target))) {
            return;
        }

        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text && text.length > 1 && text.length < 1000) {
                let rect = null;
                try {
                    const range = selection.getRangeAt(0);
                    rect = range.getBoundingClientRect();
                } catch (err) { }

                showTriggerButton(e, text, getContext(selection), rect);
            }
        }, 10);
    }

    function handleDragMove(e) {
        if (!isDragging || !dragPopupId) return;

        const popup = popups.find(p => p.id === dragPopupId);
        if (!popup) return;

        e.preventDefault();

        const newX = e.pageX - dragOffsetX;
        const newY = e.pageY - dragOffsetY;

        popup.element.style.left = `${newX}px`;
        popup.element.style.top = `${newY}px`;
        popup.position = { left: `${newX}px`, top: `${newY}px` };
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            // Close the most recent popup
            if (popups.length > 0) {
                closePopup(popups[popups.length - 1].id);
            }
            removeTriggerButton();
        }
    }

    function getContext(selection) {
        try {
            const anchorNode = selection.anchorNode;
            if (!anchorNode) return '';

            let container = anchorNode.parentElement;
            for (let i = 0; i < 3 && container; i++) {
                if (container.tagName === 'P' || container.tagName === 'DIV' || container.tagName === 'ARTICLE') {
                    const text = container.textContent.trim();
                    if (text.length > 0 && text.length < 2000) {
                        return text;
                    }
                }
                container = container.parentElement;
            }
        } catch (e) { }
        return '';
    }

    function showTriggerButton(e, text, context, rect) {
        removeTriggerButton();

        triggerButton = document.createElement('button');
        triggerButton.className = 'stt-trigger-btn';
        triggerButton.innerHTML = ICONS.sparkle;
        triggerButton.title = 'Explain this';

        const x = e.pageX + 10;
        const y = e.pageY - 45;

        triggerButton.style.left = `${x}px`;
        triggerButton.style.top = `${y}px`;

        triggerButton.onclick = function (clickEvent) {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            clickEvent.stopImmediatePropagation();
            createPopup(text, context, rect);
            return false;
        };

        triggerButton.onmousedown = function (mdEvent) {
            mdEvent.preventDefault();
            mdEvent.stopPropagation();
            mdEvent.stopImmediatePropagation();
            return false;
        };

        triggerButton.onmouseup = function (muEvent) {
            muEvent.preventDefault();
            muEvent.stopPropagation();
            muEvent.stopImmediatePropagation();
            return false;
        };

        document.body.appendChild(triggerButton);
    }

    function removeTriggerButton() {
        if (triggerButton) {
            triggerButton.remove();
            triggerButton = null;
        }
    }

    function createPopup(selectedText, contextText, selectionRect) {
        removeTriggerButton();

        const popupId = generatePopupId();

        const popupData = {
            id: popupId,
            element: null,
            selectedText: selectedText,
            contextText: contextText,
            chatMessages: [],
            isInChatMode: false,
            isLoading: true,
            streamingContent: '',
            position: null,
            showDeepDiveError: false
        };

        const popupEl = document.createElement('div');
        popupEl.className = 'stt-popup';
        popupEl.id = popupId;

        // Calculate position
        let x, y;

        // Offset each popup slightly if there are others
        const offset = popups.length * 30;

        if (savedPopupPosition && popups.length === 0) {
            x = parseInt(savedPopupPosition.left);
            y = parseInt(savedPopupPosition.top);
        } else if (selectionRect) {
            x = selectionRect.left + window.scrollX + offset;
            y = selectionRect.bottom + window.scrollY + 10 + offset;
        } else {
            x = window.scrollX + (window.innerWidth / 2) - 190 + offset;
            y = window.scrollY + (window.innerHeight / 3) + offset;
        }

        // Keep within viewport
        const viewportWidth = window.innerWidth;
        if (x + 380 > viewportWidth + window.scrollX) {
            x = viewportWidth + window.scrollX - 400;
        }
        if (x < window.scrollX + 10) {
            x = window.scrollX + 10;
        }

        popupEl.style.left = `${Math.max(10, x)}px`;
        popupEl.style.top = `${Math.max(10, y)}px`;

        popupData.element = popupEl;
        popupData.position = { left: popupEl.style.left, top: popupEl.style.top };

        popups.push(popupData);

        renderPopup(popupData);
        document.body.appendChild(popupEl);

        // Request explanation
        chrome.runtime.sendMessage({
            action: 'getExplanation',
            text: selectedText,
            context: contextText
        });
    }

    function closePopup(popupId) {
        const index = popups.findIndex(p => p.id === popupId);
        if (index === -1) return;

        const popup = popups[index];

        // Save position if this is the last popup
        if (popups.length === 1) {
            savedPopupPosition = popup.position;
        }

        popup.element.remove();
        popups.splice(index, 1);

        // Update numbering on remaining popups
        updatePopupNumbers();
    }

    function renderPopup(popup) {
        if (!popup.element) return;

        const deepDiveCount = getDeepDiveCount();
        const totalCount = getTotalPopupCount();

        // Determine if we need to show close button (always show if multiple popups or in chat mode)
        const showCloseButton = totalCount > 1 || popup.isInChatMode;

        // Determine title (with number if multiple deep dives)
        let title = 'SearchThatTerm';
        if (popup.isInChatMode && deepDiveCount > 1) {
            const deepDiveIndex = popups.filter(p => p.isInChatMode).findIndex(p => p.id === popup.id);
            title = `SearchThatTerm #${deepDiveIndex + 1}`;
        }

        popup.element.innerHTML = `
      <div class="stt-header" id="stt-drag-handle-${popup.id}">
        <div class="stt-header-left">
          <div class="stt-drag-icon" title="Drag to move">${ICONS.drag}</div>
          <div class="stt-logo">${ICONS.sparkle}</div>
          <span class="stt-title">${title}</span>
        </div>
        <button class="stt-close-btn ${showCloseButton ? '' : 'stt-close-hidden'}" id="stt-close-${popup.id}">${ICONS.close}</button>
      </div>
      
      <div class="stt-selected-text">
        <div class="stt-selected-label">Selected Text</div>
        <div class="stt-selected-content">${escapeHtml(popup.selectedText)}</div>
      </div>
      
      <div class="stt-content" id="stt-content">
        ${renderContent(popup)}
      </div>
      
      ${popup.isInChatMode ? renderInputArea(popup) : ''}
    `;

        // Attach handlers
        attachPopupHandlers(popup);
    }

    function attachPopupHandlers(popup) {
        const dragHandle = popup.element.querySelector(`#stt-drag-handle-${popup.id}`);
        if (dragHandle) {
            dragHandle.style.cursor = 'grab';

            dragHandle.onmousedown = function (e) {
                if (e.target.closest(`#stt-close-${popup.id}`)) return;

                e.preventDefault();
                isDragging = true;
                dragPopupId = popup.id;
                dragHandle.style.cursor = 'grabbing';

                const rect = popup.element.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
            };

            dragHandle.onmouseup = function () {
                isDragging = false;
                dragHandle.style.cursor = 'grab';
            };
        }

        // Close button
        const closeBtn = popup.element.querySelector(`#stt-close-${popup.id}`);
        if (closeBtn) {
            closeBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                closePopup(popup.id);
            };
        }

        // Dive deeper button
        const diveBtn = popup.element.querySelector(`#stt-dive-btn-${popup.id}`);
        if (diveBtn) {
            diveBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Check if we can open another deep dive
                if (getDeepDiveCount() >= MAX_DEEP_DIVE_POPUPS) {
                    popup.showDeepDiveError = true;
                    renderPopup(popup);
                    return;
                }

                popup.isInChatMode = true;
                popup.showDeepDiveError = false;
                renderPopup(popup);
                updatePopupNumbers();
                setTimeout(() => popup.element?.querySelector('#stt-input')?.focus(), 100);
            };
        }

        if (popup.isInChatMode) {
            attachInputListeners(popup);
        }

        // Scroll to bottom if in chat mode (on initial render)
        if (popup.isInChatMode && !popup.isLoading) {
            const content = popup.element.querySelector('#stt-content');
            if (content) content.scrollTop = content.scrollHeight;
        }
    }

    function renderContent(popup) {
        // Initial loading
        if (popup.isLoading && popup.chatMessages.length === 0 && !popup.streamingContent) {
            return `
        <div class="stt-loading">
          <div class="stt-spinner"></div>
          <span>Thinking...</span>
        </div>
      `;
        }

        // Streaming initial explanation
        if (popup.isLoading && !popup.isInChatMode && popup.streamingContent) {
            return `
        <div class="stt-explanation">
          <span id="stt-streaming-text">${formatText(popup.streamingContent)}<span class="stt-cursor"></span></span>
        </div>
      `;
        }

        // Chat mode
        if (popup.isInChatMode) {
            return renderChatMessages(popup);
        }

        // Show explanation (completed)
        const explanation = popup.chatMessages.length > 0 ? popup.chatMessages[0].content : '';

        if (explanation.startsWith('ERROR:')) {
            return `
        <div class="stt-error">
          <span class="stt-error-icon">⚠️</span>
          ${escapeHtml(explanation.replace('ERROR:', ''))}
        </div>
      `;
        }

        return `
      <div class="stt-explanation">${formatText(explanation)}</div>
      <div class="stt-dive-deeper">
        <button class="stt-dive-btn" id="stt-dive-btn-${popup.id}">
          ${ICONS.chat}
          <span>Dive Deeper</span>
        </button>
        ${popup.showDeepDiveError ? `
          <div class="stt-dive-error">
            ⚠️ Maximum 3 conversations open. Close one to continue.
          </div>
        ` : ''}
      </div>
    `;
    }

    function renderChatMessages(popup) {
        let html = `<div class="stt-messages">`;

        popup.chatMessages.forEach(msg => {
            html += `
        <div class="stt-message stt-message-${msg.role}">
          ${msg.role === 'assistant' ? formatText(msg.content) : escapeHtml(msg.content)}
        </div>
      `;
        });

        if (popup.isLoading && popup.streamingContent) {
            html += `
        <div class="stt-message stt-message-assistant" id="stt-streaming-bubble">
          <span id="stt-streaming-text">${formatText(popup.streamingContent)}<span class="stt-cursor"></span></span>
        </div>
      `;
        }

        html += `</div>`;
        return html;
    }

    function renderInputArea(popup) {
        return `
      <div class="stt-input-area">
        <div class="stt-input-wrapper">
          <textarea 
            class="stt-input" 
            id="stt-input" 
            placeholder="Ask a follow-up question..."
            rows="1"
            ${popup.isLoading ? 'disabled' : ''}
          ></textarea>
          <button class="stt-send-btn" id="stt-send-${popup.id}" ${popup.isLoading ? 'disabled' : ''}>
            ${ICONS.send}
          </button>
        </div>
        <div class="stt-quick-actions">
          <button class="stt-quick-btn" data-prompt="Explain in simpler terms" ${popup.isLoading ? 'disabled' : ''}>Simplify</button>
          <button class="stt-quick-btn" data-prompt="Give me an example" ${popup.isLoading ? 'disabled' : ''}>Example</button>
          <button class="stt-quick-btn" data-prompt="Why is this important?" ${popup.isLoading ? 'disabled' : ''}>Why important?</button>
        </div>
      </div>
    `;
    }

    function attachInputListeners(popup) {
        const input = popup.element.querySelector('#stt-input');
        const sendBtn = popup.element.querySelector(`#stt-send-${popup.id}`);
        const quickBtns = popup.element.querySelectorAll('.stt-quick-btn');

        if (input) {
            input.onkeydown = function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(popup);
                }
            };

            input.oninput = function () {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 100) + 'px';
            };
        }

        if (sendBtn) {
            sendBtn.onclick = function (e) {
                e.preventDefault();
                sendMessage(popup);
            };
        }

        if (quickBtns) {
            quickBtns.forEach(btn => {
                btn.onclick = function (e) {
                    e.preventDefault();
                    if (popup.isLoading) return;
                    const prompt = btn.dataset.prompt;
                    if (prompt && input) {
                        input.value = prompt;
                        sendMessage(popup);
                    }
                };
            });
        }
    }

    function sendMessage(popup) {
        const input = popup.element?.querySelector('#stt-input');
        if (!input || popup.isLoading) return;

        const message = input.value.trim();
        if (!message) return;

        popup.chatMessages.push({ role: 'user', content: message });

        input.value = '';
        input.style.height = 'auto';
        popup.isLoading = true;
        popup.streamingContent = '';

        updateChatWithStreaming(popup);

        const apiMessages = popup.chatMessages
            .filter((m, i) => i > 0 || m.role === 'user')
            .map(m => ({ role: m.role, content: m.content }));

        chrome.runtime.sendMessage({
            action: 'chat',
            messages: apiMessages,
            selectedText: popup.selectedText
        });
    }

    function formatText(text) {
        if (!text) return '';

        let formatted = escapeHtml(text);
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
