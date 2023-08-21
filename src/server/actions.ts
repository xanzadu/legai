import fetch from "node-fetch";
import HttpError from "@wasp/core/HttpError.js";
import { htmlToText } from "html-to-text";
import type { ChatHistory, Bill } from "@wasp/entities";
import type {
	GenerateGptResponse,
	StripePayment,
	TagBills,
} from "@wasp/actions/types";
import type { StripePaymentResult, OpenAIResponse } from "./types";
import Stripe from "stripe";

export type BillText = {
	textUrl: string;
};

export type BillTextPayload = {
	billId: string;
};

export type BillTextResponse = {
	status: string;
	text: {
		doc_id: number;
		state_link: string;
		text: string;
		doc: string;
	};
};

export type BillStatusData = {
	status: string;
	bill: {
		billId: number;
		number: string;
		texts: {
			doc_id: number;
			state_link: string;
		}[];
	};
};

const apiKey = process.env.LEGISCAN_API_KEY || "";

const stripe = new Stripe(process.env.STRIPE_KEY!, {
	apiVersion: "2022-11-15",
});

// WASP_WEB_CLIENT_URL will be set up by Wasp when deploying to production: https://wasp-lang.dev/docs/deploying
const DOMAIN = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";

export const stripePayment: StripePayment<void, StripePaymentResult> = async (
	_args,
	context
) => {
	if (!context.user) {
		throw new HttpError(401);
	}
	let customer: Stripe.Customer;
	const stripeCustomers = await stripe.customers.list({
		email: context.user.email!,
	});
	if (!stripeCustomers.data.length) {
		console.log("creating customer");
		customer = await stripe.customers.create({
			email: context.user.email!,
		});
	} else {
		console.log("using existing customer");
		customer = stripeCustomers.data[0];
	}

	const session: Stripe.Checkout.Session =
		await stripe.checkout.sessions.create({
			line_items: [
				{
					price: process.env.SUBSCRIPTION_PRICE_ID!,
					quantity: 1,
				},
			],
			mode: "subscription",
			success_url: `${DOMAIN}/checkout?success=true`,
			cancel_url: `${DOMAIN}/checkout?canceled=true`,
			automatic_tax: { enabled: true },
			customer_update: {
				address: "auto",
			},
			customer: customer.id,
		});

	await context.entities.User.update({
		where: {
			id: context.user.id,
		},
		data: {
			checkoutSessionId: session?.id ?? null,
			stripeId: customer.id ?? null,
		},
	});

	if (!session) {
		throw new HttpError(402, "Could not create a Stripe session");
	} else {
		return {
			sessionUrl: session.url,
			sessionId: session.id,
		};
	}
};

type GptPayload = {
	billId: string;
	text: string;
};

type GptResponse = {
	text: string;
};

export const generateGptResponse: GenerateGptResponse<
	GptPayload,
	GptResponse
> = async ({ text, billId }, context) => {
	if (!context.user) {
		throw new HttpError(401);
	}
	const parsedBillId = parseInt(billId);

	const bill: Bill = await context.entities.Bill.findFirstOrThrow({
		where: {
			billId: parsedBillId,
		},
	});

	const compressedBillText = bill.text;

	const billText = Buffer.from(compressedBillText, "base64").toString("ascii");
	const prettyBillText = htmlToText(billText, {
		wordwrap: false,
		limits: {
			maxInputLength: 20000,
		},
	});

	const payload = {
		model: "gpt-3.5-turbo",
		messages: [
			{
				role: "system",
				content: `All answers should reference this text: ${prettyBillText}`,
			},
			{
				role: "user",
				content: text,
			},
		],
		temperature: 0.7,
	};

	try {
		// if (!context.user.hasPaid && !context.user.credits) {
		// 	throw new HttpError(402, "User has not paid or is out of credits");
		// } else if (context.user.credits && !context.user.hasPaid) {
		// 	console.log("decrementing credits");
		// 	await context.entities.User.update({
		// 		where: { id: context.user.id },
		// 		data: {
		// 			credits: {
		// 				decrement: 1,
		// 			},
		// 		},
		// 	});
		// }

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
			},
			method: "POST",
			body: JSON.stringify(payload),
		});

		const json = (await response.json()) as OpenAIResponse;
		console.log("response json", json);

		const chatResponse = json.choices[0].message.content.trim();

		await context.entities.ChatHistory.create({
			data: {
				user: {
					connect: {
						id: context.user.id,
					},
				},
				bill: {
					connect: {
						billId: parsedBillId,
					},
				},
				role: "user",
				text: text,
			},
		});

		await context.entities.ChatHistory.create({
			data: {
				user: {
					connect: {
						id: context.user.id,
					},
				},
				bill: {
					connect: {
						billId: parsedBillId,
					},
				},
				role: "bot",
				text: chatResponse,
			},
		});

		return {
			text: chatResponse,
		};
	} catch (error) {
		console.error(error);
		throw new HttpError(500, "Failed to generate GPT-3 response");
	}
};

export async function fetchJson(url: string): Promise<any> {
	const response = await fetch(url);
	return response.json();
}

export const tagBills: TagBills<void, void> = async (args, context) => {
	const bills: Bill[] = await context.entities.Bill.findMany({});

	for (const bill of bills) {
		if (bill.tags) {
			continue;
		}
		console.log("tagging bill", bill);
		const billId = bill.billId;
		const billUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBill&id=${billId}`;
		const billData = (await fetchJson(billUrl)) as BillStatusData;

		const docID = billData.bill.texts.length > 0 ? billData.bill.texts[0].doc_id : null;
		console.log("docID", docID);
		if (!docID) {
			console.log("no doc id for bill", bill);
			continue;
		}
		const docUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docID}`;
		const docData = (await fetchJson(docUrl)) as BillTextResponse;
		const textUrl = docData.text.state_link;
		const compressedText = docData.text.doc;

		const billText = Buffer.from(compressedText, "base64").toString("ascii");
		const prettyBillText = htmlToText(billText, {
			wordwrap: false,
			limits: {
				maxInputLength: 20000,
			},
		});

		const prompt = `Provide 5 tags for this bill and a numeric confidence value between 0-1. Return as an object like this example: {
      "tags": [
        { "tag": "health", "confidence": 0.9 },
        { "tag": "education", "confidence": 0.8 },
        { "tag": "environment", "confidence": 0.7 },
        { "tag": "economy", "confidence": 0.6 },
        { "tag": "crime", "confidence": 0.5 },
        ...
    }`;

		const payload = {
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `All answers should reference this text: ${prettyBillText}`,
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.2,
		};

		try {
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
					},
					method: "POST",
					body: JSON.stringify(payload),
				}
			);

			const json = (await response.json()) as OpenAIResponse;
			console.log("response json", json);

			const chatResponse = json.choices[0].message.content.trim();

			await context.entities.Bill.update({
				where: { billId: bill.billId },
				data: {
					tags: chatResponse,
				},
			});

			console.log("tags added to bill", bill.billId, chatResponse);
			await new Promise((resolve) => setTimeout(resolve, 3000));
		} catch (error) {
			console.error(error);
			throw new HttpError(500, "Failed to generate GPT-3 response");
		}
	}
};
