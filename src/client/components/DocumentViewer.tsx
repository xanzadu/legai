import { useQuery } from "@wasp/queries";
import getBillText from "@wasp/queries/getBillText";

export type DocumentViewerProps = {
	billId: string;
};

export default function DocumentViewer({ billId }: DocumentViewerProps) {
	const {
		data: billText,
		isLoading,
		isError,
	} = useQuery(getBillText, {
		billId,
	});

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (isError) {
		return <div>Unable to find bill.</div>;
	}

	return (
		<div className="h-full w-full">
			<iframe
				src={billText.textUrl}
				className="w-full h-full transform scale-80 m-1 p-1"
				style={{ border: "none" }}
			/>
		</div>
	);
}
