import { Flame, TrendingUp, Trophy } from 'lucide-react';

interface EnergyStatsProps {
  totalEnergy: number;
}

export const EnergyStats = ({ totalEnergy }: EnergyStatsProps) => {
  // Calculate level based on energy (every 500 energy = 1 level)
  const level = Math.floor(totalEnergy / 500) + 1;
  const progressToNextLevel = (totalEnergy % 500) / 500 * 100;

  return (
    <div className="glass-card p-6">
      <h3 className="font-unbounded font-bold mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-primary" />
        Tus Puntos
      </h3>

      {/* Main Energy Display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-display font-bold text-gradient-primary">
          {totalEnergy.toLocaleString()}
        </div>
        <p className="text-sm text-muted-foreground">puntos</p>
      </div>

      {/* Level Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Nivel {level}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progressToNextLevel)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full energy-bar transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {500 - (totalEnergy % 500)} puntos para el siguiente nivel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background rounded-lg p-3 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Esta semana</p>
          <p className="font-bold text-sm">+{Math.min(totalEnergy, 150)}</p>
        </div>
        <div className="bg-background rounded-lg p-3 text-center">
          <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Ranking</p>
          <p className="font-bold text-sm">#--</p>
        </div>
      </div>
    </div>
  );
};
