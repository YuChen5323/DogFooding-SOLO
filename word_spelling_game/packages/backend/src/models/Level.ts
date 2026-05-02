import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

interface LevelAttributes {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  difficulty: number
  category: string
  wordIds: string[]
  wordCount: number
  timeLimit: number
  order: number
}

interface LevelCreationAttributes extends Optional<LevelAttributes, 'id' | 'wordIds' | 'timeLimit' | 'order'> {}

class Level extends Model<LevelAttributes, LevelCreationAttributes> implements LevelAttributes {
  public id!: string
  public name!: Record<string, string>
  public description!: Record<string, string>
  public difficulty!: number
  public category!: string
  public wordIds!: string[]
  public wordCount!: number
  public timeLimit!: number
  public order!: number

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Level.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    description: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    difficulty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5,
      },
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'beginner',
    },
    wordIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      defaultValue: [],
    },
    wordCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
      },
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
      validate: {
        min: 30,
      },
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Level',
    tableName: 'levels',
    indexes: [
      { fields: ['category'] },
      { fields: ['difficulty'] },
      { fields: ['order'] },
    ],
  }
)

export default Level
