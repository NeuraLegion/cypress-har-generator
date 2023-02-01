import type { HarExporter } from './HarExporter';

export interface HarExporterOptions {
  rootDir: string;
  predicatePath?: string;
  transformPath?: string;
}

export interface HarExporterFactory {
  create(options: HarExporterOptions): Promise<HarExporter>;
}
