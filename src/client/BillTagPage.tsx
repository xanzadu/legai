import { useState } from "react";
import tagBills from "@wasp/actions/tagBills";

type TagBillsButtonProps = {
	isTagging: boolean;
};

export default function TagBillsButton({ isTagging }: TagBillsButtonProps) {
	const [isTaggingLocal, setIsTaggingLocal] = useState(false);

	const handleTagBillsClick = async () => {
		setIsTaggingLocal(true);
		try {
			await tagBills();
		} catch (error) {
			console.error(error);
		}
		setIsTaggingLocal(false);
	};

	return (
		<button
			className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			onClick={handleTagBillsClick}
			disabled={isTagging || isTaggingLocal}
		>
			{isTaggingLocal ? "Tagging..." : "Tag Bills"}
		</button>
	);
}
