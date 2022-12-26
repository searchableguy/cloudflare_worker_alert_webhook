/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

import {
  CLOUDFLARE_API_ENDPOINT,
  CLOUDFLARE_WORKER_METRICS_QUERY,
  CloudflareWorkerMetricsQuery,
} from "./graphql";
import dayjs from "dayjs";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  CLOUDFLARE_TOKEN: string;
  CLOUDFLARE_ACCOUNT_TAG: string;
  CLOUDFLARE_SCRIPT_NAME: string;
  CLOUDFLARE_SCRIPT_ENVIRONMENT: string;
  CLOUDFLARE_ERROR_THRESHOLD: string;
  METRICS_PERIOD_IN_HOURS: string;
  WEBHOOK_URL: string;
}

const sendWebhook = async (env: Env, message: string) => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  const response = await fetch(env.WEBHOOK_URL, {
    headers,
    method: "POST",
    body: JSON.stringify({
      text: message,
    }),
  });
  return response;
};

export default {
  async fetch() {
    return new Response(
      "This is a scheduled worker to notify when workers requests error percentage is above configured threshold via webhook."
    );
  },
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const errorThreshold = parseFloat(env.CLOUDFLARE_ERROR_THRESHOLD);
    const headers = new Headers();
    const endTime = dayjs();
    const startTime = endTime.subtract(
      parseFloat(env.METRICS_PERIOD_IN_HOURS || "1"),
      "hours"
    );

    headers.append("Authorization", `Bearer ${env.CLOUDFLARE_TOKEN}`);
    headers.append("Content-Type", "application/json");
    const response = await fetch(CLOUDFLARE_API_ENDPOINT, {
      headers,
      method: "POST",
      body: JSON.stringify({
        query: CLOUDFLARE_WORKER_METRICS_QUERY,
        variables: {
          accountTag: env.CLOUDFLARE_ACCOUNT_TAG,
          filter: {
            AND: [
              {
                datetimeHour_leq: endTime.toISOString(),
                datetimeHour_geq: startTime.toISOString(),
                scriptName: env.CLOUDFLARE_SCRIPT_NAME,
                environmentName:
                  env.CLOUDFLARE_SCRIPT_ENVIRONMENT || "production",
              },
            ],
          },
        },
      }),
    });
    const result: CloudflareWorkerMetricsQuery = await response.json();
    const { errors, data } = result;
    if (errors?.length) {
      console.error(errors);
      return;
    }

    const sum =
      data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive?.[0]?.sum;

    if (!sum) {
      console.info(
        `No data found for ${env.CLOUDFLARE_SCRIPT_NAME} within the last hour.`
      );
      return;
    }
    const { requests, errors: errorCount } = sum;
    const currentErrorThreshold = (errorCount / requests) * 100;

    if (currentErrorThreshold < errorThreshold) {
      return;
    }

    await sendWebhook(
      env,
      `Error threshold of **${errorThreshold}%** exceeded  for ${env.CLOUDFLARE_SCRIPT_NAME} worker. Current error threshold is **${currentErrorThreshold}%**.`
    );
  },
};
