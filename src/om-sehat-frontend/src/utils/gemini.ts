// Gemini API helper for local chat (for testing only)
import {
	GoogleGenAI,
	createUserContent,
	createPartFromUri,
} from "@google/genai";
import type { Content, Part } from "@google/genai";

const GEMINI_API_KEY =
	import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Gemini chat with optional image input (vision/multimodal)
 * @param {Array<{sender: string, text: string}>} messages - chat history
 * @param {File|Blob|null} image - optional image file/blob
 * @param {string} systemInstruction - optional system prompt/instruction
 */
export async function geminiChat(
	messages: { sender: string; text: string }[],
	image: File | Blob | null = null,
	systemInstruction?: string
): Promise<{ text: string }> {
	// Only send the latest user message
	const lastUser = [...messages].reverse().find((m) => m.sender === "user");
	if (!lastUser && !image) return { text: "No user message." };

	// Build message parts
	const parts: Part[] = [];
	// if (systemInstruction) {
	// 	parts.push({ text: systemInstruction });
	// }
	if (lastUser) parts.push({ text: lastUser.text });

	if (image) {
		// Upload image to Gemini and get URI
		const uploaded = await ai.files.upload({ file: image });
		if (!uploaded.uri) {
			throw new Error("Image upload failed: no URI returned.");
		}
		const imagePart = createPartFromUri(
			uploaded.uri,
			uploaded.mimeType || "image/png"
		);
		parts.push(imagePart);
	}

	// Only use 'user' role for the message
	const contents: Content[] = [createUserContent(parts)];

	// Use generateContent for multimodal
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents,
		config: {
			systemInstruction: systemInstruction || "",
		},
		// temperature and maxOutputTokens are not supported at this level in the latest SDK, so omitted
	});
	return { text: response.text ?? "" };
}
