import Loading from './Loading';

const DataLoader = ({ message = 'Chargement des données...' }) => (
  <Loading text={message} className="min-h-[60vh]" />
);

export default DataLoader;
