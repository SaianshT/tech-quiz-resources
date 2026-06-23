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
