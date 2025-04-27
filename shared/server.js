import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '/web/dist/', 'index.html'));
})
  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
