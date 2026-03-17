/**
 * Serveur de dev avec fallback SPA pour les URLs /reprogrammation/...
 * Lance avec : node server.js
 * Puis ouvre http://127.0.0.1:3000 (pas 5500 pour éviter le conflit avec Live Server)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

function getMimeType(ext) {
    const types = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.csv': 'text/csv'
    };
    return types[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    let urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;

    // Fallback SPA : tout chemin /reprogrammation/... renvoie index.html
    if (urlPath.indexOf('/reprogrammation/') === 0) {
        const indexPath = path.join(ROOT, 'index.html');
        fs.readFile(indexPath, (err, data) => {
            if (err) {
                console.error('Erreur lecture index.html:', err.message);
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Erreur serveur: impossible de lire index.html');
                return;
            }
            console.log('SPA fallback -> index.html pour', urlPath.substring(0, 60) + '...');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    const filePath = path.join(ROOT, urlPath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Server Error');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': getMimeType(ext) });
        res.end(data);
    });
});

function start(port) {
    server.listen(port, '127.0.0.1', () => {
        console.log('');
        console.log('  Serveur dev :  http://127.0.0.1:' + port);
        console.log('  Les URLs /reprogrammation/... fonctionnent (fallback SPA).');
        console.log('');
        console.log('  Important : utilisez cette adresse (port ' + port + '), pas Live Server.');
        console.log('');
    });
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log('Port ' + PORT + ' occupé, tentative sur 3001...');
        start(3001);
    } else {
        console.error('Erreur serveur:', err);
    }
});

start(PORT);
