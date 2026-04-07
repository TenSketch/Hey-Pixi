(function() {
  const script = document.currentScript;
  const botId = script.getAttribute('data-bot-id');
  if (!botId) return console.error('Hey-Pixi: data-bot-id is missing');

  const origin = new URL(script.src).origin;
  
  // Create styles
  const styles = `
    #pixi-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #pixi-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: #4f46e5;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
    }
    #pixi-widget-button:hover {
      transform: scale(1.05);
      background: #4338ca;
    }
    #pixi-widget-button svg {
      color: white;
      transition: transform 0.3s ease;
    }
    #pixi-widget-button.open svg {
      transform: rotate(90deg);
    }
    #pixi-iframe-container {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 40px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: bottom right;
    }
    #pixi-iframe-container.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    #pixi-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Create Container
  const container = document.createElement('div');
  container.id = 'pixi-widget-container';
  
  // Create Iframe Container
  const iframeContainer = document.createElement('div');
  iframeContainer.id = 'pixi-iframe-container';
  
  const iframe = document.createElement('iframe');
  iframe.id = 'pixi-iframe';
  iframe.src = `${origin}/widget/${botId}`;
  
  iframeContainer.appendChild(iframe);
  container.appendChild(iframeContainer);

  // Create Toggle Button
  const button = document.createElement('button');
  button.id = 'pixi-widget-button';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  button.onclick = () => {
    const isOpen = iframeContainer.classList.contains('open');
    if (isOpen) {
      iframeContainer.classList.remove('open');
      button.classList.remove('open');
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    } else {
      iframeContainer.classList.add('open');
      button.classList.add('open');
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }
  };

  container.appendChild(button);
  document.body.appendChild(container);
})();
