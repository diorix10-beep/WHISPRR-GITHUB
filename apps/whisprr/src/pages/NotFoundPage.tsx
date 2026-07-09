import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Logo } from '../components/common/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Logo size={64} className="mb-6 opacity-50 grayscale mx-auto" />
        <h1 className="text-9xl font-serif font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-warm-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-warm-600 dark:text-warm-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button leftIcon={<Home size={20} />} size="lg">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
