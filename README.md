# Cloudflare Worker Alert Webhook

Cloudflare worker to send alerts to Discord or Slack when your Cloudflare worker script errors exceed a threshold.

## 🚀 Get started

1. Clone this repository and run `pnpm install` to install dependencies inside the worker directory.

1. Setup secrets in your Cloudflare account. You can do this directly from the dashboard or use wrangler. See [wrangler docs](https://developers.cloudflare.com/workers/wrangler/commands/#secret) for more information.

```sh
CLOUDFLARE_TOKEN # Your Clouldflare API token. You need to enable read scope for Analytics. Do not give this token write scope.
CLOUDFLARE_ACCOUNT_TAG # Your Cloudflare account tag.
CLOUDFLARE_SCRIPT_NAME # Your worker script name.
CLOUDFLARE_SCRIPT_ENVIRONMENT # Defaults to `production`.
CLOUDFLARE_ERROR_THRESHOLD # How many errors to allow before sending an alert. Defaults to 1.
METRICS_PERIOD_IN_HOURS # What period of time to look at for error metrics. Defaults to 1 hour.
WEBHOOK_URL # Discord or Slack webhook URL. For discord, append `/slack` to the generated webhook URL.
```

Run `wrangler secrets put CLOUDFLARE_TOKEN` and follow the prompts to add your secrets. You need to do this for each secret.

1. Run `wrangler publish` to deploy the worker.

# 📝 License

The project is licensed under MIT.
