import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class JsonFileStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async load() {
    try {
      const contents = await readFile(this.filePath, "utf8");
      return JSON.parse(contents);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  async save(value) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    return value;
  }
}
