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
  const pointsRef = useRef<HTMLInputElement>(null);
  const [numbers, setNumbers] = useState<NumberType[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [message, setMessage] = useState<string>("LET'S PLAY");
  const [autoPlay, setAutoPlay] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const autoPlayRef = useRef<number | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [showAutoPlayButton, setShowAutoPlayButton] = useState<boolean>(false);

  const getPoints = () => Number(pointsRef.current?.value) || 5;

  const initializeGame = useCallback(() => {
    const NUMBER_BOX_SIZE = 5;
    const FRAME_HEIGHT = 40 * 16;
    const FRAME_WIDTH = 100 * 16;
    const points = getPoints();
    const generatedNumbers: NumberType[] = Array.from({ length: points }, (_, i) => ({
      value: i + 1,
      top: `${Math.random() * (FRAME_HEIGHT - NUMBER_BOX_SIZE * 16) / FRAME_HEIGHT * 100}%`,
      left: `${Math.random() * (FRAME_WIDTH - NUMBER_BOX_SIZE * 16) / FRAME_WIDTH * 100}%`,
      countdown: 3.0,
      clicked: false,
      fadeOut: false,
      isGameOver: false,
    }));
    setNumbers(generatedNumbers);
    setTimer(0);
    setIsPlaying(true);
    setMessage("LET'S PLAY");
    setCurrentNumber(1);
    setGameOver(false);
    setShowAutoPlayButton(true);
  }, []);

  const handleGameOver = useCallback((msg: string) => {
    setGameOver(true);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setMessage(msg);
    setShowAutoPlayButton(false);
  }, []);

  const handleNumberClick = useCallback((value: number) => {
    if (value === currentNumber) {
      setNumbers((prev) =>
        prev.map((num) =>
          num.value === value
            ? { ...num, clicked: true, countdown: 3.0, fadeOut: true }
            : num
        )
      );

      setCurrentNumber((prev) => prev + 1);

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
  }, [currentNumber, handleGameOver]);

  const startAutoPlay = useCallback(() => {
    const points = getPoints();

    autoPlayRef.current = setInterval(() => {
      if (currentNumber <= points) {
        handleNumberClick(currentNumber);
      } else {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      }
    }, 500);
  }, [handleNumberClick, currentNumber]);

  const handlePlay = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    initializeGame();
    setHasStarted(true);
    timerRef.current = setInterval(() => setTimer((prev) => prev + 0.1), 100);

    if (autoPlay) {
      startAutoPlay();
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay((prev) => !prev);
  };

  useEffect(() => {
    if (autoPlay && isPlaying && !gameOver) {
      startAutoPlay();
    } else {
      clearInterval(autoPlayRef.current as unknown as number);
    }
    return () => clearInterval(autoPlayRef.current as unknown as number);
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
    const fadeOutCount = numbers.filter(num => num.fadeOut).length;

    if (fadeOutCount > 0) {
      const fadeOutTimeout = setTimeout(() => {
        setNumbers((prevNumbers) => prevNumbers.filter((num) => !num.fadeOut));
      }, 1000);

      return () => clearTimeout(fadeOutTimeout);
    }
  }, [numbers]);

  useEffect(() => {
    const points = getPoints();

    if (isPlaying && points > 0 && currentNumber > points) {
      setTimeout(() => {
        handleGameOver('ALL CLEARED');
      }, 500);
    }
  }, [currentNumber, handleGameOver, isPlaying]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current as unknown as number);
      clearInterval(autoPlayRef.current as unknown as number);
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
            ref={pointsRef}
            defaultValue="5"
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
            {autoPlay ? 'Auto Play OFF' : 'Auto Play ON'}
          </button>
        )}
      </div>
      <div className='frame'>
        {numbers.map(({ value, top, left, countdown, clicked, fadeOut }) => (
          <div
            key={value}
            onClick={() => isPlaying && handleNumberClick(value)}
            className={`number-container ${clicked ? 'clicked' : ''} ${fadeOut ? 'fade-out' : ''}`}
            style={{ top, left, zIndex: getPoints() - value }}
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
      {!gameOver && hasStarted && (
        <div className="next-number">
          <p>Next: {currentNumber}</p>
        </div>
      )}
    </div>
  );
};

export default App;