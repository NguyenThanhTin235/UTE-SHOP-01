const fs = require('fs');
const path = require('path');

const walk = dir => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const updateFiles = (directory) => {
  const files = walk(directory);
  let updatedCount = 0;
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content
      .replace(/'shipped'/g, "'shipping'")
      .replace(/'delivered'/g, "'completed'")
      // For Frontend Redux/State cases where statuses might be without quotes if it's dynamic, but let's stick to quotes to be safe.
      .replace(/=== 'shipped'/g, "=== 'shipping'")
      .replace(/=== 'delivered'/g, "=== 'completed'");
    
    // Check if there are other occurrences like "shipped" in validStatuses array etc
    newContent = newContent
      .replace(/\[\s*'confirmed',\s*'shipped',\s*'delivered'/g, "['confirmed', 'preparing', 'shipping', 'completed'")
      .replace(/\[\s*'pending',\s*'confirmed',\s*'shipped',\s*'delivered'/g, "['pending', 'confirmed', 'preparing', 'shipping', 'completed'");
      
    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      console.log('Updated: ' + file);
      updatedCount++;
    }
  });
  console.log(`Updated ${updatedCount} files in ${directory}`);
};

updateFiles('./src');
