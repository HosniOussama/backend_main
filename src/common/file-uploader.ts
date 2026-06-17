import * as fs from 'fs';
import { Multer } from 'multer';

export async function handleFileUpload(
  file: Multer.File,
  folder: string,
): Promise<string> {
  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const uploadDir = `uploads/${folder}`;
    const filePath = `${uploadDir}/${fileName}`;
    // Ensure directory exists
    try {
      await fs.promises.access(uploadDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.promises.mkdir(uploadDir, { recursive: true });
    }
    // Create or overwrite file
    await fs.promises.writeFile(filePath, file.buffer, { flag: 'w' });
    // Return the URL/path that will be stored in the database
    return filePath;
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
}
