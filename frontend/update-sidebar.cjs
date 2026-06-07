const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const filesToUpdate = [
  'Wishlist.jsx',
  'SecuritySettings.jsx',
  'Reviews.jsx',
  'RecentlyViewed.jsx',
  'OrderHistory.jsx',
  'OrderDetail.jsx',
  'Coins.jsx',
  'CancelOrder.jsx',
  'AddressBook.jsx'
];

const linkToInsert = `
            <Link to="/user/statistics" className="flex items-center px-4 py-3 space-x-3 text-[#434655] hover:bg-[#f7f9ff] hover:text-[#004ac6] transition-all font-medium rounded-xl">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              <span>Thống kê</span>
            </Link>`;

filesToUpdate.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it already has the link
    if (!content.includes('to="/user/statistics"')) {
      // Find the My Coins link block to insert after it
      // The My Coins block usually ends with <span>My Coins</span>\n            </Link>
      const myCoinsRegex = /(<Link to="\/coins"[\s\S]*?<span>My Coins<\/span>\s*<\/Link>)/;
      
      if (myCoinsRegex.test(content)) {
        content = content.replace(myCoinsRegex, `$1${linkToInsert}`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
      } else {
        console.log(`Could not find My Coins link in ${file}`);
      }
    } else {
      console.log(`Already updated ${file}`);
    }
  }
});
