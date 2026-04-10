import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, RefreshCw } from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS = [
  {
    id: 1,
    title: "Neon Nights",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/100/100?blur=2"
  },
  {
    id: 2,
    title: "Digital Horizon",
    artist: "Neural Network",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/100/100?blur=2"
  },
  {
    id: 3,
    title: "Quantum Drift",
    artist: "AlgoRhythm",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/100/100?blur=2"
  }
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex, isPlaying, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentTrackIndex]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const lastDirectionRef = useRef(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsGameRunning(true);
    generateFood();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!isGameRunning && !gameOver && (e.key === "Enter" || e.key === " ")) {
        setIsGameRunning(true);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (lastDirectionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
          if (lastDirectionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
          if (lastDirectionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
          if (lastDirectionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameRunning, gameOver]);

  useEffect(() => {
    if (!isGameRunning || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        lastDirectionRef.current = direction;

        // Check collision with walls
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        // Check collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setIsGameRunning(false);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check if food eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [direction, food, gameOver, isGameRunning, generateFood]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col relative selection:bg-fuchsia-500/30">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)]">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Neon Snake
            </h1>
            <p className="text-xs text-fuchsia-200/60 uppercase tracking-[0.2em]">Synthwave Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          <span className="text-sm text-cyan-200/70 uppercase tracking-widest">Score</span>
          <span className="font-mono text-2xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            {score.toString().padStart(4, '0')}
          </span>
        </div>
      </header>

      {/* Main Content - Game Board */}
      <main className="flex-1 flex items-center justify-center relative z-10 p-4">
        <div className="relative group">
          {/* Game Board Border Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          
          <div 
            className="relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
            style={{ 
              width: GRID_SIZE * 20, 
              height: GRID_SIZE * 20,
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className="absolute rounded-sm"
                  style={{
                    left: segment.x * 20,
                    top: segment.y * 20,
                    width: 20,
                    height: 20,
                    backgroundColor: isHead ? '#d946ef' : '#a21caf',
                    boxShadow: isHead ? '0 0 15px #d946ef' : '0 0 8px #a21caf',
                    transform: 'scale(0.9)'
                  }}
                />
              );
            })}

            {/* Food */}
            <div
              className="absolute rounded-full"
              style={{
                left: food.x * 20,
                top: food.y * 20,
                width: 20,
                height: 20,
                backgroundColor: '#22d3ee',
                boxShadow: '0 0 15px #22d3ee, 0 0 30px #22d3ee',
                transform: 'scale(0.8)'
              }}
            />

            {/* Overlays */}
            {!isGameRunning && !gameOver && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                <h2 className="text-3xl font-bold text-white mb-4 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">Ready?</h2>
                <button 
                  onClick={() => setIsGameRunning(true)}
                  className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-full uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] hover:scale-105 cursor-pointer"
                >
                  Start Game
                </button>
                <p className="mt-6 text-sm text-white/50 font-mono">Use Arrow Keys or WASD</p>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center">
                <h2 className="text-4xl font-bold text-red-500 mb-2 tracking-widest uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">Game Over</h2>
                <p className="text-xl text-cyan-300 mb-8 font-mono">Final Score: {score}</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:shadow-[0_0_30px_rgba(8,145,178,0.8)] hover:scale-105 cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5" />
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Music Player */}
      <footer className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 md:p-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <div className="relative w-14 h-14 rounded-md overflow-hidden border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0">
              <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              {isPlaying && (
                <div className="absolute inset-0 bg-fuchsia-500/20 mix-blend-overlay animate-pulse" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-white truncate drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{currentTrack.title}</span>
              <span className="text-xs text-cyan-300/80 uppercase tracking-wider truncate">{currentTrack.artist}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
            <div className="flex items-center gap-6">
              <button onClick={prevTrack} className="text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all cursor-pointer">
                <SkipBack className="w-6 h-6" />
              </button>
              <button 
                onClick={togglePlay} 
                className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6 ml-1" fill="currentColor" />}
              </button>
              <button onClick={nextTrack} className="text-white/60 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all cursor-pointer">
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
            
            {/* Real Progress Bar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] text-white/40 font-mono w-8 text-right">{formatTime(progress)}</span>
              <div 
                className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
                onClick={(e) => {
                  if (audioRef.current && duration) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = (clickX / rect.width) * duration;
                    audioRef.current.currentTime = newTime;
                    setProgress(newTime);
                  }
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 group-hover:brightness-125 transition-all" 
                  style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} 
                />
              </div>
              <span className="text-[10px] text-white/40 font-mono w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume / Extra */}
          <div className="hidden md:flex items-center justify-end gap-3 w-1/3">
            <Volume2 className="w-5 h-5 text-white/50" />
            <div 
              className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newVol = Math.max(0, Math.min(1, clickX / rect.width));
                setVolume(newVol);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] group-hover:brightness-125 transition-all" 
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
        loop={false}
      />
    </div>
  );
}

