import type { Attributes, Context, Link, SpanKind } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  AlwaysOnSampler,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  ParentBasedSampler,
  SamplingDecision,
  SimpleSpanProcessor,
  type Sampler,
  type SamplingResult,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  ATTR_HTTP_ROUTE,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_URL_PATH,
} from '@opentelemetry/semantic-conventions';
import { config as loadEnvFile } from 'dotenv';
import { WideEventSpanProcessor } from 'nestjs-otel';

/** Route prefixes that get traced. Everything else produces no spans. */
export const TRACED_ROUTES = ['/wallet'];

export const isTraced = (path: string): boolean => {
  const [pathname] = path.split('?');

  return TRACED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
};

class TracedRouteSampler implements Sampler {
  public shouldSample(
    _context: Context,
    _traceId: string,
    _name: string,
    _kind: SpanKind,
    attributes: Attributes,
    _links: Link[],
  ): SamplingResult {
    const route = attributes[ATTR_HTTP_ROUTE] ?? attributes[ATTR_URL_PATH];

    return {
      decision:
        typeof route === 'string' && isTraced(route)
          ? SamplingDecision.RECORD_AND_SAMPLED
          : SamplingDecision.NOT_RECORD,
    };
  }

  public toString(): string {
    return 'TracedRouteSampler';
  }
}

let sdk: NodeSDK | null = null;

const spanProcessors = (
  exporter: string,
  endpoint: string,
): SpanProcessor[] => [
  new WideEventSpanProcessor(),
  ...(exporter === 'otlp' || exporter === 'both'
    ? [new BatchSpanProcessor(new OTLPTraceExporter({ url: endpoint }))]
    : []),
  ...(exporter === 'console' || exporter === 'both'
    ? [new SimpleSpanProcessor(new ConsoleSpanExporter())]
    : []),
];

export function startTelemetry(): void {
  const env = process.env.NODE_ENV ?? 'development';
  for (const path of [`env/.env.${env}.local`, `env/.env.${env}`, 'env/.env']) {
    loadEnvFile({ path, quiet: true });
  }

  if (process.env.OTEL_ENABLED === 'false') {
    return;
  }

  const base =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
  const promPort = Number(process.env.OTEL_PROMETHEUS_PORT ?? 9464);

  sdk = new NodeSDK({
    resource: defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.APP_NAME ?? 'telemetry-tracing',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
      }),
    ),
    sampler: new ParentBasedSampler({
      root:
        process.env.OTEL_TRACE_ALL === 'true'
          ? new AlwaysOnSampler()
          : new TracedRouteSampler(),
    }),
    spanProcessors: spanProcessors(
      process.env.OTEL_TRACES_EXPORTER ??
        (env === 'production' ? 'otlp' : 'console'),
      `${base.replace(/\/+$/, '')}/v1/traces`,
    ),
    metricReaders: promPort ? [new PrometheusExporter({ port: promPort })] : [],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req) => !isTraced(req.url ?? ''),
        requireParentforOutgoingSpans: true,
      }),
      new ExpressInstrumentation({
        ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      }),
      new NestInstrumentation(),
      new UndiciInstrumentation({ requireParentforSpans: true }),
    ],
  });

  sdk.start();
}

export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown();
  sdk = null;
}

startTelemetry();
