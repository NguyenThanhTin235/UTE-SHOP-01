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
      .replace(/"shipped"/g, '"shipping"')
      .replace(/"delivered"/g, '"completed"')
      .replace(/'Shipped'/g, "'Shipping'")
      .replace(/'Delivered'/g, "'Completed'")
      .replace(/>Shipped</g, ">Shipping<")
      .replace(/>Delivered</g, ">Completed<")
      .replace(/mark as delivered/gi, "mark as completed")
      .replace(/mark delivered/gi, "mark completed");

    // OrderHistory specific replacements for labels
    newContent = newContent
      .replace(/label: 'Shipped'/g, "label: 'Shipping'")
      .replace(/label: 'Delivered'/g, "label: 'Completed'");

    // Add 'preparing' into valid filters or lists where 'shipping' is mentioned next to 'confirmed'
    newContent = newContent
      .replace(/\['all', 'shipping', 'completed', 'failed'\]/g, "['all', 'preparing', 'shipping', 'completed', 'failed']")
      .replace(/\['pending', 'confirmed', 'shipping'\]/g, "['pending', 'confirmed', 'preparing', 'shipping']");

    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      console.log('Updated: ' + file);
      updatedCount++;
    }
  });
  console.log(`Updated ${updatedCount} files in ${directory}`);
};

updateFiles('./src');
