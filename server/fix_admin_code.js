const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const target1 = "const today = new Date().toISOString().split('T')[0];";
const replacement1 = "const today = new Date().toLocaleDateString('sv');";

const target2 = "const todayData = wastageData.filter(w => w.date.startsWith(today));";
const replacement2 = "const todayData = wastageData.filter(w => w.date && w.date.toString().startsWith(today));";

if (content.includes(target1) || content.includes(target2)) {
    content = content.replace(target1, replacement1);
    content = content.replace(target2, replacement2);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated AdminDashboard.jsx');
} else {
    console.log('Targets not found');
}
