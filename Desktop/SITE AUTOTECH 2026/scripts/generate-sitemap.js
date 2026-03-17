/**
 * Génère un sitemap complet : pages statiques + toutes les pages de résultat (CSV).
 * Usage: node scripts/generate-sitemap.js
 * Produit: sitemap-index.xml, sitemap-static.xml, sitemap-results.xml (à la racine du projet)
 */

const fs = require('fs');
const path = require('path');

const BASE = 'https://autotech-tunisia.com';
const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'data', 'marques.csv');

const TYPE_MAPPING = {
    'VOITURE': 'cars',
    'Voiture': 'cars',
    'MOTO': 'motorcycles',
    'Moto': 'motorcycles',
    'JETSKI': 'jetski',
    'Jetski': 'jetski',
    'QUAD': 'quad',
    'Quad': 'quad',
    'CAMION': 'trucks',
    'Camion': 'trucks',
    'AGRICOLE & ENGIN': 'agricultural',
    'Agricole & Engin': 'agricultural',
    'agricole & engin': 'agricultural'
};

function slug(s) {
    if (s == null || typeof s !== 'string') return '';
    return String(s).toLowerCase().trim().replace(/[\s-]+/g, '-').replace(/^-+|-+$/g, '');
}

function versionSlug(s) {
    return slug(s).replace(/\//g, '-');
}

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function staticUrls() {
    return [
        { loc: BASE + '/', priority: '1.0', changefreq: 'weekly' },
        { loc: BASE + '/index.html', priority: '1.0', changefreq: 'weekly' },
        { loc: BASE + '/dyno.html', priority: '0.9', changefreq: 'monthly' },
        { loc: BASE + '/options-reprog.html', priority: '0.9', changefreq: 'monthly' },
        { loc: BASE + '/echapp.html', priority: '0.9', changefreq: 'monthly' },
        { loc: BASE + '/suppression-fap.html', priority: '0.8', changefreq: 'monthly' },
        { loc: BASE + '/suppression-adblue.html', priority: '0.8', changefreq: 'monthly' },
        { loc: BASE + '/suppression-egr.html', priority: '0.8', changefreq: 'monthly' },
        { loc: BASE + '/suppression-catalyseur.html', priority: '0.8', changefreq: 'monthly' },
        { loc: BASE + '/pop-bang.html', priority: '0.8', changefreq: 'monthly' },
        { loc: BASE + '/ensavoirplus.html', priority: '0.7', changefreq: 'monthly' },
        { loc: BASE + '/devenir-revendeur.html', priority: '0.7', changefreq: 'monthly' },
        { loc: BASE + '/thank-you.html', priority: '0.3', changefreq: 'yearly' }
    ];
}

function resultUrl(type, brand, model, version, engine) {
    const segs = ['reprogrammation', type, slug(brand), slug(model), versionSlug(version), slug(engine), 'stage1-stage2'].filter(Boolean);
    return BASE + '/' + segs.join('/');
}

function parseCsvLines(content) {
    const lines = content.split(/\r?\n/).filter(Boolean);
    return lines;
}

function collectResultUrls(csvContent) {
    const lines = parseCsvLines(csvContent);
    const seen = new Set();
    const urls = [];
    const today = '2026-03-10';

    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        if (columns.length < 5) continue;

        const brand = (columns[0] || '').trim();
        const model = (columns[1] || '').trim();
        const version = (columns[2] || '').trim();
        const engine = (columns[3] || '').trim();
        const typeRaw = (columns[columns.length - 1] || '').trim();
        const type = TYPE_MAPPING[typeRaw] || typeRaw.toLowerCase().replace(/\s+/g, '-');

        if (!type || !brand || !model || !version || !engine) continue;

        const url = resultUrl(type, brand, model, version, engine);
        if (seen.has(url)) continue;
        seen.add(url);
        urls.push({ loc: url, lastmod: today, priority: '0.8', changefreq: 'monthly' });
    }

    return urls;
}

function writeUrlset(filePath, urls) {
    const urlEntries = urls.map(u =>
        '  <url>\n' +
        '    <loc>' + escapeXml(u.loc) + '</loc>\n' +
        (u.lastmod ? '    <lastmod>' + escapeXml(u.lastmod) + '</lastmod>\n' : '') +
        (u.changefreq ? '    <changefreq>' + escapeXml(u.changefreq) + '</changefreq>\n' : '') +
        (u.priority ? '    <priority>' + escapeXml(u.priority) + '</priority>\n' : '') +
        '  </url>'
    ).join('\n');

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urlEntries + '\n</urlset>';
    fs.writeFileSync(filePath, xml, 'utf8');
}

function writeSitemapIndex(filePath, sitemapRefs) {
    const entries = sitemapRefs.map(loc =>
        '  <sitemap>\n    <loc>' + escapeXml(loc) + '</loc>\n  </sitemap>'
    ).join('\n');
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        entries + '\n</sitemapindex>';
    fs.writeFileSync(filePath, xml, 'utf8');
}

function main() {
    console.log('Lecture du CSV:', CSV_PATH);
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const resultUrls = collectResultUrls(csvContent);
    const static = staticUrls();

    console.log('Pages statiques:', static.length);
    console.log('Pages résultat (uniques):', resultUrls.length);

    const staticPath = path.join(ROOT, 'sitemap-static.xml');
    const resultsPath = path.join(ROOT, 'sitemap-results.xml');
    const indexPath = path.join(ROOT, 'sitemap-index.xml');

    const staticWithMeta = static.map(u => ({ ...u, lastmod: '2026-03-10', changefreq: u.changefreq || 'monthly' }));
    writeUrlset(staticPath, staticWithMeta);
    writeUrlset(resultsPath, resultUrls);
    writeSitemapIndex(indexPath, [
        BASE + '/sitemap-static.xml',
        BASE + '/sitemap-results.xml'
    ]);

    console.log('Écrit: sitemap-static.xml, sitemap-results.xml, sitemap-index.xml');
}

main();
