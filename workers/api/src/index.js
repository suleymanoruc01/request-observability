const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env) {
		// Preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		if (url.pathname === '/logs') {
			return handleLogs(request, env);
		}

		return new Response('API Worker running', {
			headers: corsHeaders,
		});
	},
};

async function handleLogs(request, env) {
	const url = new URL(request.url);

	const limit = parseInt(url.searchParams.get('limit') || '10', 10);
	const cursor = url.searchParams.get('cursor');

	let whereClause = '';
	if (cursor) {
		const [ts, requestId] = cursor.split('|');

		whereClause = `
			WHERE (ts, request_id) < (toDateTime64('${ts}', 3), '${requestId}')
    `;
	}

	const query = `
    SELECT
	*
    FROM ${env.CLICKHOUSE_DATABASE}.raw_request_logs
    ${whereClause}
    ORDER BY ts DESC, request_id DESC
    LIMIT ${limit}
    FORMAT JSON
  `;

	const response = await fetch(`https://${env.CLICKHOUSE_HOST}:8443/`, {
		method: 'POST',
		headers: {
			'Content-Type': 'text/plain',
			'X-ClickHouse-User': env.CLICKHOUSE_USER,
			'X-ClickHouse-Key': env.CLICKHOUSE_PASSWORD,
		},
		body: query,
	});

	if (!response.ok) {
		const text = await response.text();
		return new Response(text, { status: 500 });
	}

	const data = await response.json();
	const rows = data.data || [];

	let nextCursor = null;
	if (rows.length > 0) {
		const last = rows[rows.length - 1];
		nextCursor = `${last.ts}|${last.request_id}`;
	}

	return new Response(
		JSON.stringify({
			data: rows,
			next_cursor: nextCursor,
		}),
		{
			headers: {
				'Content-Type': 'application/json',
				...corsHeaders,
			},
		},
	);
}
