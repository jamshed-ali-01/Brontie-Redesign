const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/cafes/dashboard/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the problematic tailwind class
content = content.replace(/before:content-\['"']/g, '');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed Tailwind single quote issue!');
