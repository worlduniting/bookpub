import http from 'http';
import fs from 'fs';
import path from 'path';

// Define __dirname for ES module - so we can use it like CommonJS
const __dirname = "/Users/revdavethompson/Projects/bookshop"
console.log(__dirname)

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'build', 'html', req.url);
    const extname = path.extname(filePath);
    const contentType = getContentType(extname);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404);
                res.end('File not found');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server error: ${err.code}`);
            }
        } else {
            // Successful response
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(3000, () => {
    console.log('Server started on port 3000');
});

function getContentType(extname) {
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
        default:
            return 'text/plain';
    }
}
