import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

type GameMode = 'falling' | 'puzzle' | 'speed' | 'all'
type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time'

interface LeaderboardEntryAttributes {
  id: string
  userId: string
  username: string
  avatar?: string
  score: number
  gameMode: GameMode
  period: LeaderboardPeriod
  date: Date
}

interface LeaderboardEntryCreationAttributes extends Optional<LeaderboardEntryAttributes, 'id' | 'date'> {}

class LeaderboardEntry extends Model<LeaderboardEntryAttributes, LeaderboardEntryCreationAttributes>
  implements LeaderboardEntryAttributes
{
  public id!: string
  public userId!: string
  public username!: string
  public avatar?: string
  public score!: number
  public gameMode!: GameMode
  public period!: LeaderboardPeriod
  public date!: Date

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

LeaderboardEntry.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    gameMode: {
      type: DataTypes.ENUM('falling', 'puzzle', 'speed', 'all'),
      allowNull: false,
      defaultValue: 'all',
    },
    period: {
      type: DataTypes.ENUM('daily', 'weekly', 'all_time'),
      allowNull: false,
      defaultValue: 'all_time',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'LeaderboardEntry',
    tableName: 'leaderboard_entries',
    indexes: [
      { fields: ['gameMode', 'period', 'score'] },
      { fields: ['userId'] },
      { fields: ['date'] },
    ],
  }
)

export default LeaderboardEntry
