import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

interface WordAttributes {
  id: string
  text: string
  pronunciation?: string
  translation: Record<string, string>
  difficulty: number
  category: string
  hints: string[]
}

interface WordCreationAttributes extends Optional<WordAttributes, 'id' | 'pronunciation' | 'hints'> {}

class Word extends Model<WordAttributes, WordCreationAttributes> implements WordAttributes {
  public id!: string
  public text!: string
  public pronunciation?: string
  public translation!: Record<string, string>
  public difficulty!: number
  public category!: string
  public hints!: string[]

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Word.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    pronunciation: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    translation: {
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
      defaultValue: 'general',
    },
    hints: {
      type: DataTypes.ARRAY(DataTypes.STRING(200)),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Word',
    tableName: 'words',
    indexes: [
      { unique: true, fields: ['text'] },
      { fields: ['difficulty'] },
      { fields: ['category'] },
    ],
  }
)

export default Word
