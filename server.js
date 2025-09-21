#!/usr/bin/env node

/**
 * Simple HTTP server for Risk.fun Hash Verifier
 * Serves static files with proper MIME types and CORS headers
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Serve static file
 */
function serveFile(filePath, res) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - Not Found</title>
                        <style>
                            body { font-family: monospace; background: #0d110e; color: white; padding: 40px; text-align: center; }
                            .error { background: #2a1a1a; border-left: 4px solid #fd5050; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px; }
                        </style>
                    </head>
                    <body>
                        <div class="error">
                            <h1>404 - File Not Found</h1>
                            <p>The requested file <code>${filePath}</code> was not found.</p>
                            <p><a href="/" style="color: #58ef50;">← Back to Hash Verifier</a></p>
                        </div>
                    </body>
                    </html>
                `);
                res.end();
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.write('500 - Internal Server Error');
                res.end();
            }
            return;
        }

        // Set headers
        const mimeType = getMimeType(filePath);
        res.writeHead(200, {
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.write(content);
        res.end();
    });
}

/**
 * Main server handler
 */
const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Parse URL
    let filePath = req.url;
    
    // Handle root path
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Remove query parameters
    filePath = filePath.split('?')[0];
    
    // Security: prevent directory traversal
    filePath = path.normalize(filePath);
    if (filePath.includes('..')) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write('400 - Bad Request');
        res.end();
        return;
    }
    
    // Build full file path
    const fullPath = path.join(__dirname, filePath);
    
    // Serve the file
    serveFile(fullPath, res);
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`🚀 Risk.fun Hash Verifier Server running at http://${HOST}:${PORT}/`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  • Main Verifier: http://${HOST}:${PORT}/`);
    console.log(`  • Debug Tool: http://${HOST}:${PORT}/debug-advanced.html`);
    console.log(`  • SHA3 Test: http://${HOST}:${PORT}/test-sha3.html`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
