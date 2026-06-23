let kbData = {};
let currentTableData = [];

// A mapping to convert your JSON keys into clean Dropdown titles
const categoryMap = {
    "it_companies": "🏢 Major IT Companies & Lore",
    "indian_startups": "🚀 Indian Startups Ecosystem",
    "codenames.windows": "💻 Codenames: Windows OS",
    "codenames.android": "📱 Codenames: Android OS",
    "codenames.intel": "⚙️ Codenames: Intel Processors",
    "codenames.macos": "🍏 Codenames: Apple macOS",
    "acronyms.it_infrastructure": "🔌 Acronyms: IT Infrastructure",
    "acronyms.gaming": "🎮 Acronyms: Gaming Terminology",
    "acronyms.corporate_etymology": "🏛️ Acronyms: Corporate Etymology",
    "books": "📖 Books by Tech Personalities",
    "tech_based_media.movies": "🎬 Tech-Based Media: Movies",
    "tech_based_media.books": "📚 Tech-Based Media: Sci-Fi Books",
    "tech_based_media.web_series": "📺 Tech-Based Media: Web Series"
};

document.addEventListener('DOMContentLoaded', () => {
    // Fetch the JSON database file
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
            document.getElementById('kb-table-body').innerHTML = `<tr><td style="text-align:center; padding:2rem;">Could not load database.json. Make sure the file is in the same folder.</td></tr>`;
        });

    // Search bar event listener for live filtering
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

    // Listen for category changes
    select.addEventListener('change', (e) => {
        loadCategoryData(e.target.value);
        document.getElementById('kb-search').value = ''; // Reset search on change
    });

    // Load the first category by default
    loadCategoryData(select.value);
}

// Utility to navigate nested JSON paths (e.g., "codenames.windows")
function getNestedData(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function loadCategoryData(path) {
    let rawData = getNestedData(kbData, path);
    if (!rawData) return;

    // Normalize arrays of simple strings (like the media lists) into objects so they render as a table row
    if (typeof rawData[0] === 'string') {
        currentTableData = rawData.map(item => ({ "Entry Title": item }));
    } else {
        currentTableData = rawData;
    }

    renderTable(currentTableData);
}

// Utility to format JSON keys into clean column headers
function formatHeader(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function renderTable(dataArray, searchTerm = "") {
    const thead = document.getElementById('kb-table-head');
    const tbody = document.getElementById('kb-table-body');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (dataArray.length === 0) return;

    // 1. Generate Headers Dynamically from the first object's keys
    const headers = Object.keys(dataArray[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(key => {
        const th = document.createElement('th');
        th.textContent = formatHeader(key);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // 2. Filter data based on search term
    const lowerSearch = searchTerm.toLowerCase();
    const filteredData = dataArray.filter(item => {
        // Check if any value in the row contains the search term
        return Object.values(item).some(val => {
            if (Array.isArray(val)) return val.join(' ').toLowerCase().includes(lowerSearch);
            return String(val).toLowerCase().includes(lowerSearch);
        });
    });

    // 3. Generate Rows Dynamically
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(key => {
            const td = document.createElement('td');
            let cellData = item[key];
            
            // If the data is an array (like founders or acquisitions), join it cleanly with commas
            if (Array.isArray(cellData)) {
                cellData = cellData.length > 0 ? cellData.join(', ') : '—';
            }
            
            td.textContent = cellData || '—'; // Fallback for empty values
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}