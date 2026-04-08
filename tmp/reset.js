const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/cafes/dashboard/page.tsx');
let lines = fs.readFileSync(filePath, 'utf-8');

// The file was corrupted with literal "\n" inside single lines because array returned from splice had actual "\n" strings in it
// Let me read the original from git again and apply lines properly.
