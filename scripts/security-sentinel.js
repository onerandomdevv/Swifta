const fs = require('fs');
const path = require('path');

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const RULES = [
  {
    name: 'Money Integrity (BigInt/Kobo)',
    description: 'Ensure @IsInt is used instead of @IsNumber for pricing and kobo fields.',
    pattern: /@IsNumber\(\)\s*\r?\n\s*(?:@.*\s*)*(\w*(?:Price|Amount|Kobo|Fee)\w*):/gi,
    message: (match, field) => `Field "${field}" uses @IsNumber. Use @IsInt to avoid floating-point errors for money.`,
    severity: 'error',
  },
  {
    name: 'Auth Guard Enforcement',
    description: 'Ensure new Controllers use @UseGuards(JwtAuthGuard).',
    pattern: /@Controller\(['"]?\w+['"]?\)\s*\r?\n\s*(?!class [\w\d_]+Controller[\s\n\r]*{[\s\n\r]*(?:@[\w\d_]+\([\w\d_]*\)[\s\n\r]*)*@UseGuards\(JwtAuthGuard\))class\s+(\w+Controller)/gi,
    message: (match, controller) => `Controller "${controller}" is missing @UseGuards(JwtAuthGuard).`,
    severity: 'warning', // Warning because some might be public by design
  },
  {
    name: 'Hardcoded Secret Detection',
    description: 'Detect potential hardcoded secrets in code.',
    pattern: /(?:const|let|var)\s+[\w\d_]*(?:secret|token|password|key)\s*=\s*['"]((?!lock:|twizrr-|config:|http:|https:|hwos-)[^'"]{20,})['"]/gi,
    message: (match, val) => `Potential hardcoded secret found: "${val.substring(0, 5)}..."`,
    severity: 'error',
  },
  {
    name: 'User Rule: No console.log',
    description: 'Ensure pino/NestJS logger is used instead of console.log.',
    pattern: /console\.log\(/g,
    message: () => `Usage of console.log is forbidden. Use this.logger instead.`,
    severity: 'error',
  }
];

async function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  let errors = 0;
  let warnings = 0;

  RULES.forEach(rule => {
    let match;
    while ((match = rule.pattern.exec(content)) !== null) {
      const line = content.substring(0, match.index).split('\n').length;
      const color = rule.severity === 'error' ? COLORS.red : COLORS.yellow;
      const prefix = rule.severity.toUpperCase();
      
      console.log(`${color}[${prefix}]${COLORS.reset} ${COLORS.cyan}${relativePath}:${line}${COLORS.reset} - ${rule.name}`);
      console.log(`      ${rule.message(match[0], match[1])}\n`);
      
      if (rule.severity === 'error') errors++;
      else warnings++;
    }
    // Reset regex state for global patterns
    rule.pattern.lastIndex = 0;
  });

  return { errors, warnings };
}

function getFiles(targetPath, files = []) {
  const stats = fs.statSync(targetPath);
  if (stats.isFile()) {
    if (/\.(ts|tsx|js|jsx)$/.test(targetPath)) {
      files.push(targetPath);
    }
    return files;
  }

  const items = fs.readdirSync(targetPath);
  for (const item of items) {
    if (['node_modules', 'dist', '.git', '.turbo', 'coverage', 'scripts', '.next', 'test', 'tests'].includes(item)) continue;
    if (item === 'seed.ts' || item === 'security-test.ts') continue;
    const fullPath = path.join(targetPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (/\.(ts|tsx|js|jsx)$/.test(item)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function run() {
  console.log(`${COLORS.yellow}--- Twizrr Security Sentinel ---${COLORS.reset}\n`);
  
  const targetDir = process.argv[2] || '.';
  const files = getFiles(targetDir);
  
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const { errors, warnings } = await scanFile(file);
    totalErrors += errors;
    totalWarnings += warnings;
  }

  console.log(`${COLORS.cyan}Scan complete. Found ${totalErrors} errors, ${totalWarnings} warnings.${COLORS.reset}`);
  
  if (totalErrors > 0) {
    console.log(`${COLORS.red}Critical security or rule violations found. Commit blocked.${COLORS.reset}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
