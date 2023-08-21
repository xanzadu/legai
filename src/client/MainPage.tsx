import { Redirect } from "react-router-dom";
import useAuth from "@wasp/auth/useAuth";

export default function MainPage() {
	const { data: user } = useAuth();

	if (user) {
		return <Redirect to='/bill-search' />;
	} else {
		return <Redirect to='/login' />;
	}
}
