// const config = {
// 	headers: {
// 		"x-api-key": process.env.CHATPDF_API_KEY || "",
// 		"Content-Type": "application/json",
// 	},
// };

// const urlData = {
// 	url: textUrl,
// };

// console.log("URL:", textUrl);

// const sourceResponse = await fetch(
// 	"https://api.chatpdf.com/v1/sources/add-url",
// 	{
// 		method: "POST",
// 		headers: config.headers,
// 		body: JSON.stringify(urlData),
// 	}
// );
// const sourceData = await sourceResponse.json();
// // @ts-ignore
// const sourceId = sourceData.sourceId;

// console.log("Source ID:", sourceData);

// const chatData = {
// 	sourceId: sourceId,
// 	messages: [
// 		{
// 			role: "user",
// 			content: "summarise this pdf",
// 		},
// 	],
// };

// const chatResponse = await fetch("https://api.chatpdf.com/v1/chats/message", {
// 	method: "POST",
// 	headers: config.headers,
// 	body: JSON.stringify(chatData),
// });
// const chatResponseData = await chatResponse.json();
// // @ts-ignore
// console.log("Result:", chatResponseData.content);
// // @ts-ignore
// const summary = chatResponseData.content;
