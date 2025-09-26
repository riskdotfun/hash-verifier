# Changelog

All notable changes to the Risk.fun Hash Verifier will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-21

### Added
- Initial release of Risk.fun Hash Verifier
- Cryptographic seed verification using Keccak256 algorithm
- Visual game board reconstruction with death tile display
- Client-side verification with no external dependencies
- Custom Node.js HTTP server for serving static files
- Cross-browser compatibility with fallback mechanisms
- Professional web interface matching Risk.fun design system
- Comprehensive error handling and validation
- Debug mode for development
- JSON export functionality for verification data
- Security features including CORS and path traversal protection
- Complete documentation with usage examples

### Technical Features
- Keccak256 hash verification compatible with backend implementation
- Deterministic random number generation for death tile placement
- Browser-compatible cryptographic functions using js-sha3 library
- Responsive design for desktop and mobile devices
- Real-time verification status updates
- Professional error messaging and user feedback

### Security
- Client-side only processing (no data transmission)
- Input validation and sanitization
- Protection against common web vulnerabilities
- Open source code for community audit
- MIT license for maximum flexibility

## [1.1.0] - 2025-09-26

### Fixed
- **CRITICAL**: Fixed algorithm consistency to match riskdotfun api
  - **Unified Algorithm**: Always uses original HMAC-SHA256 system (`HMAC-SHA256(${seed}:${nonce}, seed)`)
  - **Verification Accuracy**: Ensures verification regeneration matches stored values exactly

### Added
- **Visual Enhancement**: Applied web app's bomb styling to verifier
  - Added SVG bomb asset matching main game design
  - Red bomb styling with proper CSS filters for death tiles
  - Dark red background (`#261e1e`) for bomb tiles
  - 32px bomb size matching web app's desktop experience

### Technical Changes
- Added `crypto-js` dependency for HMAC-SHA256 support
- Added `crypto-js` CDN integration for browser compatibility
- **Unified Algorithm**: Simplified to use only original HMAC-SHA256 system
  - `generateDeterministicRandom()` for consistent bomb position generation
  - Removed unnecessary dual-seed complexity after API fix
  - Matches API storage behavior exactly
- Simplified `generateDeathTiles()` to always use original algorithm
- Updated documentation to reflect unified algorithm approach
- Added debug logging confirming algorithm consistency with API storage
- Enhanced error handling in death tile generation with fallbacks
- Improved CSS styling with cleaner bomb container classes

## [Unreleased]

### Planned Features
- Batch verification for multiple games
- Export to multiple formats (PDF, CSV)
- Integration with Risk.fun API for direct game lookup
- Mobile application support
