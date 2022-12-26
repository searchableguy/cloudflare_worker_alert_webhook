export const CLOUDFLARE_WORKER_METRICS_QUERY = `
query getMetricsOverviewQuery($accountTag: string! $filter: ZoneWorkersRequestsFilter_InputObject!) {
	viewer {
	  accounts(filter: {accountTag: $accountTag}) {
		workersInvocationsAdaptive(limit: 10000, filter: $filter) {
		  sum {
			requests
			subrequests
			errors
		  }
		}
	  }
	}
  }  
`;

export interface CloudflareWorkerMetricsQuery {
  data?: Data;
  errors?: Error[];
}

export interface Data {
  viewer?: Viewer;
}

export interface Viewer {
  accounts?: Account[];
}

export interface Account {
  workersInvocationsAdaptive?: WorkersInvocationsAdaptive[];
}

export interface WorkersInvocationsAdaptive {
  sum?: Sum;
}

export interface Sum {
  errors: number;
  requests: number;
  subrequests: number;
}

export interface Error {
  message: string;
  path: null;
  extensions: Extensions;
}

export interface Extensions {
  timestamp: Date;
}

export const CLOUDFLARE_API_ENDPOINT =
  "https://api.cloudflare.com/client/v4/graphql";
