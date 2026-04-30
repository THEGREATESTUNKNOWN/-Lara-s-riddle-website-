import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { getPuzzleHint } from '../../services/gemini';
import { updateHighScore } from '../../services/firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  Settings, 
  Play, 
  Lightbulb, 
  Timer, 
  Trophy,
  RotateCcw,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { cn, formatTime, shuffleArray } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface Piece {
  id: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  imageBlob: string;
}

const GRID_SIZES = [
  { label: '3x3 (Easy)', value: 3 },
  { label: '4x4 (Medium)', value: 4 },
  { label: '6x6 (Hard)', value: 6 },
  { label: '10x10 (Expert)', value: 10 },
];

export function PuzzleGame({ initialImage }: { initialImage?: string }) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [gridSize, setGridSize] = useState(3);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [gameState, setGameState] = useState<'upload' | 'playing' | 'won'>('upload');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialLoadRef = useRef<string | null>(null);
  const [isAutoStarting, setIsAutoStarting] = useState(false);

  const startGameWithImage = useCallback((imageUrl: string) => {
    if (isAutoStarting) return;
    setIsAutoStarting(true);
    
    // Create pieces
    const img = new Image();
    img.crossOrigin = "anonymous"; 
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      
      // Ensure we have a valid source image size
      const sourceWidth = img.width;
      const sourceHeight = img.height;
      
      const pieceSize = Math.floor(600 / gridSize);
      canvas.width = pieceSize;
      canvas.height = pieceSize;

      const newPieces: Piece[] = [];
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          ctx.clearRect(0, 0, pieceSize, pieceSize);
          ctx.drawImage(
            img, 
            (x * sourceWidth) / gridSize, 
            (y * sourceHeight) / gridSize, 
            sourceWidth / gridSize, 
            sourceHeight / gridSize, 
            0, 0, pieceSize, pieceSize
          );
          
          newPieces.push({
            id: y * gridSize + x,
            correctX: x,
            correctY: y,
            currentX: -1,
            currentY: -1,
            imageBlob: canvas.toDataURL('image/png')
          });
        }
      }

      const positions = [];
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          positions.push({ x, y });
        }
      }
      const shuffledPositions = shuffleArray(positions);
      
      newPieces.forEach((p, i) => {
        p.currentX = shuffledPositions[i].x;
        p.currentY = shuffledPositions[i].y;
      });

      setPieces(newPieces);
      setGameState('playing');
      setScore(0);
      setTimeLeft(0);
      setIsAutoStarting(false);
      startTimeRef.current = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    };

    img.onerror = () => {
      setIsAutoStarting(false);
      console.error("Image loading failed:", imageUrl);
      toast.error("Failed to load image. This might be due to CORS issues. Try another image!");
    };

    img.src = imageUrl;
  }, [gridSize]); // Removed isAutoStarting dependency

  useEffect(() => {
    if (initialImage) {
      if (initialLoadRef.current !== initialImage) {
        initialLoadRef.current = initialImage;
        setImage(initialImage);
        // Add a small delay to ensure cleanup from previous games is complete
        const timer = setTimeout(() => {
          startGameWithImage(initialImage);
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset only if we were previously in a daily puzzle
      if (initialLoadRef.current) {
        initialLoadRef.current = null;
        setImage(null);
        setGameState('upload');
        setPieces([]);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  }, [initialImage, startGameWithImage]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const startGame = async () => {
    if (!image) return;
    startGameWithImage(image);
  };

  const handleMove = (pieceId: number, targetX: number, targetY: number) => {
    // Find piece at target
    const targetPiece = pieces.find(p => p.currentX === targetX && p.currentY === targetY);
    if (!targetPiece) return;

    const sourcePiece = pieces.find(p => p.id === pieceId)!;
    
    const newPieces = pieces.map(p => {
      if (p.id === sourcePiece.id) return { ...p, currentX: targetX, currentY: targetY };
      if (p.id === targetPiece.id) return { ...p, currentX: sourcePiece.currentX, currentY: sourcePiece.currentY };
      return p;
    });

    setPieces(newPieces);
    checkWin(newPieces);
  };

  const checkWin = (currentPieces: Piece[]) => {
    const isWon = currentPieces.every(p => p.currentX === p.correctX && p.currentY === p.correctY);
    if (isWon) {
      if (timerRef.current) clearInterval(timerRef.current);
      setGameState('won');
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      const finalScore = Math.max(0, (gridSize * gridSize * 100) - timeLeft);
      setScore(finalScore);
      if (user?.uid) updateHighScore(user.uid, 'puzzle', finalScore);
    }
  };

  const requestHint = async () => {
    setLoadingHint(true);
    try {
      const hintText = await getPuzzleHint("An uploaded image", "User is moving pieces around");
      setHint(hintText);
    } catch (error) {
      setHint("Focus on the colors and patterns that match the edges!");
    } finally {
      setLoadingHint(false);
    }
  };

  if (gameState === 'upload' || isAutoStarting) {
    return (
      <div className="max-w-xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 text-center">
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
          {isAutoStarting ? "Preparing Daily Challenge..." : "Puzzle Playground"}
        </h2>
        
        {isAutoStarting ? (
          <div className="card-pastel p-12 flex flex-col items-center justify-center gap-6">
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
            <p className="text-slate-500 font-medium">Slicing the masterpiece into pieces...</p>
          </div>
        ) : (
          <div className="card-pastel p-8 space-y-8">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer group",
              isDragActive ? "border-pink-400 bg-pink-50/50" : "border-slate-200 hover:border-pink-300 hover:bg-slate-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-pink-500" />
            </div>
            {image ? (
              <div className="flex items-center justify-center gap-2 text-pink-600 font-medium">
                <ImageIcon className="w-4 h-4" />
                Image Selected! Change?
              </div>
            ) : (
              <p className="text-slate-600 font-medium">
                Drag & drop an image, or click to browse
              </p>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Puzzle Complexity
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GRID_SIZES.map(s => (
                <button 
                  key={s.value}
                  onClick={() => setGridSize(s.value)}
                  className={cn(
                    "py-3 px-4 rounded-xl text-sm font-medium border transition-all",
                    gridSize === s.value 
                      ? "bg-blue-pastel border-blue-300 text-blue-900 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-200"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!image}
            onClick={startGame}
            className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Create Puzzle
          </button>
        </div>
        )}
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="card-pastel max-w-md mx-auto mt-12 text-center animate-in scale-in-95">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-pink-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Masterpiece Restored!</h2>
        <div className="text-5xl font-bold text-blue-600 mb-2">{score}</div>
        <p className="text-slate-500 mb-8">Solved in {formatTime(timeLeft)}</p>
        <button 
          onClick={() => setGameState('upload')}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Play Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="card-pastel py-2 px-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-500" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => setGameState('upload')}
            className="btn-secondary px-4 text-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>

        <div 
          className="grid gap-0.5 bg-slate-200 border-2 border-slate-200 rounded-lg overflow-hidden shadow-2xl mx-auto"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: 'min(90vw, 600px)',
            aspectRatio: '1/1'
          }}
        >
          {pieces.sort((a, b) => (a.currentY * gridSize + a.currentX) - (b.currentY * gridSize + b.currentX)).map((piece) => (
            <motion.div
              layout
              key={piece.id}
              className="relative cursor-pointer group"
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(e, info) => {
                // Determine which slot was dragged to
                // Simplification for now: we just swap with neighbors or similar
                // For a 600px container, each piece is 600 / gridSize
                const pieceSize = 600 / gridSize;
                const moveX = Math.round(info.offset.x / pieceSize);
                const moveY = Math.round(info.offset.y / pieceSize);
                
                if (moveX !== 0 || moveY !== 0) {
                  const targetX = Math.max(0, Math.min(gridSize - 1, piece.currentX + moveX));
                  const targetY = Math.max(0, Math.min(gridSize - 1, piece.currentY + moveY));
                  handleMove(piece.id, targetX, targetY);
                }
              }}
            >
              <img 
                src={piece.imageBlob} 
                alt="piece" 
                className="w-full h-full object-cover select-none pointer-events-none"
              />
              <div className="absolute inset-0 border border-white/20 group-hover:bg-white/10 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-64 space-y-6">
        <div className="card-pastel p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            AI Assistant
          </h3>
          <p className="text-sm text-slate-600 mb-4 italic min-h-[60px]">
            {hint || "Stuck? Ask me for a hint!"}
          </p>
          <button 
            disabled={loadingHint}
            onClick={requestHint}
            className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
          >
            {loadingHint ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Hint"}
          </button>
        </div>

        <div className="card-pastel p-4">
          <h3 className="font-bold mb-3">Original Image</h3>
          <img src={image!} alt="original" className="w-full aspect-square object-cover rounded-lg opacity-40 hover:opacity-100 transition-opacity cursor-zoom-in" />
        </div>
      </div>
    </div>
  );
}
