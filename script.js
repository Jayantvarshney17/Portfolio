/**
 * Cyber-Deck OS Portfolio Controller
 * Created by Jayant Varshney
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- SYSTEM STATES ---
  const sysState = {
    activeWindow: null,
    highestZIndex: 100,
    volume: 0.5,
    audioEnabled: false,
    particlesEnabled: true,
    audioCtx: null,
    ambientSynth: null,
    sfxGainNode: null,
    githubRepos: []
  };

  // Selectors
  const desktopSpace = document.getElementById('desktop-space');
  const customCursor = document.getElementById('custom-cursor');
  const systemClock = document.getElementById('system-clock');
  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');

  // --- CUSTOM NEON CURSOR CONTROLLER ---
  if (customCursor) {
    document.addEventListener('mousemove', (e) => {
      customCursor.style.left = `${e.clientX}px`;
      customCursor.style.top = `${e.clientY}px`;
    });

    document.addEventListener('mousedown', () => {
      customCursor.classList.add('clicked');
      playClickSound();
    });

    document.addEventListener('mouseup', () => {
      customCursor.classList.remove('clicked');
    });

    // Hover triggers for interactive elements
    const updateInteractiveHovers = () => {
      const targets = 'a, button, .desktop-icon, .window-header, .control-btn, .theme-option, .toggle-switch, .cert-card, .slider-volume';
      document.querySelectorAll(targets).forEach(el => {
        el.addEventListener('mouseenter', () => customCursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => customCursor.classList.remove('hovered'));
      });
    };
    updateInteractiveHovers();
    // Re-bind when DOM changes
    const observer = new MutationObserver(updateInteractiveHovers);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // --- CLOCK & NET STATISTICS ---
  const updateSystemClock = () => {
    if (systemClock) {
      const now = new Date();
      const timeStr = now.toUTCString().replace('GMT', 'UTC');
      systemClock.textContent = timeStr;
    }
  };
  setInterval(updateSystemClock, 1000);
  updateSystemClock();

  // Mock Latency fluctuate
  const pingIndicator = document.getElementById('ping-indicator');
  if (pingIndicator) {
    setInterval(() => {
      const randomPing = Math.floor(Math.random() * 12) + 12;
      pingIndicator.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>LATENCY: ${randomPing}ms
      `;
    }, 4000);
  }

  // --- WINDOW MANAGEMENT ---
  const windows = document.querySelectorAll('.window');
  const dockBtns = document.querySelectorAll('.dock-btn');
  const desktopIcons = document.querySelectorAll('.desktop-icon');

  const bringToFront = (win) => {
    if (!win) return;
    sysState.highestZIndex += 2;
    win.style.zIndex = sysState.highestZIndex;
    windows.forEach(w => w.classList.remove('active'));
    win.classList.add('active');
    sysState.activeWindow = win;

    // Highlight dock btn
    const winId = win.id;
    dockBtns.forEach(btn => {
      if (btn.getAttribute('data-window') === winId) {
        btn.classList.add('active-indicator');
      } else {
        // Only keep active-indicator if the window is open and not minimized
        const matchingWin = document.getElementById(btn.getAttribute('data-window'));
        if (!matchingWin || matchingWin.classList.contains('minimized') || matchingWin.style.display === 'none') {
          btn.classList.remove('active-indicator');
        }
      }
    });
  };

  const openWindow = (winId) => {
    const win = document.getElementById(winId);
    if (!win) return;
    
    // Check if minimized or closed
    win.style.display = 'flex';
    win.classList.remove('minimized');
    bringToFront(win);
    playSwooshSound(true);
    showToast(`Initializing core: ${winId.replace('win-', '').toUpperCase()}`, 'info');
  };

  const minimizeWindow = (win) => {
    win.classList.add('minimized');
    playSwooshSound(false);
    
    // De-activate indicator
    const btn = document.querySelector(`.dock-btn[data-window="${win.id}"]`);
    if (btn) btn.classList.remove('active-indicator');
  };

  const closeWindow = (win) => {
    win.style.display = 'none';
    playSwooshSound(false);
    
    const btn = document.querySelector(`.dock-btn[data-window="${win.id}"]`);
    if (btn) btn.classList.remove('active-indicator');
  };

  const toggleWindow = (winId) => {
    const win = document.getElementById(winId);
    if (!win) return;

    if (win.style.display === 'none' || win.classList.contains('minimized')) {
      openWindow(winId);
    } else if (win.classList.contains('active')) {
      minimizeWindow(win);
    } else {
      bringToFront(win);
    }
  };

  // Add click events to desktop icons
  desktopIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const winId = icon.getAttribute('data-open');
      openWindow(winId);
    });
  });

  // Add click events to dock buttons
  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const winId = btn.getAttribute('data-window');
      toggleWindow(winId);
    });
  });

  // Bind window header control buttons
  windows.forEach(win => {
    const header = win.querySelector('.window-header');
    const closeBtn = win.querySelector('.control-btn.close');
    const minBtn = win.querySelector('.control-btn.minimize');
    const maxBtn = win.querySelector('.control-btn.maximize');

    // Focus on click
    win.addEventListener('mousedown', () => bringToFront(win));

    if (closeBtn) closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(win);
    });

    if (minBtn) minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(win);
    });

    if (maxBtn) maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      win.classList.toggle('maximized');
      playClickSound();
    });

    // Double click header to maximize
    if (header) {
      header.addEventListener('dblclick', () => {
        if (window.innerWidth > 768) {
          win.classList.toggle('maximized');
          playClickSound();
        }
      });
    }

    // Window Draggability
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let winStartX = 0;
    let winStartY = 0;

    if (header) {
      header.addEventListener('mousedown', (e) => {
        if (win.classList.contains('maximized') || window.innerWidth <= 768) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        winStartX = win.offsetLeft;
        winStartY = win.offsetTop;
        bringToFront(win);
        desktopSpace.style.userSelect = 'none';
        e.preventDefault();
      });
    }

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      
      let newX = winStartX + dx;
      let newY = winStartY + dy;

      // Keep inside boundary values
      const maxLeft = window.innerWidth - 80;
      const maxTop = window.innerHeight - 80;
      if (newX < -200) newX = -200;
      if (newX > maxLeft) newX = maxLeft;
      if (newY < 0) newY = 0;
      if (newY > maxTop) newY = maxTop;

      win.style.left = `${newX}px`;
      win.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        desktopSpace.style.userSelect = 'auto';
      }
    });

    // Window Resizability
    const handle = win.querySelector('.resize-handle');
    let isResizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let winStartW = 0;
    let winStartH = 0;

    if (handle) {
      handle.addEventListener('mousedown', (e) => {
        if (win.classList.contains('maximized') || window.innerWidth <= 768) return;
        isResizing = true;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        winStartW = win.offsetWidth;
        winStartH = win.offsetHeight;
        bringToFront(win);
        desktopSpace.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation(); // prevent drag trigger
      });
    }

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;
      
      const newWidth = Math.max(340, winStartW + dx);
      const newHeight = Math.max(220, winStartH + dy);

      win.style.width = `${newWidth}px`;
      win.style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        desktopSpace.style.userSelect = 'auto';
      }
    });
  });

  // Open default startup windows
  setTimeout(() => {
    openWindow('win-bio');
    if (window.innerWidth > 992) {
      openWindow('win-terminal');
    }
  }, 1000);

  // --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
  const initAudio = () => {
    if (sysState.audioCtx) return;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      sysState.audioCtx = new AudioContext();
      
      // Global volume control node
      sysState.sfxGainNode = sysState.audioCtx.createGain();
      sysState.sfxGainNode.gain.setValueAtTime(sysState.volume, sysState.audioCtx.currentTime);
      sysState.sfxGainNode.connect(sysState.audioCtx.destination);
      
      sysState.audioEnabled = true;
      showToast('Neural audio stream active.', 'success');
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  };

  const playClickSound = () => {
    if (!sysState.audioCtx || !sysState.audioEnabled) return;
    
    // Ensure Context is running
    if (sysState.audioCtx.state === 'suspended') {
      sysState.audioCtx.resume();
    }

    try {
      const osc = sysState.audioCtx.createOscillator();
      const gain = sysState.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(sysState.sfxGainNode);

      // Cyber click tick parameters
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, sysState.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, sysState.audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.1, sysState.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sysState.audioCtx.currentTime + 0.05);

      osc.start();
      osc.stop(sysState.audioCtx.currentTime + 0.06);
    } catch (err) {
      console.error(err);
    }
  };

  const playSwooshSound = (isOpen = true) => {
    if (!sysState.audioCtx || !sysState.audioEnabled) return;
    
    try {
      const osc = sysState.audioCtx.createOscillator();
      const gain = sysState.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(sysState.sfxGainNode);

      osc.type = 'triangle';
      
      if (isOpen) {
        osc.frequency.setValueAtTime(200, sysState.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, sysState.audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.01, sysState.audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, sysState.audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, sysState.audioCtx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(500, sysState.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, sysState.audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, sysState.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, sysState.audioCtx.currentTime + 0.22);
      }

      osc.start();
      osc.stop(sysState.audioCtx.currentTime + 0.25);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAmbientDrone = (enable) => {
    if (!sysState.audioCtx) return;

    if (enable) {
      try {
        if (sysState.ambientSynth) return;

        // Create low hum synth drone
        const osc1 = sysState.audioCtx.createOscillator();
        const osc2 = sysState.audioCtx.createOscillator();
        const lfo = sysState.audioCtx.createOscillator();
        const lfoGain = sysState.audioCtx.createGain();
        const filter = sysState.audioCtx.createBiquadFilter();
        const gainNode = sysState.audioCtx.createGain();

        // Tune
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(55, sysState.audioCtx.currentTime); // A1 note
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(55.3, sysState.audioCtx.currentTime); // detuned low frequency

        lfo.frequency.setValueAtTime(0.2, sysState.audioCtx.currentTime); // slow LFO
        lfoGain.gain.setValueAtTime(12, sysState.audioCtx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, sysState.audioCtx.currentTime);
        filter.Q.setValueAtTime(3, sysState.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.06, sysState.audioCtx.currentTime); // keep quiet

        // Connections
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency); // modulate filter frequency

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(sysState.audioCtx.destination);

        osc1.start();
        osc2.start();
        lfo.start();

        sysState.ambientSynth = {
          oscillators: [osc1, osc2, lfo],
          gainNode: gainNode
        };
      } catch (err) {
        console.error("Failed to play drone", err);
      }
    } else {
      if (sysState.ambientSynth) {
        sysState.ambientSynth.oscillators.forEach(o => {
          try { o.stop(); } catch(e){}
        });
        sysState.ambientSynth = null;
      }
    }
  };

  // Bind settings toggles
  const toggleAudioCheckbox = document.getElementById('toggle-audio');
  const volumeSlider = document.getElementById('volume-control');

  if (toggleAudioCheckbox) {
    toggleAudioCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        initAudio();
        toggleAmbientDrone(true);
      } else {
        toggleAmbientDrone(false);
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      sysState.volume = parseFloat(e.target.value);
      if (sysState.sfxGainNode) {
        sysState.sfxGainNode.gain.setValueAtTime(sysState.volume, sysState.audioCtx.currentTime);
      }
    });
  }

  // Bind mouse clicks to audio init once
  document.addEventListener('click', () => {
    if (toggleAudioCheckbox && toggleAudioCheckbox.checked && !sysState.audioCtx) {
      initAudio();
      toggleAmbientDrone(true);
    }
  });

  // --- THEME SWAP CONTROLLER ---
  const themeOptions = document.querySelectorAll('.theme-option');
  themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      themeOptions.forEach(x => x.classList.remove('selected'));
      opt.classList.add('selected');
      const selectedTheme = opt.getAttribute('data-theme');
      document.body.setAttribute('data-theme', selectedTheme);
      playClickSound();
      showToast(`Interface style swapped to ${selectedTheme.toUpperCase()}`, 'info');
    });
  });

  // --- BACKGROUND CANVAS (INTERACTIVE PARTICLES) ---
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let particles = [];
  const mouse = { x: null, y: null, radius: 140 };

  const resizeCanvas = () => {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }
  };

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.baseX = this.x;
      this.baseY = this.y;
      this.radius = Math.random() * 2 + 1;
      // Drift speeds
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
    }

    draw() {
      if (!ctx) return;
      const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#00f0ff';
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    update() {
      // Drift particles slightly
      this.x += this.vx;
      this.y += this.vy;

      // Bounce limits
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      // Repulsion force from mouse cursor
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * 5;
          const directionY = forceDirectionY * force * 5;
          
          this.x -= directionX;
          this.y -= directionY;
        }
      }
    }
  }

  const initParticles = () => {
    particles = [];
    if (!canvas) return;
    
    // Denser on desktop, sparser on mobile
    const densityDivisor = window.innerWidth < 768 ? 20000 : 9000;
    const numberOfParticles = (canvas.width * canvas.height) / densityDivisor;
    
    for (let i = 0; i < numberOfParticles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push(new Particle(x, y));
    }
  };

  const animateParticles = () => {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (sysState.particlesEnabled) {
      // Accent styling variables
      const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#00f0ff';
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Connect lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 90) {
            const opacity = (1 - (distance / 90)) * 0.15;
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1.0; // reset
          }
        }
      }
    }

    requestAnimationFrame(animateParticles);
  };

  if (canvas) {
    window.addEventListener('resize', resizeCanvas);
    
    desktopSpace.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    desktopSpace.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    resizeCanvas();
    animateParticles();
  }

  // Toggle particles setting
  const toggleParticlesCheckbox = document.getElementById('toggle-particles');
  if (toggleParticlesCheckbox) {
    toggleParticlesCheckbox.addEventListener('change', (e) => {
      sysState.particlesEnabled = e.target.checked;
      playClickSound();
    });
  }



  // --- TERMINAL COMMAND INTERPRETER ---
  const terminalHistory = document.getElementById('terminal-history');
  const terminalInput = document.getElementById('terminal-input-field');

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      // Keystroke beep
      playClickSound();
      
      if (e.key === 'Enter') {
        const cmdText = terminalInput.value.trim();
        terminalInput.value = '';
        
        if (cmdText) {
          processCommand(cmdText);
        }
      }
    });

    // Make clicking anywhere in the terminal content box focus the input
    const winTerminal = document.getElementById('win-terminal');
    if (winTerminal) {
      winTerminal.addEventListener('click', () => {
        terminalInput.focus();
      });
    }
  }

  const printTerminalLine = (text, className = '') => {
    if (!terminalHistory) return;
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.innerHTML = text;
    terminalHistory.appendChild(line);
    
    // Auto scroll bottom
    terminalHistory.scrollTop = terminalHistory.scrollHeight;
  };

  const processCommand = (cmdStr) => {
    // Echo the command typed
    printTerminalLine(`
      <div class="terminal-prompt-line">
        <span class="terminal-prompt-user">jayant@cyberdeck</span><span class="terminal-prompt-symbol">:~$</span>
        <span>${cmdStr}</span>
      </div>
    `);

    const parts = cmdStr.toLowerCase().split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        printTerminalLine(`
Authorized operations directory:
  <span style="color:var(--accent)">about / cat bio</span>   - Print biography details
  <span style="color:var(--accent)">projects / ls</span>      - List engineered products
  <span style="color:var(--accent)">experience / log</span>    - Display corporate timeline
  <span style="color:var(--accent)">certificates</span>        - Display credentials
  <span style="color:var(--accent)">skills</span>              - Print skills metrics dossier
  <span style="color:var(--accent)">neofetch</span>            - Deploy system diagnostic stats
  <span style="color:var(--accent)">theme [name]</span>        - Swap UI style (cyberdeck, synthwave, matrix, cyberpunk)
  <span style="color:var(--accent)">synth [on/off]</span>      - Toggle background soundscapes
  <span style="color:var(--accent)">hack</span>                - Engage cybernet sub-matrix
  <span style="color:var(--accent)">clear</span>               - Wipe log cache
        `);
        break;

      case 'about':
      case 'bio':
      case 'cat':
        if (cmd === 'cat' && args[0] !== 'bio' && args[0] !== 'dossier.bin') {
          printTerminalLine(`cat: file not found. Try 'cat bio'`);
          break;
        }
        printTerminalLine(`
<strong>JAYANT VARSHNEY | SOFTWARE & MACHINE LEARNING ENGINEER</strong>
------------------------------------------------------------------------
I am a builder specializing in algorithms, data structures, and intelligent AI frameworks.
My interests include machine learning pipeline scaling, containerized cloud engineering,
and interactive high-performance frontends.

Email: jatinvarshney939@gmail.com
Phone: +91 8791733065
GitHub: https://github.com/Jayantvarshney17
        `);
        break;

      case 'projects':
      case 'ls':
        if (cmd === 'ls' && args.length > 0 && args[0] !== 'projects' && args[0] !== 'projects.dir') {
          printTerminalLine(`ls: directory not found. Try 'ls projects'`);
          break;
        }
        
        let outputText = `
Listing directories in /home/jayant/projects:
  - <strong>First Aid - Disease Prediction</strong> [ML Showcase]
    Symptoms classifier predicting medical conditions.
    URL: <a href="https://first-aid-wqvr.onrender.com/" target="_blank" style="color:var(--accent);">first-aid-wqvr.onrender.com</a>
  
  - <strong>Eagle Insight</strong> [CV Research]
    Django + OpenCV stolen car alert license plate trigger.
    Research Paper: <a href="https://www.erpublications.com/uploaded_files/download/mr-rohit-yadav-dheeraj-varshney-abhay-kumar-giri-jayant-varshney_UWUce.pdf" target="_blank" style="color:var(--accent)">Download Publication</a>
        `;
        
        if (sysState.githubRepos && sysState.githubRepos.length > 0) {
          outputText += `<br><strong>Dynamic public repositories from GitHub API:</strong>`;
          sysState.githubRepos.forEach(repo => {
            const lang = repo.language ? ` [${repo.language}]` : '';
            const stars = repo.stargazers_count > 0 ? ` [★:${repo.stargazers_count}]` : '';
            const desc = repo.description ? `<br>    ${repo.description}` : '';
            outputText += `<br>  - <strong>${repo.name}</strong>${lang}${stars}${desc}<br>    URL: <a href="${repo.html_url}" target="_blank" style="color:var(--accent);">${repo.html_url.replace('https://', '')}</a>`;
          });
        } else {
          outputText += `<br><em>[GitHub API data currently loading or API rate limit reached]</em>`;
        }
        
        printTerminalLine(outputText);
        break;

      case 'experience':
      case 'log':
        printTerminalLine(`
Displaying /sys/log/internships:
  [2024-01] - [2024-02]  <strong>Dabotic India Pvt. Ltd.</strong>
              Position: Web Development Intern
              Scope: Real-time web applications, Quiz App, Landing Page, responsive UI/UX, agile timelines.

  [2023-06] - [2023-09]  <strong>GUVI (in collaboration with HCL)</strong>
              Position: Python Trainee
              Scope: OOP training, Data Structures & Algorithms, file & exception handling, modular scripts.
        `);
        break;

      case 'certificates':
        printTerminalLine(`
Displaying certified credentials registry:
  - Research Publication (Deloitte Forage) - [July 2025]
  - Research Publication (ER Publication) - [April 2025]
  - NPTEL Cloud IoT & Edge ML - [April 2025]
  - Python Programming (Skill Void 3x) - [September 2024]
  - Full Stack Development (Cetpa Infotech) - [November 2023]
  - AI for India 2.0 (Guvi Skill India) - [August 2023]
  - Python (Guvi HCL) - [August 2023]
  - Machine Learning (Pantech Solution) - [January 2023]
        `);
        break;

      case 'skills':
        printTerminalLine(`
Retrieving skills diagnostics...
------------------------------------------------------------------------
[====================] 92% - Python Engineering (OOP, scripting)
[==================  ] 88% - Machine Learning (SciKit, OpenCV, models)
[=================   ] 85% - Frontend Development (HTML, Vanilla CSS, JS)
[===============     ] 78% - Database & Backend API (PHP, Django, SQL)
[==============      ] 72% - Cloud & IoT Integration (Edge computing, NPTEL)
        `);
        break;

      case 'neofetch':
        printTerminalLine(`
<span style="color:var(--accent)">      .---.       </span>  <strong>jayant@cyberdeck</strong>
<span style="color:var(--accent)">     /     \\      </span>  ----------------
<span style="color:var(--accent)">     \\_.._/       </span>  <strong>OS</strong>: CyberDeck Portfolio v3.9
<span style="color:var(--accent)">     //||\\\\       </span>  <strong>Uptime</strong>: ${Math.floor(performance.now()/1000)}s
<span style="color:var(--accent)">    // || \\\\      </span>  <strong>Shell</strong>: bash / terminal.sh
<span style="color:var(--accent)">   //  ||  \\\\     </span>  <strong>Resolution</strong>: ${window.innerWidth}x${window.innerHeight}
<span style="color:var(--accent)">  //___||___\\\\    </span>  <strong>CPU</strong>: WebOS Mock Neural Octa-Core
<span style="color:var(--accent)">  \`-----------'   </span>  <strong>Memory</strong>: 4.1 GB / 16.0 GB (Virtual)
        `);
        break;

      case 'theme':
        const targetTheme = args[0];
        const validThemes = ['cyberdeck', 'synthwave', 'matrix', 'cyberpunk'];
        if (targetTheme && validThemes.includes(targetTheme)) {
          document.body.setAttribute('data-theme', targetTheme);
          // Sync options
          themeOptions.forEach(opt => {
            if (opt.getAttribute('data-theme') === targetTheme) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
          printTerminalLine(`Theme successfully switched to: <span style="color:var(--accent)">${targetTheme}</span>`);
        } else {
          printTerminalLine(`Error: specify a valid theme name. Usage: theme [cyberdeck | synthwave | matrix | cyberpunk]`);
        }
        break;

      case 'synth':
        const act = args[0];
        if (act === 'on') {
          initAudio();
          toggleAmbientDrone(true);
          if (toggleAudioCheckbox) toggleAudioCheckbox.checked = true;
          printTerminalLine(`Ambient synthesizer enabled. Soundwave active.`);
        } else if (act === 'off') {
          toggleAmbientDrone(false);
          if (toggleAudioCheckbox) toggleAudioCheckbox.checked = false;
          printTerminalLine(`Ambient synthesizer disabled.`);
        } else {
          printTerminalLine(`Usage: synth [on | off]`);
        }
        break;

      case 'clear':
        if (terminalHistory) terminalHistory.innerHTML = '';
        break;

      case 'hack':
        printTerminalLine(`Engaging sub-matrix bypass...`);
        let count = 0;
        const hackInterval = setInterval(() => {
          const hexLines = [
            'CONNECT 10.0.92.115:PORT_80 - BYPASS STATUS [200 OK]',
            'DECRYPTING RESUME_JAYANT.PDF SYMMETRIC SHIELD... [OK]',
            'RETRIEVING PROFILE_COORDINATES... 28.5726° N, 77.2483° E',
            'OVERRIDING MAIN FRAMEWORK CORE... INJECTING GEOMETRIC DATA',
            'MATRIX CORE SYNCHRONIZED. SECURITY CLEARANCE: JAYANT_VARSHNEY'
          ];
          printTerminalLine(`<span style="color:#22c55e;">&gt;&gt; ${hexLines[count]}</span>`);
          count++;
          if (count >= hexLines.length) {
            clearInterval(hackInterval);
            printTerminalLine(`Hack bypass sequence completed. System unlocked.`, 'success');
          }
        }, 4000/hexLines.length); // complete over 4 seconds
        break;

      default:
        printTerminalLine(`Command not found: '${cmd}'. Type <span style="color:var(--accent)">help</span> to display instructions.`);
    }
  };

  // --- CERTIFICATE VAULT LIGHTBOX ---
  const certCards = document.querySelectorAll('.cert-card');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxIssued = document.getElementById('lightbox-issued');
  const lightboxPdfBtn = document.getElementById('lightbox-pdf-btn');
  const lightboxClose = document.getElementById('lightbox-close');

  if (certCards && lightboxModal) {
    certCards.forEach(card => {
      card.addEventListener('click', () => {
        const img = card.getAttribute('data-img');
        const pdf = card.getAttribute('data-pdf');
        const title = card.getAttribute('data-title');
        const issued = card.getAttribute('data-issued');

        if (lightboxImg) lightboxImg.src = img;
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxIssued) lightboxIssued.textContent = issued;
        if (lightboxPdfBtn) lightboxPdfBtn.href = pdf;

        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        playSwooshSound(true);
      });
    });

    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      lightboxModal.setAttribute('aria-hidden', 'true');
      playSwooshSound(false);
    };

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // --- SECURE MESSAGE FORM SUBMIT ---
  window.sendSecureMessage = () => {
    const emailField = document.getElementById('form-email');
    const msgField = document.getElementById('form-msg');
    
    if (!emailField || !msgField) return;
    
    const email = emailField.value;
    const msg = msgField.value;
    
    if (email && msg) {
      // Clear fields
      emailField.value = '';
      msgField.value = '';
      
      showToast('Transmission queued. Dispatching email...', 'success');
      playClickSound();
      
      // Let's open a mailto or log it to mock terminal
      setTimeout(() => {
        printTerminalLine(`[SYS LOG] Intercepted transmission packet queue...`);
        printTerminalLine(`[SYS LOG] Sender: ${email}`);
        printTerminalLine(`[SYS LOG] Payload: "${msg}"`);
        
        // Open standard mailto to make it functional
        const mailtoUrl = `mailto:jatinvarshney939@gmail.com?subject=Secure Portfolio Contact from ${email}&body=${encodeURIComponent(msg)}`;
        window.location.href = mailtoUrl;
      }, 1000);
    }
  };

  // --- FETCH GITHUB REPOSITORIES ---
  const fetchGitHubRepos = async () => {
    const reposGrid = document.getElementById('github-repos-grid');
    if (!reposGrid) return;

    try {
      const response = await fetch('https://api.github.com/users/Jayantvarshney17/repos?sort=updated&per_page=100');
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      
      const originalRepos = data.filter(repo => !repo.fork);
      const forks = data.filter(repo => repo.fork);
      
      const allRepos = [...originalRepos, ...forks].sort((a, b) => {
        if (a.stargazers_count !== b.stargazers_count) {
          return b.stargazers_count - a.stargazers_count;
        }
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      
      sysState.githubRepos = allRepos;
      
      if (allRepos.length === 0) {
        reposGrid.innerHTML = `
          <div class="font-code" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted);">
            No public repositories found.
          </div>
        `;
        return;
      }
      
      reposGrid.innerHTML = '';
      
      allRepos.forEach(repo => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.addEventListener('click', () => {
          window.open(repo.html_url, '_blank');
        });
        
        let tagsHtml = '';
        if (repo.language) {
          tagsHtml += `<span class="project-tag">${repo.language}</span>`;
        }
        if (repo.stargazers_count > 0) {
          tagsHtml += `<span class="project-tag" style="color: #fbbf24; border-color: rgba(251, 191, 36, 0.4); background: rgba(251, 191, 36, 0.1);">★ ${repo.stargazers_count}</span>`;
        }
        if (repo.fork) {
          tagsHtml += `<span class="project-tag" style="color: var(--accent-secondary); border-color: rgba(255, 0, 127, 0.4); background: rgba(255, 0, 127, 0.1);">Fork</span>`;
        }
        
        let demoLinkHtml = '';
        if (repo.homepage) {
          demoLinkHtml = `
            <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="project-link" style="margin-left: auto;" onclick="event.stopPropagation();">
              <span>Live Demo</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 12px; height: 12px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          `;
        }
        
        card.innerHTML = `
          <h3>${repo.name}</h3>
          ${repo.description ? `<p>${repo.description}</p>` : ''}
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; flex-wrap: wrap; gap: 8px;">
            <div class="project-tags">
              ${tagsHtml}
            </div>
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="project-link" style="pointer-events: auto;" onclick="event.stopPropagation();">
              <span>Repo &rarr;</span>
            </a>
            ${demoLinkHtml}
          </div>
        `;
        
        reposGrid.appendChild(card);
      });
      
    } catch (error) {
      console.error(error);
      reposGrid.innerHTML = `
        <div class="font-code" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #ef4444; border: 1px dashed #ef4444; border-radius: 8px; background: rgba(239, 68, 68, 0.05);">
          Connection Failed: Unable to retrieve repository payloads.
        </div>
      `;
    }
  };

  // Trigger GitHub Fetch
  fetchGitHubRepos();

  // --- SYSTEM TOAST NOTIFICATION ---
  const showToast = (message, type = 'info') => {
    if (!toastNotification || !toastMessage) return;
    
    toastMessage.textContent = message;
    toastNotification.className = 'toast-notification active';
    
    if (type === 'success') {
      toastNotification.classList.add('success');
      toastNotification.querySelector('.toast-icon').textContent = '✔';
    } else {
      toastNotification.classList.add('info');
      toastNotification.querySelector('.toast-icon').textContent = '💻';
    }

    setTimeout(() => {
      toastNotification.classList.remove('active');
    }, 4000);
  };
});
