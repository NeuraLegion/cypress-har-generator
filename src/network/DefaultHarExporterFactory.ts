import type {
  HarExporterFactory,
  HarExporterOptions
} from './HarExporterFactory';
import type { HarExporter } from './HarExporter';
import { DefaultHarExporter } from './DefaultHarExporter';
import { Loader } from '../utils/Loader';
import { FileManager } from '../utils/FileManager';
import type { Entry } from 'har-format';
import { resolve } from 'path';

export class DefaultHarExporterFactory implements HarExporterFactory {
  constructor(private readonly fileManager: FileManager) {}

  public async create({
    rootDir,
    predicatePath
  }: HarExporterOptions): Promise<HarExporter> {
    let predicate: ((request: Entry) => unknown) | undefined;

    if (predicatePath) {
      const absolutePath = resolve(rootDir, predicatePath);
      predicate = Loader.load(absolutePath);
    }

    return new DefaultHarExporter(
      await this.fileManager.createTmpWriteStream(),
      predicate
    );
  }
}
