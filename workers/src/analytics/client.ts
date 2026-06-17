import type { RawGraphQLResponse } from "../types";
import type { Env } from "../types";

const CF_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

/**
 * 调用 Cloudflare GraphQL API。
 */
export async function callCF(
  query: string,
  env: Env
): Promise<RawGraphQLResponse> {
  const resp = await fetch(CF_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const json: RawGraphQLResponse = await resp.json();

  if (!resp.ok) {
    throw new Error(
      `Cloudflare HTTP ${resp.status}: ${JSON.stringify(json)}`
    );
  }
  if (json.errors) {
    throw new Error(
      `Cloudflare GraphQL error: ${JSON.stringify(json.errors)}`
    );
  }

  return json;
}
