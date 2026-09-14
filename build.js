const fs = require('fs');
const path = require('path');
const directoryPath = path.resolve('./dist');
const files = fs.readdirSync(directoryPath);
files.forEach(file => {
    const filePath = path.join(directoryPath, file);
    if (!fs.statSync(filePath).isDirectory() && file.endsWith('.json'))
        fs.writeFileSync(filePath, JSON.stringify(JSON.parse(fs.readFileSync(filePath, 'utf-8'))));
});