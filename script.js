/**
 * Risk.fun Hash Verifier - Main Script
 * Handles UI interactions and game verification
 */

// Global state
let verificationResult = null;
let isDebugMode = false;

// DOM elements
const elements = {
    form: null,
    seedHashInput: null,
    seedInput: null,
    rowConfigInput: null,
    verifyButton: null,
    buttonText: null,
    loadingSpinner: null,
    verificationStatus: null,
    gameVisual: null,
    copyJsonButton: null,
    debugSection: null,
    debugContent: null
};

/**
 * Initialize the application
 */
function init() {
    console.log('🚀 Risk.fun Hash Verifier initialized');
    
    // Get DOM elements
    elements.form = document.getElementById('verification-form');
    elements.seedHashInput = document.getElementById('seedHash');
    elements.seedInput = document.getElementById('seed');
    elements.rowConfigInput = document.getElementById('rowConfig');
    elements.verifyButton = document.getElementById('verify-button');
    elements.buttonText = elements.verifyButton?.querySelector('.button-text');
    elements.loadingSpinner = elements.verifyButton?.querySelector('.loading-spinner');
    elements.verificationStatus = document.getElementById('verification-status');
    elements.gameVisual = document.getElementById('game-visual');
    elements.copyJsonButton = document.getElementById('copy-json');
    elements.debugSection = document.getElementById('debug-section');
    elements.debugContent = document.getElementById('debug-content');
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for debug mode
    isDebugMode = window.location.search.includes('debug=true') || 
                  localStorage.getItem('riskfun-verifier-debug') === 'true';
    
    if (isDebugMode) {
        elements.debugSection.style.display = 'block';
        console.log('🐛 Debug mode enabled');
    }
    
    // Load sample data if in debug mode
    if (isDebugMode) {
        loadSampleData();
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    if (elements.copyJsonButton) {
        elements.copyJsonButton.addEventListener('click', handleCopyJson);
    }
    
    // Enable debug mode with Ctrl+Shift+D
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            toggleDebugMode();
        }
    });
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    console.log('📝 Form submitted');
    
    // Show loading state
    setLoadingState(true);
    updateStatus('checking', 'Verifying...');
    
    try {
        // Get form data
        const formData = getFormData();
        console.log('Form data:', formData);
        
        // Validate input
        const validation = validateGameData(formData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Add small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Perform verification
        const result = await verifyGame(formData);
        
        // Update UI with results
        displayResults(result);
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        updateStatus('invalid', `Verification Failed: ${error.message}`);
        showError(error.message);
        
        if (isDebugMode) {
            updateDebugInfo(`Error: ${error.message}\nStack: ${error.stack}`);
        }
    } finally {
        setLoadingState(false);
    }
}

/**
 * Get form data
 */
function getFormData() {
    const seedHash = elements.seedHashInput?.value.trim() || '';
    const seed = elements.seedInput?.value.trim() || '';
    const rowConfigStr = elements.rowConfigInput?.value.trim() || '';
    const rowConfig = parseRowConfig(rowConfigStr);
    
    // DEBUG: Log exact inputs
    console.log('📋 STANDALONE VERIFIER INPUTS:');
    console.log('   Seed Hash (first 16):', seedHash.slice(0, 16) + '...');
    console.log('   Seed (first 16):', seed.slice(0, 16) + '...');
    console.log('   Row Config String:', rowConfigStr);
    console.log('   Row Config Array:', rowConfig);
    console.log('   Row Config Length:', rowConfig.length);
    
    return {
        seedHash,
        seed,
        rowConfig
    };
}

/**
 * Verify game data
 */
async function verifyGame(gameData) {
    console.log('🔍 Starting game verification...');
    console.log('📊 VERIFICATION INPUTS:');
    console.log('   Seed (full):', gameData.seed);
    console.log('   Seed Hash (full):', gameData.seedHash);
    console.log('   Row Config (full):', gameData.rowConfig);
    
    // Verify seed hash
    const isValid = verifySeed(gameData.seed, gameData.seedHash);
    console.log('🔐 Seed verification result:', isValid);
    
    // Generate death tiles (always use original algorithm)
    const deathTiles = generateDeathTiles(gameData.seed, gameData.rowConfig);
    
    // TEST: Compare with our test script results for debugging
    if (gameData.seed === '283c27bfec0a6322495488cb61324e8665c81a2054a08e3190f517c69b8d49808') {
        console.log('🧪 COMPARING WITH TEST SCRIPT RESULTS:');
        console.log('   Generated bombs:', deathTiles);
        console.log('   Expected bombs: [1,1,1,0,1,2,2,0,2,2,0,1,3,1,1,1,1,1,3,0,1,1,0,0,1]');
        console.log('   First 5 match test:', deathTiles.slice(0, 5).join(',') === '1,1,1,0,1' ? '✅' : '❌');
    }
    
    // Create verification result
    const result = createVerificationResult(gameData, isValid, deathTiles);
    
    console.log('✅ Verification complete:', result);
    
    if (isDebugMode) {
        updateDebugInfo(JSON.stringify(result, null, 2));
    }
    
    return result;
}

/**
 * Display verification results
 */
function displayResults(result) {
    verificationResult = result;
    
    // Update status
    if (result.verification.seedValid) {
        updateStatus('valid', 'Verification Passed');
        renderGameBoard(result);
        elements.copyJsonButton.style.display = 'block';
    } else {
        updateStatus('invalid', 'Verification Failed');
        showError('Seed hash verification failed. The provided seed does not match the hash.');
    }
}

/**
 * Render game board
 */
function renderGameBoard(result) {
    const { gameData, verification } = result;
    const { rowConfig } = gameData;
    const { deathTiles } = verification;
    
    console.log('🎨 Rendering game board...');
    
    // Create game board HTML
    const gameBoard = document.createElement('div');
    gameBoard.className = 'fade-in';
    
    // Game header
    const header = document.createElement('div');
    header.className = 'game-header';
    header.innerHTML = `
        <h4>PROVABLY FAIR GAME OUTCOME</h4>
        <p>Death tiles revealed for verification • Game seed: ${gameData.seed.slice(0, 16)}...</p>
    `;
    gameBoard.appendChild(header);
    
    // Game board container
    const boardContainer = document.createElement('div');
    boardContainer.className = 'game-board';
    
    // Render rows (reverse order like the original)
    const rows = [...rowConfig].reverse();
    rows.forEach((tileCount, visualIndex) => {
        const actualRowIndex = rowConfig.length - 1 - visualIndex;
        const displayNumber = actualRowIndex + 1;
        
        const rowElement = createGameRow(
            displayNumber,
            tileCount,
            deathTiles[actualRowIndex]
        );
        
        boardContainer.appendChild(rowElement);
    });
    
    gameBoard.appendChild(boardContainer);
    
    // Game footer
    const footer = document.createElement('div');
    footer.className = 'game-footer';
    footer.innerHTML = '💣 Death tiles revealed for verification transparency';
    gameBoard.appendChild(footer);
    
    // Replace placeholder with game board
    elements.gameVisual.innerHTML = '';
    elements.gameVisual.appendChild(gameBoard);
    
    console.log('✅ Game board rendered');
}

/**
 * Create a game row element
 */
function createGameRow(displayNumber, tileCount, deathTileIndex) {
    const row = document.createElement('div');
    row.className = 'game-row';
    
    // Row number
    const rowNumber = document.createElement('div');
    rowNumber.className = 'row-number';
    rowNumber.textContent = displayNumber;
    row.appendChild(rowNumber);
    
    // Tiles container
    const tilesContainer = document.createElement('div');
    tilesContainer.className = 'tiles-container';
    
    // Empty tiles for centering (max 7 tiles display)
    const maxTiles = 7;
    const emptyStart = Math.max(0, Math.floor((maxTiles - tileCount) / 2));
    const emptyEnd = Math.max(0, Math.ceil((maxTiles - tileCount) / 2));
    
    // Leading empty tiles
    for (let i = 0; i < emptyStart; i++) {
        const emptyTile = document.createElement('div');
        emptyTile.className = 'tile empty';
        tilesContainer.appendChild(emptyTile);
    }
    
    // Actual game tiles
    for (let tileIndex = 0; tileIndex < tileCount; tileIndex++) {
        const tile = createGameTile(tileIndex, deathTileIndex);
        tilesContainer.appendChild(tile);
    }
    
    // Trailing empty tiles
    for (let i = 0; i < emptyEnd; i++) {
        const emptyTile = document.createElement('div');
        emptyTile.className = 'tile empty';
        tilesContainer.appendChild(emptyTile);
    }
    
    row.appendChild(tilesContainer);
    return row;
}

/**
 * Create a game tile element with web app styling
 */
function createGameTile(tileIndex, deathTileIndex) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    const isDeath = deathTileIndex === tileIndex;
    
    if (isDeath) {
        // Death tile (bomb) - match web app styling
        tile.className += ' bomb';
        tile.title = 'Death tile';
        
        // Create bomb container with background (matches web app)
        const bombContainer = document.createElement('div');
        bombContainer.className = 'bomb-container';
        
        // Create bomb image (matches web app)
        const bombImage = document.createElement('img');
        bombImage.src = 'bomb.svg';
        bombImage.alt = 'Bomb';
        
        bombContainer.appendChild(bombImage);
        tile.appendChild(bombContainer);
    } else {
        // Safe tile
        tile.title = 'Safe tile';
    }
    
    return tile;
}

/**
 * Update verification status
 */
function updateStatus(type, message) {
    if (!elements.verificationStatus) return;
    
    elements.verificationStatus.className = `verification-status status-${type}`;
    
    let icon = '';
    switch (type) {
        case 'checking':
            icon = '<div class="loading-spinner"></div>';
            break;
        case 'valid':
            icon = '✅';
            break;
        case 'invalid':
            icon = '❌';
            break;
    }
    
    elements.verificationStatus.innerHTML = `${icon} <span>${message}</span>`;
}

/**
 * Set loading state
 */
function setLoadingState(loading) {
    if (!elements.verifyButton) return;
    
    elements.verifyButton.disabled = loading;
    
    if (elements.buttonText) {
        elements.buttonText.textContent = loading ? 'Verifying...' : 'Verify Game';
    }
    
    if (elements.loadingSpinner) {
        elements.loadingSpinner.style.display = loading ? 'block' : 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    // Remove existing messages
    const existingMessages = elements.gameVisual.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error fade-in';
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    
    // Show placeholder with error
    elements.gameVisual.innerHTML = `
        <div class="placeholder">
            <h4>VERIFICATION FAILED</h4>
            <p>Please check your input data and try again.</p>
        </div>
    `;
    
    elements.gameVisual.prepend(errorDiv);
}

/**
 * Handle copy JSON button
 */
function handleCopyJson() {
    if (!verificationResult) {
        console.warn('No verification result to copy');
        return;
    }
    
    try {
        const jsonString = JSON.stringify(verificationResult, null, 2);
        navigator.clipboard.writeText(jsonString);
        
        // Visual feedback
        const originalText = elements.copyJsonButton.innerHTML;
        elements.copyJsonButton.innerHTML = '✅ Copied!';
        elements.copyJsonButton.style.background = '#6fff47';
        
        setTimeout(() => {
            elements.copyJsonButton.innerHTML = originalText;
            elements.copyJsonButton.style.background = '#58ef50';
        }, 2000);
        
        console.log('📋 Verification data copied to clipboard');
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        
        // Fallback - show data in alert
        const jsonString = JSON.stringify(verificationResult, null, 2);
        alert('Copy failed. Here is the verification data:\n\n' + jsonString);
    }
}

/**
 * Toggle debug mode
 */
function toggleDebugMode() {
    isDebugMode = !isDebugMode;
    localStorage.setItem('riskfun-verifier-debug', isDebugMode.toString());
    
    if (isDebugMode) {
        elements.debugSection.style.display = 'block';
        console.log('🐛 Debug mode enabled');
        if (verificationResult) {
            updateDebugInfo(JSON.stringify(verificationResult, null, 2));
        }
    } else {
        elements.debugSection.style.display = 'none';
        console.log('🐛 Debug mode disabled');
    }
}

/**
 * Update debug information
 */
function updateDebugInfo(info) {
    if (elements.debugContent) {
        elements.debugContent.textContent = info;
    }
}

/**
 * Load sample data for testing
 */
function loadSampleData() {
    console.log('📝 Loading sample data');
    
    const sampleData = {
        seedHash: 'cd46eca4d913c680f4dcbc5f262683fd568b2693bc96446527f2f22da5bae2b1',
        seed: '5c24dd09c7b74794d5521175b26662aa030278b4f8c52adc8d6b2989e26f23113',
        rowConfig: '6,5,4,3,2'
    };
    
    if (elements.seedHashInput) elements.seedHashInput.value = sampleData.seedHash;
    if (elements.seedInput) elements.seedInput.value = sampleData.seed;
    if (elements.rowConfigInput) elements.rowConfigInput.value = sampleData.rowConfig;
}

/**
 * Initialize when DOM is loaded
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
