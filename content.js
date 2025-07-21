if (window.isExtensionActive) {
  // Avoid running the script twice
} else {
  window.isExtensionActive = true;

  var turndownService = new TurndownService({
    codeBlockStyle: 'fenced'
  });

  // Add a specific rule for <pre> tags to handle them as code blocks
  turndownService.addRule('preToCodeBlock', {
    filter: 'pre',
    replacement: function (content, node) {
      const code = node.textContent || '';
      // Optionally, try to get the language from a class like 'language-js'
      const language = node.firstChild?.className?.match(/language-(\S+)/)?.[1] || '';
      return '\n\n```' + language + '\n' + code.trim() + '\n```\n\n';
    }
  });

  let selectedElement = null;

  // --- UI Elements ---
  const highlightOverlay = document.createElement('div');
  Object.assign(highlightOverlay.style, {
    position: 'absolute',
    backgroundColor: 'rgba(66, 133, 244, 0.3)', // DevTools-like blue
    border: '1px solid #4285F4',
    borderRadius: '3px',
    zIndex: '9998',
    pointerEvents: 'none' // Make sure it doesn't intercept mouse events
  });

  const infoLabel = document.createElement('div');
  Object.assign(infoLabel.style, {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    fontFamily: 'sans-serif',
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '3px',
    zIndex: '9999',
    pointerEvents: 'none'
  });

  const infoBanner = document.createElement('div');
  infoBanner.innerHTML = 'Select an element. <br><b>Click</b> to copy Markdown. <br><b>Shift+Click</b> to include metadata. <br>Press <b>Esc</b> to cancel.';
  Object.assign(infoBanner.style, {
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '5px',
    zIndex: '10000',
    fontSize: '16px',
    textAlign: 'center',
    lineHeight: '1.5'
  });

  document.body.appendChild(highlightOverlay);
  document.body.appendChild(infoLabel);
  document.body.appendChild(infoBanner);

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: '10000',
        fontSize: '16px'
    });
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 2000);
  }

  // --- Event Handlers ---
  function handleMouseOver(event) {
    // If the element is inside a pre, select the pre element itself
    const codeBlock = event.target.closest('pre');
    selectedElement = codeBlock || event.target;

    const rect = selectedElement.getBoundingClientRect();

    // Update highlight overlay
    highlightOverlay.style.width = `${rect.width}px`;
    highlightOverlay.style.height = `${rect.height}px`;
    highlightOverlay.style.top = `${rect.top + window.scrollY}px`;
    highlightOverlay.style.left = `${rect.left + window.scrollX}px`;

    // Update info label
    const tag = selectedElement.tagName.toLowerCase();
    const id = selectedElement.id ? `#${selectedElement.id}` : '';
    const classes = Array.from(selectedElement.classList).map(c => `.${c}`).join('');
    infoLabel.textContent = `${tag}${id}${classes}`;
    infoLabel.style.top = `${rect.top + window.scrollY - infoLabel.offsetHeight - 5}px`;
    infoLabel.style.left = `${rect.left + window.scrollX}px`;
  }

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    if (selectedElement) {
      // If the user clicked inside a code block, convert the whole block.
      const elementToConvert = selectedElement.closest('pre') || selectedElement;
      const html = elementToConvert.outerHTML;
      let markdown = turndownService.turndown(html);

      if (event.shiftKey) {
        const title = document.title;
        const url = window.location.href;
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const metadata = `---
title: ${title}
url: ${url}
description: ${description}
---

`;
        markdown = metadata + markdown;
      }

      navigator.clipboard.writeText(markdown).then(() => {
        showNotification('Copied to clipboard!');
        cleanup();
      }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy markdown.');
        cleanup();
      });
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      cleanup();
    }
  }

  // --- Cleanup ---
  function cleanup() {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown);
    
    if (highlightOverlay.parentNode) document.body.removeChild(highlightOverlay);
    if (infoLabel.parentNode) document.body.removeChild(infoLabel);
    if (infoBanner.parentNode) document.body.removeChild(infoBanner);

    window.isExtensionActive = false;
  }

  // --- Initialization ---
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, { capture: true, once: true });
  document.addEventListener('keydown', handleKeyDown);
}