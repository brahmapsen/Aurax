import Link from 'next/link';

interface HeaderProps {
  user: any;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Expert Predictions
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          ) : (
            <div id="google-btn"></div>
          )}
        </div>
      </div>
    </header>
  );
}
