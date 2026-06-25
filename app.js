let kbData = {};
let currentTableData = [];

// Clean category mapping matching your exact JSON structure
const categoryMap = {
    "it_companies": "Major IT Companies & Lore",
    "indian_startups": "Indian Startups Ecosystem",
    "codenames.windows": "Codenames: Windows OS",
    "codenames.android": "Codenames: Android OS",
    "codenames.intel": "Codenames: Intel Processors",
    "codenames.macos": "Codenames: Apple macOS",
    "acronyms.it_infrastructure": "Acronyms: IT Infrastructure",
    "acronyms.gaming": "Acronyms: Gaming Terminology",
    "acronyms.corporate_etymology": "Acronyms: Corporate Etymology",
    "books": "Books by Tech Personalities",
    "media.movies": "Tech-Based Media: Movies",
    "media.books": "Tech-Based Media: Sci-Fi Books",
    "media.web_series": "Tech-Based Media: Web Series"
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Page Routing Logic ---
    const routeButtons = document.querySelectorAll('[data-target]');
    const views = document.querySelectorAll('.view-section');

    routeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            
            // Hide all views
            views.forEach(view => view.classList.add('hidden'));
            
            // Show the target view
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // --- Knowledge Base Initialization ---
    fetch('knowledgebase.json')
        .then(response => {
            if (!response.ok) throw new Error("Database not found.");
            return response.json();
        })
        .then(data => {
            kbData = data.knowledge_base;
            initKnowledgeBase();
        })
        .catch(error => {
            console.error("Error loading knowledge base:", error);
            document.getElementById('kb-table-body').innerHTML = `<tr><td style="text-align:center; padding:2rem;">Could not load knowledgebase.json. Please ensure it is uploaded.</td></tr>`;
        });

    // Live search filter
    document.getElementById('kb-search').addEventListener('input', (e) => {
        renderTable(currentTableData, e.target.value);
    });
});

function initKnowledgeBase() {
    const select = document.getElementById('kb-category-select');
    
    // Populate Dropdown
    Object.entries(categoryMap).forEach(([path, title]) => {
        const option = document.createElement('option');
        option.value = path;
        option.textContent = title;
        select.appendChild(option);
    });

    // Update table on selection change
    select.addEventListener('change', (e) => {
        loadCategoryData(e.target.value);
        document.getElementById('kb-search').value = ''; 
    });

    // Preload first category
    loadCategoryData(select.value);
}

// Navigates nested JSON paths (e.g., "media.movies")
function getNestedData(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function loadCategoryData(path) {
    let rawData = getNestedData(kbData, path);
    if (!rawData) return;

    // Convert flat string arrays (like media lists) into table-ready objects
    if (typeof rawData[0] === 'string') {
        currentTableData = rawData.map(item => ({ "Entry Title": item }));
    } else {
        currentTableData = rawData;
    }

    renderTable(currentTableData);
}

// Format JSON keys into clean table headers
function formatHeader(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function renderTable(dataArray, searchTerm = "") {
    const thead = document.getElementById('kb-table-head');
    const tbody = document.getElementById('kb-table-body');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (dataArray.length === 0) return;

    // Generate Headers
    const headers = Object.keys(dataArray[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(key => {
        const th = document.createElement('th');
        th.textContent = formatHeader(key);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Filter by search
    const lowerSearch = searchTerm.toLowerCase();
    const filteredData = dataArray.filter(item => {
        return Object.values(item).some(val => {
            if (Array.isArray(val)) return val.join(' ').toLowerCase().includes(lowerSearch);
            return String(val).toLowerCase().includes(lowerSearch);
        });
    });

    // Render Rows
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(key => {
            const td = document.createElement('td');
            let cellData = item[key];
            
            // Format arrays safely with commas
            if (Array.isArray(cellData)) {
                cellData = cellData.length > 0 ? cellData.join(', ') : '—';
            }
            
            td.textContent = cellData || '—';
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

let masterQuizData = [];
let activeQuizDeck = [];
let currentCardIndex = 0;

// List View Pagination
let currentListPage = 1;
const ITEMS_PER_PAGE = 15;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Quiz Data
    fetch('quiz.json')
        .then(res => res.json())
        .then(data => {
            masterQuizData = data.practice_quizzes;
            populateQuizFilters();
        })
        .catch(err => console.error("Error loading quiz.json:", err));

    // 2. Setup Panel Event Listeners
    document.getElementById('select-all-cats').addEventListener('click', toggleAllCategories);
    document.getElementById('btn-launch-flashcards').addEventListener('click', () => initQuizSession('flashcard'));
    document.getElementById('btn-launch-list').addEventListener('click', () => initQuizSession('list'));
    document.getElementById('btn-exit-quiz').addEventListener('click', exitQuizSession);

    // 3. Flashcard Event Listeners
    const flashcard = document.getElementById('flashcard');
    flashcard.addEventListener('click', () => flashcard.classList.toggle('is-flipped'));
    document.getElementById('btn-next-card').addEventListener('click', loadNextFlashcard);

    // 4. List View Event Listeners
    document.getElementById('btn-prev-page').addEventListener('click', () => changeListPage(-1));
    document.getElementById('btn-next-page').addEventListener('click', () => changeListPage(1));
});

// Build the Checkbox Grid
function populateQuizFilters() {
    const container = document.getElementById('quiz-category-checkboxes');
    
    // Extract unique categories, sort them alphabetically
    const uniqueCats = [...new Set(masterQuizData.map(q => q.category))].sort();
    
    uniqueCats.forEach(cat => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = cat;
        checkbox.className = 'cat-checkbox';
        checkbox.checked = true; // Default all checked
        
        // Title Case the category string
        const catName = cat.replace(/\b\w/g, char => char.toUpperCase());
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(catName));
        container.appendChild(label);
    });
}

// Select All / None Helper
function toggleAllCategories() {
    const checkboxes = document.querySelectorAll('.cat-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

// Fisher-Yates Array Shuffle (Prevents repeats until deck is finished)
function shuffleDeck(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initQuizSession(mode) {
    // 1. Gather Selected Filters
    const selectedCats = Array.from(document.querySelectorAll('.cat-checkbox:checked')).map(cb => cb.value);
    const selectedDiffs = Array.from(document.querySelectorAll('#quiz-difficulty-checkboxes input:checked')).map(cb => cb.value);

    // 2. Filter Master Data
    let filteredData = masterQuizData.filter(q => 
        selectedCats.includes(q.category) && selectedDiffs.includes(q.difficulty)
    );

    if (filteredData.length === 0) {
        alert("No questions match your selected filters. Please select more options.");
        return;
    }

    // 3. Shuffle the deck to prevent repeats
    activeQuizDeck = shuffleDeck([...filteredData]);

    // 4. UI Swaps
    document.getElementById('quiz-setup-panel').classList.add('hidden');
    document.getElementById('quiz-active-panel').classList.remove('hidden');

    if (mode === 'flashcard') {
        document.getElementById('flashcard-view').classList.remove('hidden');
        document.getElementById('list-view').classList.add('hidden');
        currentCardIndex = 0;
        renderFlashcard();
    } else {
        document.getElementById('list-view').classList.remove('hidden');
        document.getElementById('flashcard-view').classList.add('hidden');
        currentListPage = 1;
        renderListView();
    }
}

function exitQuizSession() {
    document.getElementById('quiz-active-panel').classList.add('hidden');
    document.getElementById('quiz-setup-panel').classList.remove('hidden');
}

// --- FLASHCARD MODE ENGINE ---
function renderFlashcard() {
    if (currentCardIndex >= activeQuizDeck.length) {
        alert("Deck completed! Great job. You will be returned to the setup menu.");
        exitQuizSession();
        return;
    }

    const card = document.getElementById('flashcard');
    card.classList.remove('is-flipped'); // Ensure card is front-facing

    const q = activeQuizDeck[currentCardIndex];
    
    // Quick delay to allow un-flip animation to finish before swapping text
    setTimeout(() => {
        document.getElementById('fc-cat').textContent = q.category;
        document.getElementById('fc-diff').textContent = q.difficulty;
        document.getElementById('fc-question').textContent = q.question;
        
        document.getElementById('fc-cat-back').textContent = q.category;
        document.getElementById('fc-diff-back').textContent = q.difficulty;
        document.getElementById('fc-answer').textContent = q.answer;
        
        document.getElementById('quiz-progress-tracker').textContent = `Card ${currentCardIndex + 1} of ${activeQuizDeck.length}`;
    }, 150);
}

function loadNextFlashcard() {
    currentCardIndex++;
    renderFlashcard();
}

// --- LIST VIEW ENGINE ---
function renderListView() {
    const container = document.getElementById('list-container');
    container.innerHTML = '';

    const startIndex = (currentListPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, activeQuizDeck.length);
    const totalPages = Math.ceil(activeQuizDeck.length / ITEMS_PER_PAGE);

    // Update Progress
    document.getElementById('quiz-progress-tracker').textContent = `${activeQuizDeck.length} Questions Loaded`;
    document.getElementById('page-indicator').textContent = `Page ${currentListPage} of ${totalPages}`;

    // Disable/Enable Pagination Buttons
    document.getElementById('btn-prev-page').disabled = currentListPage === 1;
    document.getElementById('btn-next-page').disabled = currentListPage === totalPages;

    for (let i = startIndex; i < endIndex; i++) {
        const q = activeQuizDeck[i];
        
        const item = document.createElement('div');
        item.className = 'list-item';
        
        item.innerHTML = `
            <div class="list-item-header">
                <div class="list-question">${i + 1}. ${q.question}</div>
                <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                    <span class="badge cat-badge">${q.category}</span>
                    <span class="badge diff-badge">${q.difficulty}</span>
                </div>
            </div>
            <button class="text-btn toggle-answer-btn" style="color:var(--accent);">Reveal Answer</button>
            <div class="list-answer-wrapper hidden">
                <span class="list-answer">${q.answer}</span>
            </div>
        `;

        // Attach event listener to the reveal button
        const btn = item.querySelector('.toggle-answer-btn');
        const answerWrapper = item.querySelector('.list-answer-wrapper');
        
        btn.addEventListener('click', () => {
            if (answerWrapper.classList.contains('hidden')) {
                answerWrapper.classList.remove('hidden');
                btn.textContent = 'Hide Answer';
            } else {
                answerWrapper.classList.add('hidden');
                btn.textContent = 'Reveal Answer';
            }
        });

        container.appendChild(item);
    }
}

function changeListPage(direction) {
    currentListPage += direction;
    renderListView();
    // Scroll to top of list container smoothly
    document.getElementById('list-container').scrollIntoView({ behavior: 'smooth' });
}
