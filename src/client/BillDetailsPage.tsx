import { useQuery } from "@wasp/queries";
import getBillText from "@wasp/queries/getBillText";
import { useParams } from "react-router-dom";
import DocumentViewer from "./components/DocumentViewer";
import Chat from "./components/Chat"


export default function BillDetailsPage() {
	const { billId } = useParams<{ billId: string }>();

	return (
		<div className="flex h-screen">
			<div className="w-2/3 bg-gray-100 ">
				<DocumentViewer billId={billId} />
			</div>
			<div className="w-1/3 bg-white-10 border-grey-300 px-6 py-4 border-l-8">
				<Chat billId={billId} />
			</div>
		</div>
	);
}
