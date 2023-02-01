import type {
  HarExporterFactory,
  HarExporterOptions
} from './HarExporterFactory';
import type { HarExporter } from './HarExporter';
import { DefaultHarExporter } from './DefaultHarExporter';
import { Loader } from '../utils/Loader';
import type { FileManager } from '../utils/FileManager';
import type { Logger } from '../utils/Logger';
import type {
  DefaultHarExporterOptions,
  Predicate,
  Transformer
} from './DefaultHarExporterOptions';
import { resolve } from 'path';

export class DefaultHarExporterFactory implements HarExporterFactory {
  constructor(
    private readonly fileManager: FileManager,
    private readonly logger: Logger
  ) {}

  public async create(options: HarExporterOptions): Promise<HarExporter> {
    const settings = await this.createSettings(options);
    const stream = await this.fileManager.createTmpWriteStream();

    return new DefaultHarExporter(this.logger, stream, settings);
  }

  private async createSettings({
    predicatePath,
    transformPath,
    rootDir
  }: HarExporterOptions) {
    const [predicate, transform]: (Predicate | Transformer | undefined)[] =
      await Promise.all(
        [predicatePath, transformPath].map(path =>
          this.loadCustomProcessor(path, rootDir)
        )
      );

    return { predicate, transform } as DefaultHarExporterOptions;
  }

  private async loadCustomProcessor<T extends Predicate | Transformer>(
    path: string | undefined,
    rootDir: string
  ): Promise<T | undefined> {
    let processor: T | undefined;

    if (path) {
      const absolutePath = resolve(rootDir, path);
      processor = await Loader.load(absolutePath);
    }

    return processor;
  }
}
