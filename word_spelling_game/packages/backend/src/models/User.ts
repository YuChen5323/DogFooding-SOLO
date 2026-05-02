import { DataTypes, Model, Optional } from 'sequelize'
import sequelize from '../config/database'

interface UserAttributes {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
  level: number
  experience: number
  coins: number
  totalWordsLearned: number
  streak: number
  lastLogin?: Date
  friends: string[]
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'level' | 'experience' | 'coins' | 'totalWordsLearned' | 'streak' | 'friends'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string
  public username!: string
  public email!: string
  public password!: string
  public avatar?: string
  public level!: number
  public experience!: number
  public coins!: number
  public totalWordsLearned!: number
  public streak!: number
  public lastLogin?: Date
  public friends!: string[]

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  public toJSON(): Omit<UserAttributes, 'password'> {
    const values = Object.assign({}, this.get()) as Partial<UserAttributes>
    delete values.password
    return values as Omit<UserAttributes, 'password'>
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    coins: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalWordsLearned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    friends: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['username'] },
      { fields: ['level'] },
      { fields: ['experience'] },
    ],
  }
)

export default User
