
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import TippaLogo from '@/components/shared/TippaLogo';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tippa-light">
      <div className="text-center p-6 max-w-md">
        <div className="mb-6">
          <TippaLogo size="md" className="justify-center" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-tippa-accent">404</h1>
        <p className="text-xl text-tippa-neutral mb-8">Oops! Page not found</p>
        <Link to="/" className="tippa-btn-secondary">
          Return to App Selection
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
