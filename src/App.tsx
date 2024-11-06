import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';

interface NumberType {
  value: number;
  top: string;
  left: string;
  countdown: number;
  clicked: boolean;
  fadeOut: boolean;
  isGameOver: boolean;
}

const App: React.FC = () => {
  const [points, setPoints] = useState<number>(5);
  const [numbers, setNumbers] = useState<NumberType[]>([]);
  const [clickedOrder, setClickedOrder] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [message, setMessage] = useState<string>("LET'S PLAY");
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const timerRef = useRef(null);
  const autoPlayRef = useRef(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [nextNumber, setNextNumber] = useState<number>(1);
  const [showNextNumber, setShowNextNumber] = useState<boolean>(false);
  const [showAutoPlayButton, setShowAutoPlayButton] = useState<boolean>(false);

  const initializeGame = useCallback(() => {
    const generatedNumbers: NumberType[] = Array.from({ length: points }, (_, i) => ({
      value: i + 1,
      top: `${Math.random() * 80}%`,
      left: `${Math.random() * 80}%`,
      countdown: 3.0,
      clicked: false,
      fadeOut: false,
      isGameOver: false,
    }));
    setNumbers(generatedNumbers);
    setClickedOrder([]);
    setTimer(0);
    setIsPlaying(true);
    setMessage("LET'S PLAY");
    setNextNumber(1);
    setShowNextNumber(true);
    setGameOver(false);
    setShowAutoPlayButton(true);
  }, [points]);

  const handlePlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    initializeGame();
    setHasStarted(true);
    timerRef.current = setInterval(() => setTimer((prev) => prev + 0.1), 100);

    if (autoPlay) {
      startAutoPlay();
    }
  }, [initializeGame, autoPlay]);

  const handleNumberClick = useCallback((value: number) => {
    if (value === points) {
      setShowNextNumber(false);
    } else {
      setNextNumber(value + 1);
    }
    if (value === clickedOrder.length + 1) {
      setClickedOrder((prev) => [...prev, value]);
      setNumbers((prev) =>
        prev.map((num) =>
          num.value === value
            ? { ...num, clicked: true, countdown: 3.0, fadeOut: true }
            : num
        )
      );

      const countdownInterval = setInterval(() => {
        setNumbers((prev) =>
          prev.map((num) =>
            num.value === value && num.countdown > 0
              ? { ...num, countdown: parseFloat((num.countdown - 0.1).toFixed(1)) }
              : num
          )
        );
      }, 100);

      setTimeout(() => clearInterval(countdownInterval), 3000);
    } else {
      setNumbers((prev) =>
        prev.map((num) =>
          num.value === value
            ? { ...num, clicked: true, fadeOut: false, countdown: 3.0, isGameOver: true }
            : num
        )
      );
      handleGameOver('GAME OVER');
    }
  }, [clickedOrder.length, points]);

  const handleGameOver = useCallback((msg: string) => {
    setShowNextNumber(false);
    setGameOver(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setMessage(msg);
    setShowAutoPlayButton(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    autoPlayRef.current = setInterval(() => {
      if (clickedOrder.length < points) {
        handleNumberClick(clickedOrder.length + 1);
      } else {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      }
    }, 500);
  }, [handleNumberClick, clickedOrder, points]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  useEffect(() => {
    if (autoPlay && isPlaying && !gameOver) {
      startAutoPlay();
    } else {
      clearInterval(autoPlayRef.current);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [autoPlay, isPlaying, gameOver, startAutoPlay]);

  useEffect(() => {
    if (gameOver) return;

    if (numbers.some(num => num.countdown > 0)) {
      const countdownInterval = setInterval(() => {
        setNumbers((prevNumbers) =>
          prevNumbers.map((num) => {
            if (num.countdown > 0) {
              return {
                ...num,
                countdown: parseFloat((num.countdown - 0.1).toFixed(1)),
              };
            }
            return num;
          })
        );
      }, 100);
      return () => clearInterval(countdownInterval);
    }
  }, [numbers, gameOver]);

  useEffect(() => {
    const fadeOutTimeout = setTimeout(() => {
      setNumbers((prevNumbers) => prevNumbers.filter((num) => !num.fadeOut));
    }, 1000);

    return () => clearTimeout(fadeOutTimeout);
  }, [numbers.filter(num => num.fadeOut).length]);

  useEffect(() => {
    if (isPlaying && points > 0 && clickedOrder.length === points) {
      setTimeout(() => {
        handleGameOver('ALL CLEARED');
      }, 500);
    }
  }, [clickedOrder, points, isPlaying]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoPlayRef.current);
    };
  }, []);

  const getMessageStyle = useMemo(() => {
    switch (message) {
      case 'GAME OVER':
        return { color: 'red' };
      case 'ALL CLEARED':
        return { color: 'green' };
      default:
        return { color: 'black' };
    }
  }, [message]);

  return (
    <div className='game'>
      <h1 style={getMessageStyle}>{message}</h1>
      <div className="group">
        <div className="row">
          <label>Points:</label>
          <input
            type="text"
            min="1"
            value={points || ""}
            onChange={(e) => {
              const value = e.target.value;
              setPoints(value === "" ? "" : Number(value));
            }}
            disabled={isPlaying}
          />
        </div>
        <div className="row">
          <label>Time:</label>
          <p>{timer.toFixed(1)}s</p>
        </div>
      </div>
      <div className="button-group">
        <button onClick={handlePlay}>{hasStarted ? 'Restart' : 'Play'}</button>
        {showAutoPlayButton && (
          <button onClick={toggleAutoPlay}>
            {autoPlay ? 'Auto Play: OFF' : 'Auto Play: ON'}
          </button>
        )}
      </div>
      <div className='frame'>
        {numbers.map(({ value, top, left, countdown, clicked, fadeOut }) => (
          <div
            key={value}
            onClick={() => isPlaying && handleNumberClick(value)}
            className={`number-container ${clicked ? 'clicked' : ''} ${fadeOut ? 'fade-out' : ''}`}
            style={{ top, left, zIndex: points - value }}
          >
            <div className="number-outer">
              <div className="number-inner">
                {value}
                {clicked && (
                  <div className="countdown">
                    {countdown.toFixed(1)}s
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showNextNumber && !gameOver && (
        <div className="next-number">
          <p>Next: {nextNumber}</p>
        </div>
      )}
    </div>
  );
};

export default App;
