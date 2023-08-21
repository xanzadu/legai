import './Main.css';
import NavBar from './NavBar';
import { ReactNode } from 'react';

export default function App({ children }: { children: ReactNode }) {
  /**
   * use this component to wrap all child components
   * this is useful for templates, themes, and context
   * in this case the NavBar will always be rendered
   */
  return (
		<div className="max-h-screen">
			<NavBar />
			<div>{children}</div>
		</div>
	);
}
