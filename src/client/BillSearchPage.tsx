import { useState, useMemo } from "react";
import { useQuery } from "@wasp/queries";
import generateBillList from "@wasp/queries/generateBillList";
import { Bill } from "@wasp/entities";
import { Link } from "react-router-dom";
import Fuse from "fuse.js";

export default function BillSearch() {
	const { data: bills } = useQuery(generateBillList);
	const [searchTerm, setSearchTerm] = useState("");
	const filteredBills: Bill[] = useMemo(() => {
		if (!bills) {
			return [];
		}

		const fuse = new Fuse(bills, {
			keys: ["tags", "title", "description", "number", "billId"],
			threshold: 0.3,
		});

		const fullFilteredList =  searchTerm
			? fuse.search(searchTerm).map((result) => result.item)
      : bills;
    return fullFilteredList.slice(0, 100);
	}, [bills, searchTerm]);

	const handleSearchTermChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setSearchTerm(event.target.value);
	};

	return (
		<div className="container mx-auto mt-10 h-auto">
			<h1 className="text-3xl font-bold mb-4">Bill Search</h1>
			<div className="mb-4">
				<input
					type="text"
					placeholder="Search bills..."
					className="border border-gray-400 rounded py-2 px-4 w-full"
					value={searchTerm}
					onChange={handleSearchTermChange}
				/>
			</div>
			<div
				className="shadow-md overflow-y-scroll "
				style={{ maxHeight: "80vh" }}
			>
				<table className="table-auto w-full">
					<thead>
						<tr>
							<th className="px-4 py-2">Bill ID</th>
							<th className="px-4 py-2">Title</th>
							<th className="px-4 py-2">Number</th>
							<th className="px-4 py-2">Last Action</th>
							<th className="px-4 py-2">Action Date</th>
							<th className="px-4 py-2">Description</th>
							<th className="px-4 py-2">Tags</th>
						</tr>
					</thead>
					<tbody>
						{filteredBills.map((bill, index) => (
							<tr
								key={bill.billId}
								className={index % 2 === 0 ? "bg-gray-100" : ""}
							>
								<td className="border px-4 py-2 my-2 text-blue-50">
									<Link to={`/bill-search/${bill.billId}`}>{bill.billId}</Link>
								</td>
								<td className="border px-4 py-2">{bill.title}</td>
								<td className="border px-4 py-2">{bill.number}</td>
								<td className="border px-4 py-2">{bill.last_action}</td>
								<td className="border px-4 py-2">{bill.last_action_date}</td>
								<td className="border px-4 py-2 overflow-hidden max-h-4">
									{bill.description}
								</td>
								<td className="border px-4 py-2">{bill.tags}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
