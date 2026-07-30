let currentTheme = 'night';
let currentMode = 'tree'; // 'tree', 'search', or 'random'
let eyeStates = {}; // Remembers open/close eye state per question
let randomQueue = [];

const sheetContainer = document.getElementById('sheetContainer');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const homeBtn = document.getElementById('homeBtn');
const randomBtn = document.getElementById('randomBtn');
const themeBtn = document.getElementById('themeBtn');

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  renderTopicTree();
  setupEventListeners();
});

function setupEventListeners() {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    searchClearBtn.style.display = val ? 'block' : 'none';
    if (val) {
      handleSearch(val);
    } else {
      renderTopicTree();
    }
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    renderTopicTree();
    searchInput.focus();
  });

  homeBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    renderTopicTree();
  });

  randomBtn.addEventListener('click', handleRandomQuestion);
  themeBtn.addEventListener('click', toggleTheme);
}

function renderTopicTree() {
  currentMode = 'tree';
  sheetContainer.className = 'sheet-container tree-mode';
  sheetContainer.innerHTML = '';

  sheetData.forEach(topic => {
    const topicCard = document.createElement('div');
    topicCard.className = 'topic-card';

    const topicHeader = document.createElement('div');
    topicHeader.className = 'topic-header';
    topicHeader.innerHTML = `
      <span class="topic-title">${topic.topicTitle}</span>
      <span class="chevron-icon">▼</span>
    `;
    topicHeader.addEventListener('click', () => {
      topicCard.classList.toggle('open');
    });

    const qnsWrapper = document.createElement('div');
    qnsWrapper.className = 'questions-wrapper';

    topic.questions.forEach(qn => {
      const qnNode = createQuestionNode(qn);
      qnsWrapper.appendChild(qnNode);
    });

    topicCard.appendChild(topicHeader);
    topicCard.appendChild(qnsWrapper);
    sheetContainer.appendChild(topicCard);
  });
}

function createQuestionNode(qn) {
  const node = document.createElement('div');
  node.className = 'question-node';

  const isOpen = !!eyeStates[qn.id];

  const closedEyeSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  const openEyeSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

  node.innerHTML = `
    <div class="question-row">
      <div class="question-info">
        <span class="qn-number">${qn.id}</span>
        <span class="qn-title">${qn.title}</span>
      </div>
      <div class="question-actions">
        <button class="eye-btn ${isOpen ? 'active' : ''}" title="Toggle Solution">
          ${isOpen ? openEyeSvg : closedEyeSvg}
        </button>
        <a href="${qn.platformUrl}" target="_blank" rel="noopener" class="platform-btn" title="Open on ${qn.platform}">
          ${qn.platform === 'LeetCode' ? 'L' : 'G'}
        </a>
      </div>
    </div>
    <div class="solution-block ${isOpen ? 'visible' : ''}">
      <div class="solution-arrow">↓ Solution Details ↓</div>
      <div class="solution-images-list">
        ${qn.solutionImages.map((img, idx) => {
          const imgSrc = typeof img === 'string' ? img : img.src;
          const imgAlt = (typeof img === 'object' && img.alt) ? img.alt : `Solution Step ${idx + 1}`;
          return `
            <div class="solution-img-wrapper">
              <img src="${imgSrc}" alt="${imgAlt}" class="solution-img" loading="lazy" />
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const eyeBtn = node.querySelector('.eye-btn');
  eyeBtn.addEventListener('click', () => {
    eyeStates[qn.id] = !eyeStates[qn.id];
    const solutionBlock = node.querySelector('.solution-block');
    if (eyeStates[qn.id]) {
      eyeBtn.classList.add('active');
      eyeBtn.innerHTML = openEyeSvg;
      solutionBlock.classList.add('visible');
    } else {
      eyeBtn.classList.remove('active');
      eyeBtn.innerHTML = closedEyeSvg;
      solutionBlock.classList.remove('visible');
    }
  });

  return node;
}

function getAllQuestions() {
  const all = [];
  sheetData.forEach(t => all.push(...t.questions));
  return all;
}

function handleSearch(query) {
  currentMode = 'search';
  sheetContainer.className = 'sheet-container flat-mode';
  sheetContainer.innerHTML = '';

  const cleanQuery = query.toLowerCase().trim();
  const allQns = getAllQuestions();

  const exactNumMatch = cleanQuery.replace('#', '');
  if (!isNaN(exactNumMatch) && exactNumMatch !== '') {
    const targetId = parseInt(exactNumMatch, 10);
    const match = allQns.find(q => q.id === targetId);
    if (match) {
      sheetContainer.appendChild(createQuestionNode(match));
      return;
    }
  }

  const matched = [];
  allQns.forEach(qn => {
    const titleLower = qn.title.toLowerCase();
    let score = 0;

    if (titleLower === cleanQuery) score += 100;
    else if (titleLower.startsWith(cleanQuery)) score += 50;
    else if (titleLower.includes(cleanQuery)) score += 20;
    else if (cleanQuery.includes(titleLower)) score += 15;
    else {
      const queryWords = cleanQuery.split(/\s+/);
      queryWords.forEach(w => {
        if (w.length >= 3 && titleLower.includes(w.substring(0, 4))) {
          score += 10;
        }
      });
    }

    if (score > 0) {
      matched.push({ question: qn, score });
    }
  });

  matched.sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    matched.forEach(item => {
      sheetContainer.appendChild(createQuestionNode(item.question));
    });
  } else {
    sheetContainer.innerHTML = `<div class="no-results">No matching questions found</div>`;
  }
}

function handleRandomQuestion() {
  currentMode = 'random';
  sheetContainer.className = 'sheet-container flat-mode';
  sheetContainer.innerHTML = '';

  const allQns = getAllQuestions();
  if (allQns.length === 0) return;

  if (randomQueue.length === 0) {
    randomQueue = [...allQns].sort(() => Math.random() - 0.5);
  }

  const randomQn = randomQueue.pop();
  sheetContainer.appendChild(createQuestionNode(randomQn));
}

function toggleTheme() {
  if (currentTheme === 'night') {
    currentTheme = 'day';
    document.documentElement.setAttribute('data-theme', 'day');
    themeBtn.innerHTML = `<span class="btn-icon">☀️</span> <span class="btn-text" id="themeLabel">Day</span>`;
  } else {
    currentTheme = 'night';
    document.documentElement.setAttribute('data-theme', 'night');
    themeBtn.innerHTML = `<span class="btn-icon">🌙</span> <span class="btn-text" id="themeLabel">Night</span>`;
  }
}
