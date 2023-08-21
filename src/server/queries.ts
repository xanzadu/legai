import HttpError from "@wasp/core/HttpError.js";
import fetch from "node-fetch";
import type { ChatHistory, Bill } from "@wasp/entities";
import type { GetChatHistory } from "@wasp/queries/types";
import type { GenerateBillList } from "@wasp/queries/types";
import type { GetBillText } from "@wasp/queries/types";

const apiKey = process.env.LEGISCAN_API_KEY || "";

type LegiscanResponse = {
	status: string;
	masterlist: {
		[key: string]: {
			bill_id: number;
			number: string;
			change_hash: string;
			url: string;
			status_date: string;
			status: number;
			last_action_date: string;
			last_action: string;
			title: string;
			description: string;
		};
	};
};

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

type Tag = {
  tag: string;
  confidence: number;
};

export const getChatHistory: GetChatHistory<BillTextPayload, ChatHistory[]> = async (
	args,
	context
) => {
	if (!context.user) {
		throw new HttpError(401);
	}
	let chatHistory =  await context.entities.ChatHistory.findMany({
		where: {
			user: {
				id: context.user.id,
      },
      bill: {
        billId: parseInt(args.billId),
      }
		},
  });

  // if chat history doesn't exist, create it
  
  if (chatHistory.length === 0) {
    const chatHistoryObj = await context.entities.ChatHistory.create({
      data: {
        user: {
          connect: {
            id: context.user.id,
          },
        },
        bill: {
          connect: {
            billId: parseInt(args.billId),
          },
        },
        text: "Ask me anything about this bill! For example, you can ask me to summarize it, or tell you what it's about.",
        role: "bot",
      },
    });
    chatHistory = [chatHistoryObj];
  }
  return chatHistory;
};

export async function fetchJson(url: string): Promise<any> {
	const response = await fetch(url);
	return response.json();
}

export const generateBillList: GenerateBillList<void, Bill[]> = async (
	args,
	context
) => {
	if (!context.user) {
		throw new HttpError(401);
	}

  const cachedData = await context.entities.Bill.findFirst();
  

	if (cachedData) {
		const dbBills: Bill[] = await context.entities.Bill.findMany({
			//sort by bill number
			orderBy: {
				billId: "asc",
			},
    });
    
    // convert tags in this array to a text string of tags, the current form is like this [
    //   { "tag": "oil refineries", "confidence": 0.9 },
    //   { "tag": "maintenance", "confidence": 0.8 },
    //   { "tag": "legislation", "confidence": 0.7 },
    //   { "tag": "gasoline supply", "confidence": 0.6 },
    //   { "tag": "occupational safety", "confidence": 0.5 }]
    // and we want to convert it to this:
    // "oil refineries, maintenance, legislation, gasoline supply, occupational safety"
    const dbBillWithTags:Bill[] = dbBills.map((bill) => {
      const parsedTags: Tag[] = bill.tags ? JSON.parse(bill.tags).tags : null;
      console.log("parsedTags", parsedTags);
      const tags = parsedTags ? parsedTags.map((tag) => tag.tag).join(", ") : "";
      return {
        ...bill,
        tags,
      }
    });

		return dbBillWithTags;
	}

	const url = `https://api.legiscan.com/?key=${apiKey}&op=getMasterList&state=CA`;

	const data = (await fetchJson(url)) as LegiscanResponse;
	await context.entities.Bill.deleteMany();
	const bills = Object.values(data.masterlist)
		.map((bill) => ({
			billId: bill.bill_id,
			number: bill.number,
			change_hash: bill.change_hash,
			url: bill.url,
			status_date: bill.status_date,
			status: bill.status,
			last_action_date: bill.last_action_date,
			last_action: bill.last_action,
			title: bill.title,
			description: bill.description,
		}))
		.slice(0, 100);

	await context.entities.Bill.createMany({
		data: bills,
	});

	const dbBills: Bill[] = await context.entities.Bill.findMany({
		//sort by bill number
		orderBy: {
			billId: "asc",
		},
	});

	return dbBills;
};

export const getBillText: GetBillText<BillTextPayload, BillText> = async (
	args,
	context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
	const billId = args.billId;
	const billUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBill&id=${billId}`;
	const billData = await fetchJson(billUrl) as BillStatusData;
	const docID = billData.bill.texts[0].doc_id;
	const docUrl = `https://api.legiscan.com/?key=${apiKey}&op=getBillText&id=${docID}`;
	const docData = (await fetchJson(docUrl)) as BillTextResponse;
  const textUrl = docData.text.state_link;
  const compressedText = docData.text.doc;

  await context.entities.Bill.update({
		where: { billId: parseInt(billId) },
		data: {
			text: compressedText,
		},
  });

	return { textUrl };
};