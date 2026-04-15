
const fs = require('fs');

function checkJSXBalance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stack = [];
  const regex = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
  let match;

  console.log(`Auditing file: ${filePath}`);

  while ((match = regex.exec(content)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const isSelfClosing = match[4] === '/';
    const line = content.substring(0, match.index).split('\n').length;

    // Solo nos interesan etiquetas div por ahora para simplificar
    if (tagName.toLowerCase() !== 'div') continue;

    if (isSelfClosing) {
      console.log(`Line ${line}: Self-closing <${tagName} />`);
    } else if (isClosing) {
      if (stack.length === 0) {
        console.log(`Line ${line}: ERROR - Unexpected closing </${tagName}>`);
      } else {
        const openedAtLine = stack.pop();
        console.log(`Line ${line}: Closed </${tagName}> (opened at line ${openedAtLine})`);
      }
    } else {
      stack.push(line);
      console.log(`Line ${line}: Opened <${tagName}>`);
    }
  }

  if (stack.length > 0) {
    console.log(`ERROR: The following tags are unclosed (lines: ${stack.join(', ')})`);
  } else {
    console.log('SUCCESS: All div tags are balanced!');
  }
}

checkJSXBalance('src/components/attendance/AttendanceModal.tsx');
