/** Type definitions for the Z.SHOP skin consultant Worker. */
export interface Env {
	AI: Ai;
	ASSETS: { fetch: (request: Request) => Promise<Response> };
}

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
}

export interface ProductCard {
	id: number;
	name: string;
	permalink: string;
	price: string;
	image: string;
	summary: string;
	categories: string[];
}
