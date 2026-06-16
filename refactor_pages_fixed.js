const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');
const pagesDir = path.join(srcDir, 'pages');
const customerDir = path.join(pagesDir, 'customer');

// Ensure customer directory exists
if (!fs.existsSync(customerDir)) {
  fs.mkdirSync(customerDir, { recursive: true });
}

// Role mapping for specific files
const roleFiles = {
  'AdminDashboard.jsx': 'admin',
  'SellerDashboard.jsx': 'seller',
  'ManagerDashboard.jsx': 'manager',
  'ManagerShopDetail.jsx': 'manager',
  'ShipperDashboard.jsx': 'shipper',
};

// Get all files in pages directory
const allItems = fs.readdirSync(pagesDir, { withFileTypes: true });
const files = allItems.filter(item => item.isFile() && item.name.endsWith('.jsx')).map(item => item.name);

// Arrays to keep track of moved files
const customerFiles = [];
const movedRoleFiles = [];

// 1. Move files
for (const file of files) {
  const oldPath = path.join(pagesDir, file);
  
  if (roleFiles[file]) {
    const roleDir = path.join(pagesDir, roleFiles[file]);
    if (!fs.existsSync(roleDir)) fs.mkdirSync(roleDir, { recursive: true });
    
    const newPath = path.join(roleDir, file);
    fs.renameSync(oldPath, newPath);
    movedRoleFiles.push({ file, role: roleFiles[file], newPath });
  } else {
    const newPath = path.join(customerDir, file);
    fs.renameSync(oldPath, newPath);
    customerFiles.push(file);
  }
}

console.log(`Moved ${customerFiles.length} files to customer/`);
console.log(`Moved ${movedRoleFiles.length} files to role directories.`);

// 2. Update App.jsx imports
const appJsxPath = path.join(srcDir, 'App.jsx');
let appJsxContent = fs.readFileSync(appJsxPath, 'utf8');

for (const file of customerFiles) {
  const baseName = file.replace('.jsx', '');
  const regex = new RegExp(`from\\s+['"\`]\\.\\/pages\\/${baseName}['"\`];`, 'g');
  appJsxContent = appJsxContent.replace(regex, `from './pages/customer/${baseName}';`);
}
for (const item of movedRoleFiles) {
  const baseName = item.file.replace('.jsx', '');
  const regex = new RegExp(`from\\s+['"\`]\\.\\/pages\\/${baseName}['"\`];`, 'g');
  appJsxContent = appJsxContent.replace(regex, `from './pages/${item.role}/${baseName}';`);
}
fs.writeFileSync(appJsxPath, appJsxContent);
console.log('App.jsx imports updated.');

// 3. Update internal imports in moved files
function updateImports(filePath, isRoleDashboard, roleName) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all '../' with '../../' correctly capturing the import statement
  const importExportRegex = /((?:import|export)[^'"]+['"])(\.\.[^'"]+)(['"])/g;
  
  content = content.replace(importExportRegex, (match, p1, p2, p3) => {
    if (p2.startsWith('../')) {
        return `${p1}../${p2}${p3}`;
    }
    return match;
  });
  
  if (isRoleDashboard) {
    const roleRegex = new RegExp(`from\\s+['"\`]\\.\\/${roleName}\\/([^'"\`]+)['"\`]`, 'g');
    content = content.replace(roleRegex, `from './$1'`);
  }

  fs.writeFileSync(filePath, content);
}

for (const file of customerFiles) {
  updateImports(path.join(customerDir, file), false, null);
}

for (const item of movedRoleFiles) {
  updateImports(item.newPath, true, item.role);
}

console.log('Internal imports updated successfully!');
