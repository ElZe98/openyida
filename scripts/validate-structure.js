const fs = require('fs');
const path = require('path');

const requiredDirs = ['bin', 'lib', 'project', 'yida-skills', 'scripts'];
const requiredFiles = [
  'bin/yida.js',
  'package.json',
  'project/config.json',
  'README.md',
  'LICENSE',
  'CONTRIBUTING.md',
  '.eslintrc.json',
];

let hasError = false;

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error('Missing directory: ' + dir);
    hasError = true;
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error('Missing file: ' + file);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}

// Validate package.json engines field
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const nodeEngine = packageJson.engines && packageJson.engines.node;
if (!nodeEngine) {
  console.error('package.json missing engines.node field');
  process.exit(1);
}
console.log('engines.node: ' + nodeEngine);

const skillsDir = 'yida-skills/skills';
if (fs.existsSync(skillsDir)) {
  const skills = fs.readdirSync(skillsDir).filter(function(name) {
    return fs.statSync(path.join(skillsDir, name)).isDirectory();
  });
  console.log('yida-skills sub-skills: ' + skills.length);
}

const libFiles = fs.readdirSync('lib').filter(function(f) {
  return f.endsWith('.js');
});
console.log('lib/ modules: ' + libFiles.length);
console.log('Project structure OK');
