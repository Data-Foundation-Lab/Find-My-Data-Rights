// Constants
const CACHE_EXPIRATION = 3600000; // 1 hour in milliseconds
const DEBOUNCE_DELAY = 300; // 300ms debounce delay
const CACHE_CLEAR_INTERVAL = 300000; // Clear expired cache every 5 minutes
const FULL_CACHE_CLEAR_INTERVAL = 3600000; // Clear entire cache every hour

const defaultRights = [
    { active: true, title: "Right to Access", description: "Obtain and review your personal data.", longDescription: "This right allows you to obtain a copy of the personal data an organization holds about you, understand how your data is being used, and verify the lawfulness of its processing. For example, you can request a company to provide all the data they have collected about you, such as your account details, transaction history, and any communications they've logged."},
    { active: true, title: "Right to Rectification", description: "Correct any inaccuracies in your data.", longDescription: "This right enables you to correct any inaccurate or incomplete personal data that an organization holds about you. For example, if your name is misspelled or your address is outdated, you can request that the organization corrects this information in their records."},
    { active: true, title: "Right to Erasure", description: "Request deletion of your data under certain conditions.", longDescription: "Also known as the 'Right to be Forgotten,' this right allows you to request the deletion of your personal data when it is no longer necessary for the purpose for which it was collected, or when you withdraw consent. For example, if you've closed an account with a service, you can ask them to erase all your data from their systems."},
    { active: true, title: "Right to Restrict Processing", description: "Limit how your data is processed.", longDescription: "This right allows you to limit the way an organization processes your data, particularly in situations where you contest the accuracy of your data, or if the processing is unlawful but you don't want the data erased. For example, you might ask a company to stop processing your data while you verify its accuracy, but without deleting it."},
    { active: true, title: "Right to Data Portability", description: "Receive your data in a usable format and transfer it to another entity.", longDescription: "This right enables you to receive your personal data in a structured, commonly used, and machine-readable format, and to transfer it to another organization without hindrance. For example, if you're switching service providers, you can request your data from the old provider and transfer it directly to the new one to continue receiving services seamlessly."},
    { active: true, title: "Right to Object", description: "Challenge certain types of data processing.", longDescription: "This right allows you to object to the processing of your personal data in certain situations, such as for direct marketing purposes or when processing is based on legitimate interests. For example, you can object to a company using your data for targeted advertising and request that they stop this processing."},
    { active: true, title: "Right to Withdraw Consent", description: "Withdraw consent for data use at any time.", longDescription: "This right allows you to withdraw your consent to data processing at any time, which will halt the processing of your data based on that consent. For example, if you previously consented to receive newsletters from a company, you can withdraw your consent and stop receiving emails."},
    { active: true, title: "Right to No Automated Decisions", description: "Avoid decisions made solely by automated processes.", longDescription: "This right protects you from being subject to decisions made solely based on automated processing, including profiling, which could significantly affect you. For example, if a financial institution uses an automated system to determine your creditworthiness, you can request a human review of the decision rather than being solely judged by the algorithm."},
    { active: true, title: "Right to Information", description: "Be informed about how your data is collected and used.", longDescription: "This right ensures that you are informed about the collection and use of your personal data, including what data is collected, how it's used, who it's shared with, and how long it will be retained. For example, when signing up for a new service, you should be provided with a clear privacy notice detailing these aspects before your data is collected."}
];

const countryJSONHashes = [
    { country: "Australia", fileHash: "a955a9e223a50a0c580dd2d46dddc147730696a77928b0ec8bd65a40d5858d29" },
    { country: "New Zealand", fileHash: "4e37164840c9a2cf0b54ef716e03fb51463649d59e4b90ef46c9c93b01dd6cf6"},
    { country: "United States", fileHash: "d7a2453b617bb2c2f4fb5e23ec3cbcc7c6d5e04862892dd001ace671ad33da23"},
    { country: "Austria", fileHash: "71079bc7bab7cfbaceb2ab20446c3d94ba8e27a6668a83f51743ef24e25c54f1"}
];

// State
const countryData = new Map();
const searchCache = new Map();
let debounceTimer;

// DOM Elements
const elements = {
    searchInput: document.getElementById('search-input'),
    clearButton: document.getElementById('clear-search'),
    searchResults: document.getElementById('search-results'),
    rightsContainer: document.getElementById('rights-container'),
    rightsInfo: document.getElementById('rights-info'),
    searchLoader: document.getElementById('search-loader'),
    rightModal: document.getElementById('rightModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    modalTimeframe: document.getElementById('modalTimeframe')
};

// Main function
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    validateElements();
    loadCountryData();
    setupEventListeners();
    initializeUI();
    setupCacheClearing();
}

function validateElements() {
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Required element '${key}' is missing from the DOM`);
            return;
        }
    }
}

function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearButton.addEventListener('click', clearSearch);
    elements.rightModal.addEventListener('click', handleModalClick);
    document.body.addEventListener('click', handleCloseModal);
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
}

function initializeUI() {
    elements.rightsInfo.style.display = 'none';
    elements.rightsContainer.classList.remove('visible');
}

function setupCacheClearing() {
    setInterval(clearExpiredCache, CACHE_CLEAR_INTERVAL);
    setInterval(() => searchCache.clear(), FULL_CACHE_CLEAR_INTERVAL);
}

// Event Handlers
function handleSearch() {
    const inputValue = elements.searchInput.value.trim();
    updateClearButtonVisibility(inputValue);

    if (inputValue.length === 0) {
        resetUI();
        return;
    }

    if (inputValue.length < 2) {
        hideSearchElements();
        return;
    }

    debounce(performSearch, DEBOUNCE_DELAY);
}

function handleModalClick(event) {
    if (event.target === elements.rightModal) {
        closeModal();
    }
}

function handleCloseModal(e) {
    if (e.target.matches('.close-modal')) {
        e.stopPropagation();
        closeModal();
    }
}

function handleOutsideClick(event) {
    if (!elements.searchInput.contains(event.target) && !elements.searchResults.contains(event.target)) {
        elements.searchResults.style.display = 'none';
    }
}

function handleResize() {
    if (elements.rightsContainer.classList.contains('visible')) {
        handleSearch();
    }
}

// UI Functions
function updateClearButtonVisibility(inputValue) {
    elements.clearButton.style.display = inputValue.length > 0 ? 'block' : 'none';
}

function resetUI() {
    elements.searchResults.style.display = 'none';
    elements.rightsContainer.classList.remove('visible');
    elements.rightsInfo.style.display = 'none';
    elements.searchLoader.style.display = 'none';
}

function hideSearchElements() {
    elements.searchResults.style.display = 'none';
    elements.searchLoader.style.display = 'none';
}

function clearSearch() {
    elements.searchInput.value = '';
    resetUI();
    elements.searchInput.focus();
}

// Data Loading and Rendering
async function loadCountryData() {
    try {
        const fetchPromises = countryJSONHashes.map(fetchCountryData);
        const results = await Promise.all(fetchPromises);
        results.forEach(({ country, data }) => {
            countryData.set(country, data);
        });
    } catch (error) {
        console.error('Error loading country data:', error);
    }
}

async function fetchCountryData(countryInfo) {
    const response = await fetch(`json_databases/${countryInfo.country}.json`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    const fileHash = await memoizedSHA256(text);

    verifyFileHash(countryInfo, fileHash);

    const data = JSON.parse(text);
    return { country: countryInfo.country, data: data[countryInfo.country] };
}

function verifyFileHash(countryInfo, fileHash) {
    if (fileHash === null) {
        console.warn(`Unable to verify file hash for ${countryInfo.country}.json. Proceeding without verification.`);
    } else if (fileHash !== countryInfo.fileHash) {
        console.warn(`File hash mismatch for ${countryInfo.country}.json. Expected: ${countryInfo.fileHash}, Got: ${fileHash}`);
    }
}

function renderRights(country, region) {
    const countryDataObj = countryData.get(country);
    if (!countryDataObj) {
        console.error('Country data not loaded');
        return;
    }

    const regionData = countryDataObj.Regions[region];

    if (!regionData) {
        displayNoDataAvailable();
        return;
    }

    const { rights, laws, authorities } = processRegionData(regionData, countryDataObj);
    const { foundDefaultRightsCount, foundNoneDefaultRightsCount } = countRights(rights);

    updateRightsInfo(foundDefaultRightsCount, foundNoneDefaultRightsCount, laws, authorities);
    renderRightsDivs(rights);
}

function processRegionData(regionData, countryDataObj) {
    const rights = regionData.Rights;
    const laws = processLaws(regionData.Laws, countryDataObj.Laws);
    const authorities = processAuthorities(regionData.Authorities, countryDataObj.Authorities);
    return { rights, laws, authorities };
}

function processLaws(laws, lawsData) {
    return laws.map(law => law !== "N/A" 
        ? `<a href="${lawsData[law].Link}">${law}</a>` 
        : "No Data Privacy Law"
    ).join(', ');
}

function processAuthorities(authorities, authoritiesData) {
    return authorities.map(authority => {
        const authorityInfo = authoritiesData[authority];
        return authorityInfo && authorityInfo.Link 
            ? `<a href="${authorityInfo.Link}">${authority}</a>`
            : authority;
    }).join(', ');
}

function countRights(rights) {
    let foundDefaultRightsCount = 0;
    let foundNoneDefaultRightsCount = 0;

    rights.forEach(right => {
        if (!defaultRights.some(defaultRight => defaultRight.title === right.Right)) {
            foundNoneDefaultRightsCount++;
        }
    });

    defaultRights.forEach(currentDefaultRight => {
        if (rights.some(r => r.Right === currentDefaultRight.title)) {
            foundDefaultRightsCount++;
        }
    });

    return { foundDefaultRightsCount, foundNoneDefaultRightsCount };
}

function updateRightsInfo(foundDefaultRightsCount, foundNoneDefaultRightsCount, laws, authorities) {
    const extraRightsText = foundNoneDefaultRightsCount >= 1 ? ` and ${foundNoneDefaultRightsCount} extra rights.` : ".";
    elements.rightsInfo.innerHTML = `
        <p>You are entitled to ${foundDefaultRightsCount} out of 9 standard data privacy rights${extraRightsText}</p>
        <p><strong>Laws:</strong> ${laws}</p>
        <p><strong>Authorities:</strong> ${authorities}</p>
    `;
}

function renderRightsDivs(rights) {
    const fragment = document.createDocumentFragment();

    defaultRights.forEach(currentDefaultRight => {
        const foundRightObject = rights.find(r => r.Right === currentDefaultRight.title);
        const isDefaultRightFound = foundRightObject != null;
        const div = createRightDiv(currentDefaultRight.title, currentDefaultRight.description, currentDefaultRight.longDescription, isDefaultRightFound, foundRightObject?.Timeframe);
        fragment.appendChild(div);
    });

    rights.forEach(right => {
        if (!defaultRights.some(defaultRight => defaultRight.title === right.Right)) {
            const div = createRightDiv(right.Right, right.Description, right.Description, true, right.Timeframe);
            fragment.appendChild(div);
        }
    });

    elements.rightsContainer.innerHTML = '';
    elements.rightsContainer.appendChild(fragment);
    elements.rightsContainer.offsetHeight; // Force layout recalculation
    elements.rightsContainer.classList.add('visible');
}

function createRightDiv(title, description, longDescription, isActive, timeframe) {
    const div = document.createElement('div');
    div.className = `right-item ${isActive ? 'active' : 'inactive'}`;
    div.innerHTML = `
        <span class="check ${isActive ? 'active' : 'inactive'}">${isActive ? '✓' : '✗'}</span>
        <div class="right-title">${title}</div>
        <div class="right-description">${description || 'No description available'}</div>
        <div class="right-laws">Timeframe: ${timeframe || 'N/A'}</div>
        <div class="right-overlay">MORE</div>
    `;
    div.onclick = () => openModal(title, longDescription, timeframe);
    return div;
}

function openModal(title, description, timeframe) {
    elements.modalTitle.textContent = title;
    elements.modalDescription.textContent = description || 'No description available';
    elements.modalTimeframe.textContent = `Timeframe: ${timeframe || 'N/A'}`;

    elements.rightModal.style.display = 'flex';
    elements.rightModal.offsetWidth; // Trigger reflow
    elements.rightModal.classList.add('show');
}

function closeModal() {
    elements.rightModal.classList.remove('show');
    setTimeout(() => {
        elements.rightModal.style.display = 'none';
    }, 300); // Match this with the transition duration
}

// Search Functions
async function performSearch() {
    if (countryData.size === 0) {
        await loadCountryData();
    }

    const inputValue = elements.searchInput.value.trim();
    elements.searchLoader.style.display = 'block';
    const results = await getAllRegionsAndCountries(inputValue);
    elements.searchLoader.style.display = 'none';

    displaySearchResults(results);
}

function displaySearchResults(results) {
    if (results.length > 0) {
        elements.searchResults.innerHTML = '';
        results.forEach(result => {
            const div = createSearchResultDiv(result);
            elements.searchResults.appendChild(div);
        });
    } else {
        elements.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
    }
    elements.searchResults.style.display = 'block';
}

function createSearchResultDiv(result) {
    const div = document.createElement('div');
    div.className = 'search-result-item';
    if (result.state) {
        div.innerHTML = `<span class="region">${result.state}</span>, <span class="country">${result.country}</span>`;
    } else {
        div.innerHTML = `<span class="country">${result.country}</span>`;
    }
    div.onclick = () => selectSearchResult(result);
    return div;
}

function selectSearchResult(result) {
    elements.searchInput.value = result.state ? `${result.state}, ${result.country}` : result.country;
    elements.searchResults.style.display = 'none';
    renderRightsForSelection(result);
}

function renderRightsForSelection(selection) {
    const { countryFound, regionFound } = findCountryAndRegion(selection);

    if (countryFound && regionFound) {
        renderRights(countryFound, regionFound);
        elements.rightsContainer.classList.add('visible');
        elements.rightsInfo.style.display = 'block';
        elements.rightsContainer.scrollTop = 0;
    } else {
        displayNoDataAvailable();
    }
}

function findCountryAndRegion(selection) {
    let countryFound = null;
    let regionFound = null;

    for (const [country, data] of countryData) {
        if (country.toLowerCase() === selection.country.toLowerCase()) {
            countryFound = country;
            if (selection.state) {
                regionFound = Object.keys(data.Regions).find(region => 
                    region.toLowerCase() === selection.state.toLowerCase()
                );
            } else {
                regionFound = Object.keys(data.Regions)[0];
            }
            break;
        }
    }

    return { countryFound, regionFound };
}

function displayNoDataAvailable() {
    elements.rightsContainer.classList.remove('visible');
    elements.rightsInfo.textContent = "No data available for this selection.";
    elements.rightsInfo.style.display = 'block';
}

// API and Cache Functions
async function getAllRegionsAndCountries(query) {
    const cachedResults = getCachedResults(query);
    if (cachedResults) return cachedResults;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`;
    const uniqueResults = new Map();

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`nominatim HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        data.forEach(item => {
            const { address } = item;
            if (address.state && address.country) {
                uniqueResults.set(`${address.state}, ${address.country}`, { state: address.state, country: address.country });
            } else if (address.country) {
                uniqueResults.set(address.country, { country: address.country });
            }
        });

        const results = Array.from(uniqueResults.values());
        setCachedResults(query, results);
        return results;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function getCachedResults(query) {
    const cachedResult = searchCache.get(query);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_EXPIRATION) {
        return cachedResult.data;
    }
    return null;
}

function setCachedResults(query, results) {
    searchCache.set(query, { data: results, timestamp: Date.now() });
}

function clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRATION) {
            searchCache.delete(key);
        }
    }
}

// Utility Functions
async function calculateSHA256(str) {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.warn('Crypto API not available, falling back to js-sha256:', error);
        }
    }
    
    // Fallback to js-sha256
    if (typeof sha256 === 'function') {
        return sha256(str);
    } else {
        console.error('Neither Crypto API nor js-sha256 are available');
        return null;
    }
}

const memoizedSHA256 = memoize(calculateSHA256);

function memoize(fn) {
    const cache = new Map();
    return function(...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.HomeModule = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    // Just return a value to define the module export.
    // This returns an object, but the module
    // can return a function as the exported value.
    return {
        loadCountryData,
        renderRights,
        getAllRegionsAndCountries,
        setCachedResults,
        getCachedResults,
        clearExpiredCache,
        countryJSONHashes,
        elements,
        countryData,
        searchCache
    };
}));