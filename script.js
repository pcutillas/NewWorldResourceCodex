// Initial data
const initialResources = [
    { id: 1, resource: "Apparel", towns: [{ name: "Alazar's Recall", weight: 1000 }] },
    { id: 2, resource: "Apparel (Specialized)", towns: [{ name: "Wikala al-Waha", weight: 1000 }] },
    { id: 3, resource: "Arcana", towns: [{ name: "Cutlass Keys", weight: 1000 }] },
    { id: 4, resource: "Cooking", towns: [{ name: "Brightwood", weight: 1000 }] },
    { id: 5, resource: "Craft Mods", towns: [{ name: "Clarion", weight: 1000 }] },
    { id: 6, resource: "Dyes", towns: [{ name: "Last Light", weight: 1000 }] },
    { id: 7, resource: "Fishing", towns: [{ name: "Clarion", weight: 1000 }] },
    { id: 8, resource: "Food", towns: [{ name: "The Bull's Eye", weight: 1000 }] },
    { id: 9, resource: "Furniture", towns: [{ name: "Monarch's Bluffs", weight: 1000 }] },
    { id: 10, resource: "Jewelcrafting", towns: [{ name: "Mourningdale", weight: 1000 }] },
    { id: 11, resource: "Leatherworking", towns: [{ name: "Brimstone", weight: 1000 }] },
    { id: 12, resource: "Mounts", towns: [{ name: "Alazar's Recall", weight: 1000 }] },
    { id: 13, resource: "Patterns", towns: [{ name: "Monarch's Bluffs", weight: 1000 }] },
    { id: 14, resource: "Reagents", towns: [{ name: "Brimstone", weight: 1000 }] },
    { id: 15, resource: "Resources", towns: [{ name: "Bastion", weight: 1000 }] },
    { id: 16, resource: "Runes", towns: [{ name: "Last Light", weight: 1000 }] },
    { id: 17, resource: "Smelting", towns: [{ name: "Ebonscale", weight: 1000 }] },
    { id: 18, resource: "Stonecutting", towns: [{ name: "Brimstone", weight: 1000 }] },
    { id: 19, resource: "Tuning Orbs", towns: [{ name: "Last Light", weight: 1000 }] },
    { id: 20, resource: "Utilities (Potions)", towns: [{ name: "Restless Shore", weight: 1000 }, { name: "Taberna Mercatus", weight: 1000 }] },
    { id: 21, resource: "Weapons", towns: [{ name: "Alazar's Recall", weight: 1000 }] },
    { id: 22, resource: "Weaving", towns: [{ name: "Edengrove", weight: 1000 }] },
    { id: 23, resource: "Woodworking", towns: [{ name: "Ebonscale", weight: 1000 }] }
];

// State
let resources = [];
let currentEditId = null;
let nextId = 24;
let currentSortMode = 'custom'; // 'custom', 'resource', 'town'

// Custom drag state
let dragState = {
    isDragging: false,
    draggedElement: null,
    ghostElement: null,
    placeholder: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
};

// DOM elements
const resourceWrapper = document.getElementById('resourceWrapper');
const searchInput = document.getElementById('searchInput');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const resourceInput = document.getElementById('resourceInput');
const townInput = document.getElementById('townInput');
const townTags = document.getElementById('townTags');
const townDropdown = document.getElementById('townDropdown');
const sortDropdown = document.getElementById('sortDropdown');
const sortBtn = document.getElementById('sortBtn');
const sortLabel = document.getElementById('sortLabel');

// State for town selection
let selectedTowns = []; // Array of { name: string, weight: number }

// Initialize
function init() {
    const saved = localStorage.getItem('nw-resources');
    const savedSortMode = localStorage.getItem('nw-sort-mode');

    if (saved) {
        resources = JSON.parse(saved);
        // Migrate old data formats
        resources = resources.map(r => {
            // Migrate from single town string to array
            if (r.town && !r.towns) {
                return { ...r, towns: [{ name: r.town, weight: r.weight || 1000 }] };
            }
            // Migrate from towns array of strings to array of objects
            if (r.towns && Array.isArray(r.towns) && r.towns.length > 0 && typeof r.towns[0] === 'string') {
                const weight = r.weight || 1000;
                return { ...r, towns: r.towns.map(t => ({ name: t, weight })) };
            }
            // Ensure all towns have weight
            if (r.towns && Array.isArray(r.towns)) {
                return {
                    ...r,
                    towns: r.towns.map(t => typeof t === 'object' ? t : { name: t, weight: 1000 })
                };
            }
            return r;
        });
        nextId = Math.max(...resources.map(r => r.id)) + 1;
        save(); // Save migrated data
    } else {
        resources = [...initialResources];
        save();
    }

    if (savedSortMode) {
        currentSortMode = savedSortMode;
        updateSortLabel();
    }

    render();
}

// Save to localStorage
function save() {
    localStorage.setItem('nw-resources', JSON.stringify(resources));
}

// Get all unique towns
function getAllTowns() {
    const townSet = new Set();
    resources.forEach(r => {
        if (r.towns && Array.isArray(r.towns)) {
            r.towns.forEach(t => townSet.add(t.name));
        }
    });
    return Array.from(townSet).sort();
}

// Calculate weight usage per town
function getTownWeights() {
    const weights = {};
    resources.forEach(r => {
        if (r.towns && Array.isArray(r.towns)) {
            r.towns.forEach(townObj => {
                const townName = townObj.name;
                if (!weights[townName]) {
                    weights[townName] = 0;
                }
                weights[townName] += townObj.weight || 0;
            });
        }
    });
    return weights;
}

// Render resources
function render(filter = '') {
    let filtered = resources.filter(r => {
        const term = filter.toLowerCase();
        const townsMatch = r.towns && r.towns.some(t => t.name.toLowerCase().includes(term));
        return r.resource.toLowerCase().includes(term) || townsMatch;
    });

    // Apply sorting
    const displayResources = getSortedResources(filtered);

    resourceWrapper.innerHTML = displayResources.length > 0
        ? displayResources.map((r) => createResourceHTML(r)).join('')
        : '<div class="empty-state">No resources found. Click "Add Resource" to create one.</div>';

    // Initialize drag and drop with SortableJS
    if (currentSortMode === 'custom' && filter === '') {
        initSortable();
    } else {
        destroySortable();
    }
}

// Create resource HTML
function createResourceHTML(resource) {
    const towns = resource.towns || [];

    // Calculate weight display
    let weightDisplay = '';
    if (towns.length === 1) {
        weightDisplay = `${towns[0].weight || 1000}`;
    } else if (towns.length > 1) {
        // Show each town's weight separated by commas: "1000, 1000"
        weightDisplay = towns.map(t => t.weight || 1000).join(', ');
    }

    return `
        <div class="resource-item" data-id="${resource.id}">
            <div class="resource-info">
                <div class="resource-name">${resource.resource}</div>
                <div class="resource-location">
                    <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${towns.map(t => t.name).join(', ')}</span>
                </div>
            </div>
            <div class="resource-weight-display">
                <svg class="weight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"></path>
                    <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"></path>
                </svg>
                <span>${weightDisplay}</span>
            </div>
            <div class="resource-actions">
                <button class="action-btn edit" onclick="editResource(${resource.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"></path>
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"></path>
                    </svg>
                </button>
                <button class="action-btn delete" onclick="deleteResource(${resource.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// Render town tags with weight inputs
function renderTownTags() {
    if (selectedTowns.length === 0) {
        townTags.innerHTML = '';
        return;
    }

    townTags.innerHTML = selectedTowns.map((town, index) => `
        <div class="town-tag-item">
            <span class="town-tag">
                ${town.name}
                <button class="town-tag-remove" onclick="removeTownByName('${town.name.replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </span>
            <div class="weight-input-wrapper">
                <svg class="weight-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"></path>
                    <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"></path>
                </svg>
                <input type="number"
                       class="town-weight-input"
                       value="${town.weight || 1000}"
                       min="0"
                       placeholder="Weight"
                       onchange="updateTownWeight(${index}, this.value)">
            </div>
        </div>
    `).join('');
}

// Render town dropdown
function renderTownDropdown(filter = '') {
    const allTowns = getAllTowns();
    const filterLower = filter.toLowerCase();
    const filtered = filter ? allTowns.filter(t => t.toLowerCase().includes(filterLower)) : allTowns;

    let html = '';

    // Show filtered existing towns
    if (filtered.length > 0) {
        html += filtered.map(town => {
            const isSelected = selectedTowns.some(t => t.name === town);
            return `
                <div class="town-dropdown-item ${isSelected ? 'selected' : ''}"
                     onclick="toggleTown('${town.replace(/'/g, "\\'")}')">
                    ${town}
                </div>
            `;
        }).join('');
    }

    // Add option to create new town if filter doesn't match any existing
    if (filter && !allTowns.some(t => t.toLowerCase() === filterLower)) {
        if (filtered.length > 0) {
            html += '<div class="town-dropdown-divider"></div>';
        }
        html += `
            <div class="town-dropdown-item" onclick="addNewTown('${filter.replace(/'/g, "\\'")}')">
                + Add "${filter}"
            </div>
        `;
    }

    townDropdown.innerHTML = html;
    townDropdown.classList.add('active');
}

// Toggle town selection
function toggleTown(townName) {
    const existingIndex = selectedTowns.findIndex(t => t.name === townName);
    if (existingIndex !== -1) {
        selectedTowns.splice(existingIndex, 1);
    } else {
        selectedTowns.push({ name: townName, weight: 1000 });
    }
    renderTownTags();
    renderTownDropdown(townInput.value);
}

// Add new town
function addNewTown(townName) {
    if (townName && !selectedTowns.some(t => t.name === townName)) {
        selectedTowns.push({ name: townName, weight: 1000 });
        renderTownTags();
        townInput.value = '';
        townDropdown.classList.remove('active');
    }
}

// Remove town by name
function removeTownByName(townName) {
    selectedTowns = selectedTowns.filter(t => t.name !== townName);
    renderTownTags();
    if (townInput.value) {
        renderTownDropdown(townInput.value);
    }
}

// Update town weight
function updateTownWeight(index, value) {
    const weight = parseInt(value) || 1000;
    if (selectedTowns[index]) {
        selectedTowns[index].weight = weight;
    }
}

// Open add modal
function openAddModal() {
    currentEditId = null;
    modalTitle.textContent = 'Add Resource';
    resourceInput.value = '';
    townInput.value = '';
    selectedTowns = [];
    renderTownTags();
    modal.classList.add('active');
    resourceInput.focus();
}

// Edit resource
function editResource(id) {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    currentEditId = id;
    modalTitle.textContent = 'Edit Resource';
    resourceInput.value = resource.resource;
    townInput.value = '';
    selectedTowns = resource.towns ? JSON.parse(JSON.stringify(resource.towns)) : [];
    renderTownTags();
    modal.classList.add('active');
    resourceInput.focus();
}

// Close modal
function closeModalFn() {
    modal.classList.remove('active');
    currentEditId = null;
    selectedTowns = [];
    townDropdown.classList.remove('active');
}

// Save resource
function saveResource() {
    const resourceName = resourceInput.value.trim();

    if (!resourceName || selectedTowns.length === 0) {
        alert('Please fill in resource name and select at least one town');
        return;
    }

    if (currentEditId) {
        const index = resources.findIndex(r => r.id === currentEditId);
        if (index !== -1) {
            resources[index] = {
                id: currentEditId,
                resource: resourceName,
                towns: JSON.parse(JSON.stringify(selectedTowns))
            };
        }
    } else {
        resources.push({
            id: nextId++,
            resource: resourceName,
            towns: JSON.parse(JSON.stringify(selectedTowns))
        });
    }

    save();
    render(searchInput.value);
    closeModalFn();
}

// Delete resource
function deleteResource(id) {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    if (confirm(`Delete "${resource.resource}"?`)) {
        resources = resources.filter(r => r.id !== id);
        save();
        render(searchInput.value);
    }
}

// Get sorted resources based on current sort mode
function getSortedResources(resourcesList) {
    if (currentSortMode === 'resource') {
        return [...resourcesList].sort((a, b) => a.resource.localeCompare(b.resource));
    } else if (currentSortMode === 'town') {
        return [...resourcesList].sort((a, b) => {
            const aTown = a.towns && a.towns.length > 0 ? a.towns[0].name : '';
            const bTown = b.towns && b.towns.length > 0 ? b.towns[0].name : '';
            return aTown.localeCompare(bTown);
        });
    }
    return resourcesList; // custom order
}

// Update sort label
function updateSortLabel() {
    const labels = {
        'custom': 'Custom Order',
        'resource': 'Resource (A-Z)',
        'town': 'Town (A-Z)'
    };
    sortLabel.textContent = labels[currentSortMode] || 'Custom Order';

    // Update active state in dropdown
    document.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.dataset.sort === currentSortMode) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Change sort mode
function changeSortMode(mode) {
    currentSortMode = mode;
    localStorage.setItem('nw-sort-mode', mode);
    updateSortLabel();
    render(searchInput.value);
    sortDropdown.classList.remove('active');
}

// Initialize custom drag and drop
function initSortable() {
    const items = resourceWrapper.querySelectorAll('.resource-item');
    items.forEach(item => {
        item.addEventListener('mousedown', handleDragStart);
    });
}

// Destroy custom drag listeners
function destroySortable() {
    const items = resourceWrapper.querySelectorAll('.resource-item');
    items.forEach(item => {
        item.removeEventListener('mousedown', handleDragStart);
    });
}

function handleDragStart(e) {
    // Don't drag if clicking on buttons
    if (e.target.closest('.action-btn')) return;

    const item = e.currentTarget;
    const rect = item.getBoundingClientRect();

    // Store initial state
    dragState.draggedElement = item;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    dragState.offsetX = e.clientX - rect.left;
    dragState.offsetY = e.clientY - rect.top;

    // Create ghost element (follows cursor)
    dragState.ghostElement = item.cloneNode(true);
    dragState.ghostElement.classList.add('drag-ghost');
    dragState.ghostElement.style.position = 'fixed';
    dragState.ghostElement.style.left = rect.left + 'px';
    dragState.ghostElement.style.top = rect.top + 'px';
    dragState.ghostElement.style.width = rect.width + 'px';
    dragState.ghostElement.style.pointerEvents = 'none';
    dragState.ghostElement.style.zIndex = '99999';
    document.body.appendChild(dragState.ghostElement);

    // Create placeholder (invisible, stays in grid)
    dragState.placeholder = document.createElement('div');
    dragState.placeholder.className = 'resource-item drag-placeholder';
    dragState.placeholder.style.height = rect.height + 'px';
    dragState.placeholder.style.minHeight = rect.height + 'px';
    item.parentNode.insertBefore(dragState.placeholder, item);

    // Remove original element from DOM flow
    item.style.display = 'none';

    // Add event listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Set body cursor and prevent text selection
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    dragState.isDragging = true;
}

function handleDragMove(e) {
    if (!dragState.isDragging) return;

    // Update ghost position to follow cursor
    dragState.ghostElement.style.left = (e.clientX - dragState.offsetX) + 'px';
    dragState.ghostElement.style.top = (e.clientY - dragState.offsetY) + 'px';

    // Find element under cursor
    dragState.ghostElement.style.pointerEvents = 'none';
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    dragState.ghostElement.style.pointerEvents = 'none';

    if (!elementBelow) return;

    const droppableBelow = elementBelow.closest('.resource-item');
    if (!droppableBelow || droppableBelow === dragState.draggedElement) return;

    // Get the placeholder's current position
    const placeholderRect = dragState.placeholder.getBoundingClientRect();
    const targetRect = droppableBelow.getBoundingClientRect();

    // Determine if we should insert before or after
    const isAfter = e.clientY > targetRect.top + targetRect.height / 2;

    if (isAfter) {
        droppableBelow.parentNode.insertBefore(dragState.placeholder, droppableBelow.nextSibling);
    } else {
        droppableBelow.parentNode.insertBefore(dragState.placeholder, droppableBelow);
    }
}

function handleDragEnd(e) {
    if (!dragState.isDragging) return;

    // Remove ghost
    if (dragState.ghostElement) {
        dragState.ghostElement.remove();
    }

    // Move dragged element to placeholder position
    if (dragState.placeholder && dragState.draggedElement) {
        dragState.placeholder.parentNode.insertBefore(dragState.draggedElement, dragState.placeholder);
        dragState.placeholder.remove();
    }

    // Restore original element
    if (dragState.draggedElement) {
        dragState.draggedElement.style.display = '';
    }

    // Update resources array based on new DOM order
    const items = Array.from(resourceWrapper.querySelectorAll('.resource-item'));
    const newOrder = items.map(item => {
        const id = parseInt(item.dataset.id);
        return resources.find(r => r.id === id);
    }).filter(r => r !== undefined);

    resources = newOrder;
    save();

    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    // Reset body cursor and user select
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Reset state
    dragState = {
        isDragging: false,
        draggedElement: null,
        ghostElement: null,
        placeholder: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    };
}

// Export to JSON file
function exportToFile() {
    // Separate resources and weights
    const exportData = {
        resources: resources.map(r => ({
            id: r.id,
            resource: r.resource,
            towns: r.towns ? r.towns.map(t => t.name) : []
        })),
        weights: []
    };

    // Build weights array - one entry per resource-town combination
    resources.forEach(r => {
        if (r.towns && Array.isArray(r.towns)) {
            r.towns.forEach(townObj => {
                exportData.weights.push({
                    resourceId: r.id,
                    town: townObj.name,
                    weight: townObj.weight || 1000
                });
            });
        }
    });

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aeternum-resources.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Import from JSON file
function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            // Check if it's the new format with separate resources and weights
            if (imported.resources && imported.weights && Array.isArray(imported.resources)) {
                if (confirm(`Import ${imported.resources.length} resources? This will replace your current data.`)) {
                    // Rebuild resources by combining data
                    resources = imported.resources.map(r => {
                        // Find all weights for this resource
                        const resourceWeights = imported.weights.filter(w => w.resourceId === r.id);

                        // Build towns array with weights
                        const towns = r.towns.map(townName => {
                            const weightEntry = resourceWeights.find(w => w.town === townName);
                            return {
                                name: townName,
                                weight: weightEntry ? weightEntry.weight : 1000
                            };
                        });

                        return {
                            id: r.id,
                            resource: r.resource,
                            towns: towns
                        };
                    });

                    nextId = Math.max(...resources.map(r => r.id)) + 1;
                    save();
                    render(searchInput.value);
                }
            }
            // Handle old format (legacy support)
            else if (Array.isArray(imported) && imported.length > 0) {
                if (confirm(`Import ${imported.length} resources? This will replace your current data.`)) {
                    resources = imported;
                    nextId = Math.max(...resources.map(r => r.id)) + 1;
                    save();
                    render(searchInput.value);
                }
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Event listeners
addBtn.addEventListener('click', openAddModal);
exportBtn.addEventListener('click', exportToFile);
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', importFromFile);
closeModal.addEventListener('click', closeModalFn);
cancelBtn.addEventListener('click', closeModalFn);
saveBtn.addEventListener('click', saveResource);
searchInput.addEventListener('input', (e) => render(e.target.value));

// Sort dropdown listeners
sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sortDropdown.classList.toggle('active');
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        changeSortMode(item.dataset.sort);
    });
});

document.addEventListener('click', (e) => {
    if (!sortDropdown.contains(e.target)) {
        sortDropdown.classList.remove('active');
    }

    // Close town dropdown if clicking outside
    const townContainer = document.querySelector('.town-select-container');
    if (townContainer && !townContainer.contains(e.target)) {
        townDropdown.classList.remove('active');
    }
});

// Town input listeners
townInput.addEventListener('input', (e) => {
    renderTownDropdown(e.target.value);
});

townInput.addEventListener('focus', (e) => {
    renderTownDropdown(e.target.value);
});

townInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const value = townInput.value.trim();
        if (value) {
            addNewTown(value);
        }
    }
});

modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
        closeModalFn();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModalFn();
    }
    if (e.key === 'Enter' && modal.classList.contains('active') && e.target !== townInput) {
        saveResource();
    }
});

// Footer toggle functionality
const footer = document.getElementById('footer');
const footerToggle = document.getElementById('footerToggle');

// Load footer state from localStorage
const footerCollapsed = localStorage.getItem('footer-collapsed') === 'true';
if (footerCollapsed) {
    footer.classList.add('collapsed');
}

footerToggle.addEventListener('click', () => {
    footer.classList.toggle('collapsed');
    const isCollapsed = footer.classList.contains('collapsed');
    localStorage.setItem('footer-collapsed', isCollapsed);
});

// Initialize app
init();