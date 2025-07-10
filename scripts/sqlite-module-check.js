const fs = require('fs/promises');
const dotenv = require('dotenv');

dotenv.config();

checkSqlite = async () => {
  const json = await fs.readFile('package.json');
  const pkg = JSON.parse(json.toString('utf8'));
  if (pkg.dependencies['sqlite3'] && process.env.DB_TYPE !== 'sqlite') {
    delete pkg.dependencies['sqlite3'];
    await fs.writeFile('package.json', JSON.stringify(pkg));
  }
};

checkSqlite().catch(err => {
  console.error(err);
  process.exit(1);
});
