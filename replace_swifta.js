const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          if (file.includes('node_modules') || file.includes('.next') || file.includes('dist') || file.includes('.git') || file.includes('build')) {
            next();
          } else {
            walk(file, (err, res) => {
              results = results.concat(res);
              next();
            });
          }
        } else {
          if (file.match(/\.(ts|tsx|md|yaml|yml|json|mjs)$/)) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
};

const dirs = [
  'c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/twizrr/apps/backend/src',
  'c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/twizrr/apps/web/src',
  'c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/twizrr/apps/backend/prisma',
  'c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/twizrr/packages'
];

let filesModified = 0;

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Order matters
  content = content.replace(/swifta\.store/g, 'twizrr.com');
  content = content.replace(/Swifta/g, 'twizrr');
  content = content.replace(/swifta/g, 'twizrr');
  content = content.replace(/SWIFTA/g, 'TWIZRR');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
  }
};

let remaining = dirs.length;
dirs.forEach(dir => {
  walk(dir, (err, results) => {
    if (err) throw err;
    results.forEach(replaceInFile);
    remaining--;
    if (remaining === 0) {
      
      const rootFiles = ['README.md', 'docker-compose.yml', 'render.yaml', 'apps/web/public/manifest.json', 'apps/web/next.config.mjs'];
      rootFiles.forEach(f => {
        const fullPath = 'c:/Users/HP/OneDrive/Desktop/startup/Team/Coded-devs/Building/twizrr/' + f;
        if (fs.existsSync(fullPath)) {
            replaceInFile(fullPath);
        }
      });
      console.log(`Modified ${filesModified} files in src and root.`);
    }
  });
});
