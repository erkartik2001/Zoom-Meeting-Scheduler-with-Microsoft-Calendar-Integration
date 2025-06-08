import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const tokenFilePath = path.resolve(process.cwd(), 'src/app/data/token.json');

export async function saveToken(service, tokenData) {
  try {
    let existingData = {};
    try {
      const file = await readFile(tokenFilePath, 'utf-8');
      existingData = JSON.parse(file);
    } catch (_) {
      existingData = {};
    }

    existingData[service] = tokenData;

    await writeFile(tokenFilePath, JSON.stringify(existingData, null, 2), 'utf-8');
    console.log(`[Token Saved] ${service}`);
  } catch (err) {
    console.error('Error saving token:', err);
  }
}

export async function getToken(service) {
  try {
    const file = await readFile(tokenFilePath, 'utf-8');
    const data = JSON.parse(file);
    return data[service];
  } catch (err) {
    console.error('Error reading token:', err);
    return null;
  }
}
