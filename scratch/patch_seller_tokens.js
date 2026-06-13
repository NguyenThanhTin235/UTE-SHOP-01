const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/seller/SellerSettings.jsx',
  'frontend/src/components/seller/SellerProducts.jsx',
  'frontend/src/components/seller/SellerOrders.jsx',
  'frontend/src/components/seller/SellerOrderDetail.jsx',
  'frontend/src/components/seller/SellerDashboardOverview.jsx',
  'frontend/src/components/seller/SellerCancellations.jsx',
  'frontend/src/components/seller/SellerAnalytics.jsx',
  'frontend/src/components/seller/SellerAddProduct.jsx',
];

const projectRoot = path.join(__dirname, '..');

files.forEach(relPath => {
  const filePath = path.join(projectRoot, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  const directPattern = /sessionStorage\.getItem\('token'\)/g;
  const replacement = "(localStorage.getItem('token') || sessionStorage.getItem('token') || '')";
  
  if (directPattern.test(content)) {
    content = content.replace(directPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched: ${relPath}`);
  } else {
    console.log(`No token patterns found in: ${relPath}`);
  }
});
