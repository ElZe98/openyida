const fs = require('fs');
const path = require('path');

const requiredDirs = ['bin', 'lib', 'project', 'yida-skills', 'scripts'];
const requiredFiles = ['bin/yida.js', 'package.json', 'project/config.json'];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.error('Missing directory: ' + dir);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error('Missing file: ' + file);
    process.exit(1);
  }
}

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
