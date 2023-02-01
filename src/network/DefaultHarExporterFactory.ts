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
  Filter,
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
    filter,
    transform,
    rootDir
  }: HarExporterOptions) {
    const [preProcessor, postProcessor]: (Filter | Transformer | undefined)[] =
      await Promise.all(
        [filter, transform].map(path => this.loadCustomProcessor(path, rootDir))
      );

    return {
      filter: preProcessor,
      transform: postProcessor
    } as DefaultHarExporterOptions;
  }

  private async loadCustomProcessor<T extends Filter | Transformer>(
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
