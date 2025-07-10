const fs = require('fs/promises');
const isNative = require('is-native-module');

const items = [];
const scan = dir =>
  Promise.all([
    (async () => {
      let files;
      try {
        files = await fs.readdir(dir);
      } catch (_) {
        return;
      }
      await Promise.all(files.filter(f => !/^\./.test(f)).map(f => scan(`${dir}/${f}`)));
    })(),
    (async () => {
      let pkg;
      try {
        const json = await fs.readFile(`${dir}/package.json`);
        pkg = JSON.parse(json.toString('utf8'));
      } catch (_) {
        return;
      }
      if (isNative(pkg)) {
        const path = dir.replace('node_modules/', '').replace(/\/?node_modules\//g, ' -> ');
        items.push(path);
      }
    })(),
  ]);

const addDependency = async items => {
  const json = await fs.readFile('package.json');
  const pkg = JSON.parse(json.toString('utf8'));

  const nonNativePkg = { ...pkg, dependencies: { ...pkg.dependencies } };
  items.forEach(module => {
    if (nonNativePkg.dependencies[module]) {
      delete nonNativePkg.dependencies[module];
    }
  });
  await fs.writeFile('package_native.json', JSON.stringify(pkg));
  await fs.writeFile('package_non_native.json', JSON.stringify(nonNativePkg));
};

scan('node_modules')
  .then(() => {
    addDependency(items);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
