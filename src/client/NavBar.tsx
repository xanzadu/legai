import logo from "./static/logo.png";
import { Disclosure } from "@headlessui/react";
import { AiOutlineBars, AiOutlineClose, AiOutlineUser } from "react-icons/ai";
import useAuth from "@wasp/auth/useAuth";
import { Link, useLocation } from "react-router-dom";

const active =
	"inline-flex items-center border-b-2 border-indigo-300 px-1 pt-1 text-sm font-medium text-gray-900";
const inactive =
	"inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700";

export default function NavBar() {
	const { data: user } = useAuth();
	const location = useLocation();

	return (
		<Disclosure as="nav" className="bg-white shadow sticky top-0 z-50 ">
			{({ open }) => (
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-16">
					<div className="flex h-16 justify-between">
						<div className="flex">
							<div className="flex flex-shrink-0 items-center">
								<Link to="/">
									<img className="h-8 w-8" src={logo} alt="My SaaS App" />
								</Link>
							</div>
							<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
								<Link
									to="/bill-search"
									className={
										location.pathname === "/bill-search" ? active : inactive
									}
								>
									Bill Search
								</Link>

								<Link
									to="/pricing"
									className={
										location.pathname === "/pricing" ? active : inactive
									}
								>
									Pricing
								</Link>
							</div>
						</div>
						<div className="hidden sm:ml-6 sm:flex sm:items-center">
							{user ? (
								<Link
									to="/account"
									className="text-gray-500 hover:text-gray-700"
								>
									<AiOutlineUser className="h-6 w-6" />
								</Link>
							) : (
								<Link to="/login" className="text-gray-500 hover:text-gray-700">
									Log in
								</Link>
							)}
						</div>
						<div className="-mr-2 flex items-center sm:hidden">
							<Disclosure.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
								<span className="sr-only">Open main menu</span>
								{open ? (
									<AiOutlineClose className="block h-6 w-6" />
								) : (
									<AiOutlineBars className="block h-6 w-6" />
								)}
							</Disclosure.Button>
						</div>
					</div>
				</div>
			)}
		</Disclosure>
	);
}
