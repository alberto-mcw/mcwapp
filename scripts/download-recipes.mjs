#!/usr/bin/env node
/**
 * download-recipes.mjs
 * Downloads all recipes from MCW GraphQL API and saves to src/data/recipes.json
 *
 * Usage:
 *   BEARER_TOKEN=<token> node scripts/download-recipes.mjs
 *   or set BEARER_TOKEN in a .env.local file
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'src/data/recipes.json');

const API = 'https://graphql.cloud.masterchefworld.io/graphql';

// Read token from env or .env.local
let BEARER_TOKEN = process.env.BEARER_TOKEN;
if (!BEARER_TOKEN) {
  const envFile = resolve(ROOT, '.env.local');
  if (existsSync(envFile)) {
    const lines = readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^BEARER_TOKEN=(.+)$/);
      if (m) { BEARER_TOKEN = m[1].trim(); break; }
    }
  }
}

if (!BEARER_TOKEN) {
  console.error('Error: BEARER_TOKEN not set. Run the OTP flow first to obtain a token.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${BEARER_TOKEN}`,
};

async function gql(query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error('GraphQL error');
  }
  return json.data;
}

const LIST_QUERY = `
  query RecipesList($first: Int!, $after: String) {
    recipes(first: $first, after: $after) {
      edges {
        node {
          id
          name
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const DETAIL_QUERY = `
  query RecipeDetail($id: ID!) {
    recipe(id: $id) {
      id
      name
      description
      cookingTime
      difficulty
      isPremium
      servingNumber
      images {
        url
      }
      video {
        url
        thumbnail {
          url
        }
      }
      author {
        firstName
        lastName
        profilePicture {
          url
        }
      }
      categories {
        id
        name
      }
      tags {
        name
      }
      cuisines {
        id
        name
      }
      ingredients {
        value
        unitOfMeasurement
        ingredient {
          name
        }
      }
      instructions
    }
  }
`;

async function fetchAllRecipeIds() {
  const ids = [];
  let after = null;
  let page = 1;

  while (true) {
    console.log(`  Fetching page ${page}...`);
    const data = await gql(LIST_QUERY, { first: 100, after });
    const edges = data?.recipes?.edges ?? [];
    for (const edge of edges) {
      if (edge?.node?.id) ids.push(edge.node.id);
    }
    const pageInfo = data?.recipes?.pageInfo;
    if (!pageInfo?.hasNextPage) break;
    after = pageInfo.endCursor;
    page++;
  }

  return ids;
}

async function fetchRecipeDetail(id) {
  const data = await gql(DETAIL_QUERY, { id });
  return data?.recipe ?? null;
}

async function main() {
  console.log('MCW Recipe Downloader');
  console.log('====================');

  console.log('\n[1/3] Fetching recipe list...');
  const ids = await fetchAllRecipeIds();
  console.log(`  Found ${ids.length} recipes.`);

  console.log('\n[2/3] Fetching recipe details...');
  const recipes = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    process.stdout.write(`  [${i + 1}/${ids.length}] id=${id}...`);
    try {
      const detail = await fetchRecipeDetail(id);
      if (detail) {
        recipes.push(detail);
        process.stdout.write(' ok\n');
      } else {
        process.stdout.write(' null (skipped)\n');
      }
    } catch (e) {
      process.stdout.write(` ERROR: ${e.message}\n`);
    }
    // small delay to avoid rate limiting
    if (i < ids.length - 1) await new Promise(r => setTimeout(r, 80));
  }

  console.log(`\n[3/3] Saving ${recipes.length} recipes to ${OUTPUT}...`);
  writeFileSync(OUTPUT, JSON.stringify(recipes, null, 2), 'utf-8');
  console.log('  Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
