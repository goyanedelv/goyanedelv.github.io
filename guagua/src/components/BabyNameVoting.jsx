import React, { useState, useEffect } from "react";

const Button = ({ children, onClick, className, disabled, type }) => (
  <button
    onClick={onClick}
    className={`bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg shadow-md transition-colors w-full sm:w-auto ${className}`}
    disabled={disabled}
    type={type}
  >
    {children}
  </button>
);

const Card = ({ children, className, onClick }) => (
  <div 
    className={`border-2 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer max-w-[160px] w-full ${className}`} 
    onClick={onClick}
  >
    {children}
  </div>
);

const CardContent = ({ children, className }) => (
  <div className={`text-center ${className}`}>{children}</div>
);

export default function BabyNameVoting() {
  const [totalNamesNeeded, setTotalNamesNeeded] = useState(0);
  const [isSettingNames, setIsSettingNames] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [names, setNames] = useState([]);
  const [votes, setVotes] = useState({});
  const [round, setRound] = useState(0);
  const [currentPair, setCurrentPair] = useState([]);
  const [finished, setFinished] = useState(false);

  const handleNameChange = (index, value) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const generateAllPairs = (nameList) => {
    let pairs = [];
    for (let i = 0; i < nameList.length; i++) {
      for (let j = i + 1; j < nameList.length; j++) {
        pairs.push([nameList[i], nameList[j]]);
      }
    }
    return pairs;
  };

  const startVoting = () => {
    if (names.filter(name => name?.trim()).length === totalNamesNeeded) {
      setSetupComplete(true);
      setVotes(names.reduce((acc, name) => ({ ...acc, [name]: 0 }), {}));
      const allPairs = generateAllPairs(names);
      setCurrentPair(allPairs[0]);
      setRound(0);
    }
  };

  const vote = (winner) => {
    setVotes(prev => ({
      ...prev,
      [winner]: prev[winner] + 1
    }));
    const nextRound = round + 1;
    const allPairs = generateAllPairs(names);
    
    if (nextRound >= allPairs.length) {
      setFinished(true);
    } else {
      setRound(nextRound);
      setCurrentPair(allPairs[nextRound]);
    }
  };

  const resetVoting = () => {
    setNames([]);
    setVotes({});
    setRound(0);
    setCurrentPair([]);
    setFinished(false);
    setSetupComplete(false);
    setTotalNamesNeeded(0);
    setIsSettingNames(false);
  };

  const handleNumberSubmit = (e) => {
    e.preventDefault();
    if (totalNamesNeeded >= 2) {
      setIsSettingNames(true);
      setNames(Array(totalNamesNeeded).fill(''));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-lg mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">
          Guagua namer 👶
        </h1>
        
        {!setupComplete && (
          <div className="w-full">
            {!isSettingNames ? (
              <form onSubmit={handleNumberSubmit} className="flex flex-col items-center gap-4 mb-6">
                <input
                  type="number"
                  className="border-2 p-3 rounded-lg w-full text-center text-lg"
                  placeholder="¿Cuántos nombres van a competir?"
                  onChange={(e) => setTotalNamesNeeded(parseInt(e.target.value))}
                  min="2"
                  value={totalNamesNeeded || ''}
                />
                <Button type="submit" disabled={totalNamesNeeded < 2}>
                  Define los nombres en competencia
                </Button>
              </form>
            ) : (
              <div className="w-full">
                {Array(totalNamesNeeded).fill().map((_, index) => (
                  <div key={index} className="mb-4">
                    <input
                      className="border-2 p-3 rounded-lg w-full text-center"
                      value={names[index] || ''}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`Nombre ${index + 1}`}
                    />
                  </div>
                ))}
                <Button 
                  onClick={startVoting}
                  disabled={names.filter(name => name?.trim()).length !== totalNamesNeeded}
                >
                  Comenzar Votación
                </Button>
              </div>
            )}
          </div>
        )}

        {setupComplete && !finished && (
          <div className="w-full">
            <div className="flex items-center justify-center gap-12 my-12">
              <Card onClick={() => vote(currentPair[0])} className="max-w-[300px] min-h-[100px] flex items-center">
                <CardContent className="text-5xl font-bold text-blue-700 w-full">
                  {currentPair[0]}
                </CardContent>
              </Card>
              
              <div className="text-4xl font-bold text-gray-600 px-8">
                vs
              </div>
              
              <Card onClick={() => vote(currentPair[1])} className="max-w-[300px] min-h-[100px] flex items-center">
                <CardContent className="text-5xl font-bold text-blue-700 w-full">
                  {currentPair[1]}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {finished && (
          <div className="w-full text-center">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Ranking Final</h2>
            <ul className="space-y-3 mb-6">
              {Object.entries(votes)
                .sort((a, b) => b[1] - a[1])
                .map(([name, voteCount], index) => (
                  <li key={name} className="text-lg bg-white p-4 rounded-lg shadow">
                    <span className="font-bold">{index + 1}. {name}</span>: {voteCount} votos
                  </li>
                ))}
            </ul>
            <Button onClick={resetVoting}>
              Competir de nuevo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
