interface PredictionCardProps {
  question: string;
  description: string;
  endDate: string;
  onVote: (answer: 'yes' | 'no') => void;
  voteCounts: {
    yes: number;
    no: number;
  };
  isExpert?: boolean;
}

export default function PredictionCard({
  question,
  description,
  endDate,
  onVote,
  voteCounts,
  isExpert = false,
}: PredictionCardProps) {
  const handleVoteClick = (answer: 'yes' | 'no') => {
    if (!isExpert) {
      alert('Only verified experts can vote on predictions');
      return;
    }
    onVote(answer);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-2">{question}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-sm text-gray-500 mb-4">Ends: {endDate}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={() => handleVoteClick('yes')}
            className={`${
              isExpert
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white px-4 py-2 rounded flex items-center gap-2`}
            title={!isExpert ? 'Only verified experts can vote' : ''}
            disabled={!isExpert}
          >
            <span>Yes</span>
            <span
              className={`${
                isExpert ? 'bg-green-600' : 'bg-gray-400'
              } px-2 py-1 rounded text-sm`}
            >
              {voteCounts.yes}
            </span>
          </button>
          <button
            onClick={() => handleVoteClick('no')}
            className={`${
              isExpert
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white px-4 py-2 rounded flex items-center gap-2`}
            title={!isExpert ? 'Only verified experts can vote' : ''}
            disabled={!isExpert}
          >
            <span>No</span>
            <span
              className={`${
                isExpert ? 'bg-red-600' : 'bg-gray-400'
              } px-2 py-1 rounded text-sm`}
            >
              {voteCounts.no}
            </span>
          </button>
        </div>

        <div className="text-sm text-gray-500">
          Total votes: {voteCounts.yes + voteCounts.no}
        </div>
      </div>
    </div>
  );
}
