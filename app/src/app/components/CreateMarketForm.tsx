'use client';

import { useState } from 'react';

interface CreateMarketFormProps {
  onSubmit: (market: { question: string; description: string }) => void;
  onCancel: () => void;
}

export default function CreateMarketForm({
  onSubmit,
  onCancel,
}: CreateMarketFormProps) {
  const [question, setQuestion] = useState(
    'Will AI surpass human intelligence by 2030?'
  );
  const [description, setDescription] = useState(
    'This market predicts whether artificial general intelligence (AGI) will achieve human-level capabilities across most cognitive tasks by the year 2030. Success criteria include passing advanced reasoning tests, creative tasks, and general problem solving at or above human expert level.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ question, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          Create New Prediction Market
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Question
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Create Market
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
