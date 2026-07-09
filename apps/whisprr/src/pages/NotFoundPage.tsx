import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Logo } from '../components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <Logo size={64} className="mb-6 opacity-50 grayscale" />
        <h1 className="font-serif text-6xl font-bold text-warm-900 dark:text-warm-50 mb-2">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-warm-700 dark:text-warm-300 mb-4">
          Page Not Found
        </h2>
        <p className="text-warm-500 dark:text-warm-400 mb-8 max-w-sm">
          The page you're looking for doesn't exist or has been moved. Let's get you back home.
        </p>
        <Link 
          to="/"
          className="btn-primary flex items-center gap-2"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
