export default {
	async queue(batch, env, ctx) {
		const rows = [];

		for (const message of batch.messages) {
			const log = message.body;

			rows.push({
				ts: log.request.timestamp,
				request_id: log.request.id,
				method: log.request.method,
				url: log.request.url,
				path: log.request.pathname,
				status: log.response.status,
				latency_ms: log.timing.latency_ms,

				country: log.request.cf?.country ?? '',
				city: log.request.cf?.city ?? '',
				colo: log.request.cf?.colo ?? '',

				user_agent: log.request.headers['user-agent'] ?? '',
				ip: log.request.headers['cf-connecting-ip'] ?? '',

				headers_json: JSON.stringify(log.request.headers),
				cf_json: JSON.stringify(log.request.cf),
			});
		}


		const payload = rows.map((r) => JSON.stringify(r)).join('\n');

		const insertUrl = `https://${env.CLICKHOUSE_HOST}:8443/` + `?query=INSERT INTO observability.raw_request_logs FORMAT JSONEachRow`;

		const response = await fetch(insertUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-ClickHouse-User': env.CLICKHOUSE_USER,
				'X-ClickHouse-Key': env.CLICKHOUSE_PASSWORD,
			},
			body: payload,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('ClickHouse insert failed:', errorText);
			throw new Error('ClickHouse insert failed');
		}
		for (const message of batch.messages) {
			message.ack();
		}
	},

	// async scheduled(event, env, ctx) {
	// 	console.log('Consumer cron warm ping');

	// 	try {
	// 		await fetch(`https://${env.CLICKHOUSE_HOST}:8443/`, {
	// 			method: 'POST',
	// 			headers: {
	// 				'Content-Type': 'text/plain',
	// 				'X-ClickHouse-User': env.CLICKHOUSE_USER,
	// 				'X-ClickHouse-Key': env.CLICKHOUSE_PASSWORD,
	// 			},
	// 			body: 'SELECT 1',
	// 		});
	// 	} catch (err) {
	// 		console.error('ClickHouse warm error:', err);
	// 	}
	// },
};
