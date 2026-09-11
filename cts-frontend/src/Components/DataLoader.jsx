import Loading from './Loading';

export default function DataLoader({ message = 'Chargement des données…' }) {
  return <Loading text={message} className="min-h-[60vh]" />;
}
