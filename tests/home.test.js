const fs = require('fs');
const path = require('path');

// Mock DOM elements and functions
global.document = {
    getElementById: () => ({
        addEventListener: () => {},
        style: {},
        classList: {
            add: () => {},
            remove: () => {},
            contains: () => false
        },
        appendChild: () => {},
        offsetHeight: 0,
        scrollTop: 0,
        innerHTML: ''
    }),
    createElement: () => ({
        className: '',
        innerHTML: '',
        style: {},
        appendChild: () => {},
        addEventListener: () => {}
    }),
    createDocumentFragment: () => ({
        appendChild: () => {}
    }),
    body: {
        addEventListener: () => {}
    },
    addEventListener: () => {}
};

global.window = {
    addEventListener: () => {}
};

// Mock fetch function using real JSON data
global.fetch = async (url) => {
    if (url.includes('json_databases')) {
        const country = url.split('/').pop().split('.')[0];
        const filePath = path.join(__dirname, '..', 'json_databases', `${country}.json`);
        const data = fs.readFileSync(filePath, 'utf8');
        return {
            ok: true,
            text: async () => data
        };
    }
    if (url.includes('nominatim.openstreetmap.org')) {
        return {
            ok: true,
            json: async () => (
                [{"place_id":373812047,"licence":"Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright","osm_type":"relation","osm_id":5750005,"lat":"-33.8698439","lon":"151.2082848","class":"boundary","type":"administrative","place_rank":14,"importance":0.7245908962989684,"addresstype":"city","name":"Sydney","display_name":"Sydney, Council of the City of Sydney, New South Wales, Australia","address":{"city":"Sydney","municipality":"Council of the City of Sydney","state":"New South Wales","ISO3166-2-lvl4":"AU-NSW","country":"Australia","country_code":"au"},"boundingbox":["-34.1732416","-33.3641864","150.2608250","151.3438980"]},{"place_id":18593316,"licence":"Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright","osm_type":"relation","osm_id":1251066,"lat":"-33.8890382","lon":"151.2050386296839","class":"boundary","type":"administrative","place_rank":12,"importance":0.5019825675589121,"addresstype":"municipality","name":"Council of the City of Sydney","display_name":"Council of the City of Sydney, New South Wales, Australia","address":{"municipality":"Council of the City of Sydney","state":"New South Wales","ISO3166-2-lvl4":"AU-NSW","country":"Australia","country_code":"au"},"boundingbox":["-33.9243832","-33.8535496","151.1748638","151.2330104"]},{"place_id":246785508,"licence":"Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright","osm_type":"relation","osm_id":9132453,"lat":"46.1382112","lon":"-60.1941912","class":"boundary","type":"administrative","place_rank":16,"importance":0.4658173637393935,"addresstype":"town","name":"Sydney","display_name":"Sydney, Cape Breton Regional Municipality, Cape Breton County, Nova Scotia, Canada","address":{"town":"Sydney","county":"Cape Breton Regional Municipality","state":"Nova Scotia","ISO3166-2-lvl4":"CA-NS","country":"Canada","country_code":"ca"},"boundingbox":["46.1071148","46.1786423","-60.2161333","-60.1450518"]}
            ])
        };
    }
    throw new Error('Unexpected URL in fetch mock');
};

// Import the functions to test
const HomeModule = require('../js/home.js');

// Destructure the imported module
const {
    loadCountryData,
    getAllRegionsAndCountries,
    getCachedResults,
    setCachedResults,
    clearExpiredCache,
    countryJSONHashes,
    elements,
    countryData,
    searchCache
} = HomeModule;

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m"
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m"
    }
};

// Utility function to reset mocks
function resetMocks() {
    for (const key in elements) {
        elements[key] = document.getElementById(key);
    }
    countryData.clear();
    searchCache.clear();
}

// Test suite
const tests = [
    {
        name: "Load Country Data",
        description: "Verifies that country data is loaded correctly from real JSON files",
        test: async () => {
            resetMocks();
            await loadCountryData();
            const loadedCountries = [...countryData.keys()];
            console.log("Loaded countries:", loadedCountries);
            return countryData.size === countryJSONHashes.length &&
                   countryJSONHashes.every(({country}) => countryData.has(country));
        }
    },
    {
        name: "Get All Regions and Countries",
        description: "Checks if the function returns correct region and country data",
        test: async () => {
            resetMocks();
            const query = "sydney";
            const results = await getAllRegionsAndCountries(query);
            console.log("Search results for 'Sydney':", results);

            setCachedResults(query, results);

            return results.length >= 1 &&
                   results[0].state === "New South Wales" &&
                   results[0].country === "Australia";
        }
    },
    {
        name: "Search Caching",
        description: "Ensures that search results are properly cached",
        test: async () => {
            resetMocks();
            await getAllRegionsAndCountries("Sydney");
            const cachedResults = getCachedResults("Sydney");
            console.log("Cached results for 'Sydney':", cachedResults);
            return cachedResults !== null &&
                   cachedResults[0].state === "New South Wales" &&
                   cachedResults[0].country === "Australia";
        }
    },
    {
        name: "Clear Expired Cache",
        description: "Verifies that expired cache entries are removed",
        test: () => {
            resetMocks();
            const oldTimestamp = Date.now() - 3700000; // Older than CACHE_EXPIRATION
            searchCache.set("OldQuery", { data: [], timestamp: oldTimestamp });
            searchCache.set("NewQuery", { data: [], timestamp: Date.now() });
            clearExpiredCache();
            console.log("Cache after clearing:", [...searchCache.keys()]);
            return !searchCache.has("OldQuery") && searchCache.has("NewQuery");
        }
    }
];

// Run tests
async function runTests() {
    console.log(`\n${colors.bright}${colors.fg.cyan}======= home.js Tests =======${colors.reset}\n`);
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const test of tests) {
        try {
            console.log(`${colors.bright}${colors.fg.yellow}Running: ${test.name}${colors.reset}`);
            console.log(`${colors.dim}Description: ${test.description}${colors.reset}`);
            
            const startTime = Date.now();
            const result = await test.test();
            const duration = Date.now() - startTime;
            
            if (result) {
                console.log(`${colors.fg.green}✓ PASSED${colors.reset} (${duration}ms)`);
                passedTests++;
            } else {
                console.log(`${colors.fg.red}✗ FAILED${colors.reset} (${duration}ms)`);
                failedTests++;
            }
        } catch (error) {
            console.error(`${colors.fg.red}✗ ERROR${colors.reset} - ${error.message}`);
            console.error(`${colors.dim}${error.stack}${colors.reset}`);
            failedTests++;
        }
        console.log(); // Add a newline for spacing between tests
    }
    
    console.log(`${colors.bright}${colors.fg.cyan}=============== Test Summary ===============${colors.reset}`);
    console.log(`${colors.fg.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.fg.red}Failed: ${failedTests}${colors.reset}`);
    console.log(`${colors.fg.yellow}Total:  ${tests.length}${colors.reset}`);
    
    const passRate = (passedTests / tests.length) * 100;
    console.log(`${colors.bright}Pass Rate: ${passRate.toFixed(2)}%${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.fg.cyan}==============================================${colors.reset}\n`);
}

// Run the tests
runTests();