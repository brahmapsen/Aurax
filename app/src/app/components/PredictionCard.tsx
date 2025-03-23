interface PredictionCardProps {
  question: string;
  description: string;
  endDate: string;
  status: 'open' | 'closed';
  onVote: (answer: 'yes' | 'no') => void;
  onStatusChange: (status: 'open' | 'closed') => void;
  voteCounts: {
    yes: number;
    no: number;
  };
  isExpert: boolean;
}

export default function PredictionCard({
  question,
  description,
  endDate,
  status,
  onVote,
  onStatusChange,
  voteCounts,
  isExpert = false,
}: PredictionCardProps) {
  const handleVoteClick = (answer: 'yes' | 'no') => {
    if (!isExpert) {
      alert('Only verified experts can vote on predictions');
      return;
    }
    if (status === 'closed') {
      alert('This market is closed');
      return;
    }
    onVote(answer);
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow ${
        status === 'closed' ? 'opacity-75' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">{question}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
          <p className="text-sm text-gray-500">Ends: {endDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-sm ${
              status === 'open'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {isExpert && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status === 'closed'}
                onChange={(e) =>
                  onStatusChange(e.target.checked ? 'closed' : 'open')
                }
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600">Close Market</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-4">
          <button
            onClick={() => handleVoteClick('yes')}
            className={`${
              isExpert && status === 'open'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white px-4 py-2 rounded flex items-center gap-2`}
            title={
              !isExpert
                ? 'Only verified experts can vote'
                : status === 'closed'
                ? 'Market is closed'
                : ''
            }
            disabled={!isExpert || status === 'closed'}
          >
            <span>Yes</span>
            <span
              className={`${
                isExpert && status === 'open' ? 'bg-green-600' : 'bg-gray-400'
              } px-2 py-1 rounded text-sm`}
            >
              {voteCounts.yes}
            </span>
          </button>
          <button
            onClick={() => handleVoteClick('no')}
            className={`${
              isExpert && status === 'open'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-300 cursor-not-allowed'
            } text-white px-4 py-2 rounded flex items-center gap-2`}
            title={
              !isExpert
                ? 'Only verified experts can vote'
                : status === 'closed'
                ? 'Market is closed'
                : ''
            }
            disabled={!isExpert || status === 'closed'}
          >
            <span>No</span>
            <span
              className={`${
                isExpert && status === 'open' ? 'bg-red-600' : 'bg-gray-400'
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
