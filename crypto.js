/**
 * Cryptographic utilities for Risk.fun game verification
 * This file provides functions for verifying provably fair games
 */

/**
 * Convert hex string to Uint8Array
 * @param {string} hex - Hexadecimal string
 * @returns {Uint8Array} - Byte array
 */
function hexToBytes(hex) {
    // Remove any whitespace and ensure lowercase
    const cleanHex = hex.replace(/\s/g, '').toLowerCase();
    
    // Ensure even length
    if (cleanHex.length % 2 !== 0) {
        throw new Error('Invalid hex string: odd length');
    }
    
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
        bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes - Byte array
 * @returns {string} - Hexadecimal string
 */
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verify that a seed matches its hash using Keccak256
 * @param {string} seed - The revealed seed (hex string)
 * @param {string} expectedHash - The expected hash (hex string)
 * @returns {boolean} - True if verification passes
 */
function verifySeed(seed, expectedHash) {
    try {
        console.log('🔍 Verifying seed with Keccak256:');
        console.log('   Seed (first 16 chars):', seed.slice(0, 16) + '...');
        console.log('   Expected hash (first 16 chars):', expectedHash.slice(0, 16) + '...');
        
        // Convert the hex seed string to bytes
        const seedBytes = hexToBytes(seed);
        console.log('   Seed bytes length:', seedBytes.length);
        
        // Generate hash using Keccak256 (same as backend)
        // Try different ways the keccak256 function might be exposed
        let actualHash;
        if (typeof window.keccak256 === 'function') {
            actualHash = window.keccak256(seedBytes);
        } else if (typeof sha3.keccak_256 === 'function') {
            actualHash = sha3.keccak_256(seedBytes);
        } else if (typeof sha3.keccak256 === 'function') {
            actualHash = sha3.keccak256(seedBytes);
        } else {
            throw new Error('keccak256 function not found');
        }
        console.log('   Generated hash (first 16 chars):', actualHash.slice(0, 16) + '...');
        
        // Compare hashes (case insensitive)
        const isValid = actualHash.toLowerCase() === expectedHash.toLowerCase();
        console.log('   Verification result:', isValid ? '✅ VALID' : '❌ INVALID');
        
        return isValid;
    } catch (error) {
        console.error('❌ Error verifying seed:', error);
        return false;
    }
}

/**
 * Generate deterministic random number using HMAC-SHA256 (Original System)
 * This exactly matches the original algorithm used in riskdotfun-api
 * @param {string} seed - Game seed (hex string)
 * @param {number} nonce - Row index (nonce)
 * @returns {number} - Random number between 0 and 1
 */
function generateDeterministicRandom(seed, nonce) {
    // Use global CryptoJS object (loaded via CDN)
    if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS library not loaded');
    }
    
    const message = `${seed}:${nonce}`;
    const hash = CryptoJS.HmacSHA256(message, seed).toString(CryptoJS.enc.Hex);

    // Convert first 8 hex chars to number and normalize to 0-1 (matches API exactly)
    const hexValue = hash.substring(0, 8);
    const intValue = parseInt(hexValue, 16);
    return intValue / 0xffffffff; // Normalize to 0-1
}

// Removed dual-seed functions - API now consistently uses original algorithm only

/**
 * Generate death tile positions from seed
 * CRITICAL: Always uses original HMAC-SHA256 algorithm to match riskdotfun-api storage
 * @param {string} seed - Game seed (hex string)  
 * @param {number[]} rowConfig - Array of tile counts per row
 * @returns {number[]} - Array of death tile indices per row
 */
function generateDeathTiles(seed, rowConfig) {
    if (!seed || !rowConfig) return [];
    
    try {
        console.log('🎲 Generating death tiles using ORIGINAL HMAC-SHA256 algorithm (matches API storage)...');
        console.log('   Seed:', seed.slice(0, 16) + '...');
        console.log('   Row config:', rowConfig);
        
        const deathTiles = [];
        
        // Always use original HMAC-SHA256 system (matches API storage logic)
        rowConfig.forEach((tiles, index) => {
            try {
                const random = generateDeterministicRandom(seed, index);
                const deathTileIndex = Math.floor(random * tiles);
                deathTiles.push(deathTileIndex);
                
                console.log(`   Row ${index + 1}: ${tiles} tiles, death at index ${deathTileIndex} (random: ${Math.round(random * 1000) / 1000})`);
            } catch (error) {
                console.error(`   Error generating death tile for row ${index + 1}:`, error);
                deathTiles.push(0); // Fallback to first tile
            }
        });
        
        console.log('   Generated death tiles:', deathTiles);
        console.log('   Algorithm: ORIGINAL HMAC-SHA256 (matches riskdotfun-api storage)');
        
        return deathTiles;
    } catch (error) {
        console.error('❌ Error generating death tiles from seed:', error);
        return [];
    }
}

/**
 * Parse row configuration string
 * @param {string} rowConfigStr - Comma-separated string of numbers
 * @returns {number[]} - Array of numbers
 */
function parseRowConfig(rowConfigStr) {
    if (!rowConfigStr || typeof rowConfigStr !== 'string') {
        return [];
    }
    
    try {
        return rowConfigStr
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => parseInt(s, 10))
            .filter(n => !isNaN(n) && n > 0);
    } catch (error) {
        console.error('Error parsing row config:', error);
        return [];
    }
}


/**
 * Validate game input data
 * @param {Object} gameData - Game data object
 * @returns {Object} - Validation result with errors array
 */
function validateGameData(gameData) {
    const errors = [];
    
    // Validate seed hash
    if (!gameData.seedHash || gameData.seedHash.trim().length === 0) {
        errors.push('Seed hash is required');
    } else if (!/^[a-fA-F0-9]+$/.test(gameData.seedHash.trim())) {
        errors.push('Seed hash must be a valid hexadecimal string');
    }
    
    // Validate seed
    if (!gameData.seed || gameData.seed.trim().length === 0) {
        errors.push('Revealed seed is required');
    } else if (!/^[a-fA-F0-9]+$/.test(gameData.seed.trim())) {
        errors.push('Revealed seed must be a valid hexadecimal string');
    }
    
    // Validate row configuration
    if (!gameData.rowConfig || gameData.rowConfig.length === 0) {
        errors.push('Row configuration is required');
    } else if (gameData.rowConfig.some(n => n < 1 || n > 10)) {
        errors.push('Row configuration must contain numbers between 1 and 10');
    }
    
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Create verification result object
 * @param {Object} gameData - Game input data
 * @param {boolean} isValid - Whether verification passed
 * @param {number[]} deathTiles - Generated death tiles
 * @returns {Object} - Verification result
 */
function createVerificationResult(gameData, isValid, deathTiles = []) {
    return {
        gameData: {
            seedHash: gameData.seedHash,
            seed: gameData.seed,
            rowConfig: gameData.rowConfig
        },
        verification: {
            seedValid: isValid,
            deathTiles,
            timestamp: new Date().toISOString(),
            verifierVersion: '1.0.0'
        },
        summary: {
            totalRows: gameData.rowConfig ? gameData.rowConfig.length : 0,
            totalTiles: gameData.rowConfig ? gameData.rowConfig.reduce((sum, n) => sum + n, 0) : 0
        }
    };
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        hexToBytes,
        bytesToHex,
        verifySeed,
        generateDeterministicRandom,
        generateDeathTiles,
        parseRowConfig,
        validateGameData,
        createVerificationResult
    };
}
