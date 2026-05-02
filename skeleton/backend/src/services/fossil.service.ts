import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fossil, FossilDocument } from '../schemas/fossil.schema';
import { BoneFragment } from '../schemas/bone-fragment.schema';

@Injectable()
export class FossilService {
  constructor(
    @InjectModel('Fossil') private fossilModel: Model<FossilDocument>,
  ) {}

  async findAll(): Promise<Fossil[]> {
    return this.fossilModel.find().populate('bones').exec();
  }

  async findById(id: string): Promise<Fossil> {
    return this.fossilModel.findById(id).populate('bones').exec();
  }

  async create(fossilData: Partial<Fossil>): Promise<Fossil> {
    const newFossil = new this.fossilModel(fossilData);
    return newFossil.save();
  }

  async initializeDefaultFossils(): Promise<void> {
    const existingFossils = await this.fossilModel.find().exec();
    if (existingFossils.length > 0) {
      return;
    }

    const defaultFossils = [
      {
        name: '霸王龙',
        species: 'Tyrannosaurus Rex',
        period: '白垩纪晚期',
        description: '地球上最大的陆地肉食性恐龙之一，拥有强大的下颚和牙齿。',
        difficulty: 5,
      },
      {
        name: '三角龙',
        species: 'Triceratops',
        period: '白垩纪晚期',
        description: '著名的角龙类，头部有三只角和大型颈盾。',
        difficulty: 3,
      },
      {
        name: '剑龙',
        species: 'Stegosaurus',
        period: '侏罗纪晚期',
        description: '以背部的骨板和尾部的骨刺著称的草食恐龙。',
        difficulty: 4,
      },
    ];

    for (const fossil of defaultFossils) {
      const newFossil = new this.fossilModel(fossil);
      await newFossil.save();
    }
  }
}
