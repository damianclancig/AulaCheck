
const fs = require('fs');

function checkJSXBalance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stack = [];
  // Regex corregido para capturar etiquetas con Propiedades complejas (incluyendo llaves)
  const regex = /<(\/?)([a-zA-Z0-9]+)(\s+[^>]*?)?(\/?)>/g;
  let match;

  console.log(`Auditing ALL tags in: ${filePath}`);

  while ((match = regex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const isSelfClosing = match[4] === '/';
    const line = content.substring(0, match.index).split('\n').length;

    if (isSelfClosing) {
      // console.log(`Line ${line}: Self-closing <${tagName} />`);
    } else if (isClosing) {
      if (stack.length === 0) {
        console.log(`Line ${line}: ERROR - Unexpected closing tag </${tagName}>`);
      } else {
        const last = stack.pop();
        if (last.name !== tagName) {
          console.log(`Line ${line}: ERROR - Mismatched tag: expected </${last.name}> (opened at line ${last.line}), found </${tagName}>`);
        } else {
          // console.log(`Line ${line}: Closed </${tagName}> (opened at line ${last.line})`);
        }
      }
    } else {
      stack.push({ name: tagName, line: line });
      // console.log(`Line ${line}: Opened <${tagName}>`);
    }
  }

  if (stack.length > 0) {
    console.log(`ERROR: The following tags are unclosed:`);
    stack.forEach(tag => console.log(`  <${tag.name}> at line ${tag.line}`));
  } else {
    console.log('SUCCESS: All tags are balanced!');
  }
}

checkJSXBalance('src/components/attendance/AttendanceModal.tsx');
