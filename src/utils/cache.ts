import fs from 'fs';
import path from 'path';

export function getCachedKeys(filename: string): Promise<Record<string, any>> {
  const error = new Error('Failed to load cached public keys');
  return new Promise((resolve, reject) => {
    const filesPath = path.join(process.cwd(), '_files');
    console.log(filesPath);
    fs.readdir(filesPath, (_, files) => {
      files.forEach((file) => {
        console.log(file);
      });
    });
    fs.readFile(path.join(process.cwd(), '_files', filename), (err, data) => {
      if (err) {
        reject(error);
      }
      try {
        const keyData = JSON.parse(data.toString());
        resolve(keyData);
      } catch (e) {
        reject(error);
      }
    });
  });
}

export function updateCachedKeys(
  filename: string,
  data: Record<string, any>
): Promise<void> {
  const error = new Error('Failed to update public key cache');
  return new Promise((resolve, reject) => {
    try {
      const jsonData = JSON.stringify(data);
      fs.writeFile(
        path.join(process.cwd(), '_files', filename),
        jsonData,
        (err) => {
          if (err) {
            reject(error);
          }
          resolve(undefined);
        }
      );
    } catch (err) {
      reject(error);
    }
  });
}
