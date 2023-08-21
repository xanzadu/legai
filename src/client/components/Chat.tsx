import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@wasp/queries";
import generateGptResponse from "@wasp/actions/generateGptResponse";
import { ChatHistory } from "@wasp/entities";
import getChatHistory from "@wasp/queries/getChatHistory";

type ChatProps = {
	billId: string;
};

export default function Chat({ billId }: ChatProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const {
		data: chatHistory,
		isLoading,
		isError,
	} = useQuery(getChatHistory, {
		billId,
  });

	const onSubmit = async ({ command }: any) => {
    setIsSubmitting(true);
		try {
			await generateGptResponse({
				billId: billId.toString(),
				text: command,
			});
      reset();
		} catch (e) {
			setErrorMessage("Something went wrong. Please try again.");
			console.error(e);
		} finally {
			setIsSubmitting(false);
		}
	};

	const {
		handleSubmit,
		register,
		reset,
		formState: { errors: formErrors },
	} = useForm();

  if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (isError) {
		return <div>Unable to open chat.</div>;
  }
  
  return (
		<>
			<div className="text-xl">Chat</div>
			<div className="border rounded-lg border-gray-300 px-6 flex flex-col h-5/6 mt-3">
				<div className="flex-1 flex overflow-hidden">
					<div className="flex-1 pr-6 py-5 overflow-y-scroll max-h-full">
						{chatHistory.map((message, index) => (
							<div
								key={index}
								className={`flex ${
									message.role === "user" ? "justify-end" : "justify-start"
								} mb-4`}
							>
								<div
									className={`inline-block px-4 py-2 rounded-lg ${
										message.role === "user"
											? "bg-blue-500 text-white"
											: "bg-gray-200"
									}`}
								>
									{message.text}
								</div>
							</div>
						))}
						{isSubmitting && (
							<div className="inline-block ml-2 animate-pulse">
								<svg
									className="h-4 w-4 text-gray-500"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm0 18.75A8.75 8.75 0 1118.75 10 8.76 8.76 0 0110 18.75zm0-15a6.25 6.25 0 100 12.5 6.25 6.25 0 000-12.5z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
						)}
					</div>
				</div>
				<form className="pb-4" onSubmit={handleSubmit(onSubmit)}>
					<div className="flex items-center">
						<input
							{...register("command", { required: true })}
							type="text"
							id="command"
							className="block w-full rounded-md sm:text-sm border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Type your message here..."
							disabled={isSubmitting}
							style={{ minWidth: 0 }}
						/>
						<button
							type="submit"
							className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							disabled={isSubmitting}
						>
							{isSubmitting ? "Sending..." : "Send"}
						</button>
					</div>
					{formErrors.command && (
						<p className="mt-2 text-sm text-red-600">Please enter a message.</p>
					)}
					{errorMessage && (
						<p className="mt-2 text-sm text-red-600">{errorMessage}</p>
					)}
				</form>
			</div>
		</>
	);
}
