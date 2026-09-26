export function extractAccessTokenFromProtocols(
	protocolHeader: string | string[] | undefined,
): string | undefined {
	if (!protocolHeader) return undefined;
	const raw =
		typeof protocolHeader === "string"
			? protocolHeader
			: protocolHeader.join(",");
	const parts = raw
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);

	for (const part of parts) {
		if (part.toLowerCase().startsWith("access-token.")) {
			return part.slice("access-token.".length);
		}
	}

	return undefined;
}
