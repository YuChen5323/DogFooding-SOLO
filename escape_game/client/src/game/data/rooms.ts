import { Room, Puzzle, DiaryEntry } from '../../types/game';

export const rooms: Record<string, Room> = {
  entrance: {
    id: 'entrance',
    name: '门厅',
    description: '你站在一座古老宅邸的门厅中。空气中弥漫着灰尘的气息，墙上的时钟已经停止转动。一扇厚重的木门通向大厅，壁炉旁有一个上锁的抽屉。',
    background: 'entrance_bg',
    exits: [
      {
        direction: '北',
        targetRoom: 'hall',
        position: { x: 380, y: 50, width: 80, height: 100 }
      }
    ],
    items: [],
    interactables: [
      {
        id: 'entrance_drawer',
        name: '壁炉抽屉',
        type: 'puzzle',
        position: { x: 150, y: 400, width: 100, height: 80 },
        puzzleId: 'entrance_padlock'
      },
      {
        id: 'entrance_clock',
        name: '古老时钟',
        type: 'diary',
        position: { x: 600, y: 150, width: 60, height: 100 }
      },
      {
        id: 'entrance_painting',
        name: '墙上的画',
        type: 'item',
        position: { x: 400, y: 200, width: 120, height: 80 },
        itemId: 'old_photo'
      }
    ]
  },
  hall: {
    id: 'hall',
    name: '大厅',
    description: '宏伟的大厅中，水晶吊灯的光芒已经黯淡。两侧是通往其他房间的门。角落里有一个书架，上面落满了灰尘。',
    background: 'hall_bg',
    exits: [
      {
        direction: '南',
        targetRoom: 'entrance',
        position: { x: 380, y: 480, width: 80, height: 60 }
      },
      {
        direction: '西',
        targetRoom: 'library',
        position: { x: 50, y: 200, width: 60, height: 150 }
      },
      {
        direction: '东',
        targetRoom: 'study',
        position: { x: 720, y: 200, width: 60, height: 150 },
        locked: true,
        unlockItem: 'library_key'
      },
      {
        direction: '北',
        targetRoom: 'secret_room',
        position: { x: 380, y: 50, width: 80, height: 100 },
        locked: true,
        unlockCondition: 'secret_door_unlocked'
      }
    ],
    items: ['candle'],
    interactables: [
      {
        id: 'hall_bookshelf',
        name: '大书架',
        type: 'item',
        position: { x: 200, y: 150, width: 80, height: 200 },
        itemId: 'gear_silver'
      },
      {
        id: 'hall_chandelier',
        name: '水晶吊灯',
        type: 'diary',
        position: { x: 380, y: 80, width: 100, height: 80 }
      },
      {
        id: 'hall_vase',
        name: '瓷花瓶',
        type: 'item',
        position: { x: 600, y: 400, width: 60, height: 80 },
        itemId: 'diary_page'
      }
    ]
  },
  library: {
    id: 'library',
    name: '书房',
    description: '书架从地板延伸到天花板，无数书籍在黑暗中沉睡。书桌上有一盏未点亮的台灯，旁边放着一把精致的钥匙。',
    background: 'library_bg',
    exits: [
      {
        direction: '东',
        targetRoom: 'hall',
        position: { x: 720, y: 200, width: 60, height: 150 }
      }
    ],
    items: [],
    interactables: [
      {
        id: 'library_desk',
        name: '书桌',
        type: 'puzzle',
        position: { x: 300, y: 350, width: 200, height: 100 },
        puzzleId: 'library_combination'
      },
      {
        id: 'library_key_spot',
        name: '钥匙',
        type: 'item',
        position: { x: 550, y: 380, width: 40, height: 40 },
        itemId: 'library_key'
      },
      {
        id: 'library_magic_book',
        name: '神秘书籍',
        type: 'diary',
        position: { x: 100, y: 200, width: 60, height: 80 }
      }
    ]
  },
  study: {
    id: 'study',
    name: '密室',
    description: '这是一间隐藏的密室，墙上挂满了神秘的符号。房间中央有一个巨大的机关装置，似乎缺少某个关键部件。',
    background: 'study_bg',
    exits: [
      {
        direction: '西',
        targetRoom: 'hall',
        position: { x: 50, y: 200, width: 60, height: 150 }
      }
    ],
    items: [],
    interactables: [
      {
        id: 'study_mechanism',
        name: '古老机关',
        type: 'puzzle',
        position: { x: 300, y: 250, width: 200, height: 150 },
        puzzleId: 'study_mechanism_puzzle'
      },
      {
        id: 'study_safe',
        name: '保险箱',
        type: 'puzzle',
        position: { x: 600, y: 400, width: 100, height: 80 },
        puzzleId: 'study_safe',
        flags: 'mechanism_activated'
      },
      {
        id: 'study_symbols',
        name: '墙上符号',
        type: 'diary',
        position: { x: 100, y: 150, width: 80, height: 150 }
      }
    ]
  },
  secret_room: {
    id: 'secret_room',
    name: '秘密房间',
    description: '你找到了传说中的秘密房间！房间中央有一个发光的祭坛，上面放着一个古老的护符。这一定就是离开这里的关键...',
    background: 'secret_room_bg',
    exits: [
      {
        direction: '南',
        targetRoom: 'hall',
        position: { x: 380, y: 480, width: 80, height: 60 }
      }
    ],
    items: [],
    interactables: [
      {
        id: 'altar',
        name: '神秘祭坛',
        type: 'item',
        position: { x: 350, y: 250, width: 100, height: 120 },
        itemId: 'ancient_amulet'
      },
      {
        id: 'exit_portal',
        name: '传送门',
        type: 'puzzle',
        position: { x: 350, y: 100, width: 100, height: 80 },
        puzzleId: 'final_portal',
        requiresItem: 'ancient_amulet'
      }
    ]
  }
};

export const puzzles: Record<string, Puzzle> = {
  entrance_padlock: {
    id: 'entrance_padlock',
    name: '挂锁',
    type: 'number_pad',
    solution: '1847',
    hint: '墙上的时钟显示着什么数字...',
    rewardItem: 'rusty_key',
    unlocksFlag: 'entrance_drawer_opened'
  },
  library_combination: {
    id: 'library_combination',
    name: '抽屉密码',
    type: 'combination_lock',
    solution: ['sun', 'moon'],
    hint: '日记页上写着："当月亮与太阳相遇..."',
    rewardItem: 'gear_gold',
    unlocksFlag: 'library_drawer_opened'
  },
  study_mechanism_puzzle: {
    id: 'study_mechanism_puzzle',
    name: '机关装置',
    type: 'sequence',
    solution: 'complete_mechanism',
    hint: '这个装置看起来需要完整的机关部件...',
    unlocksFlag: 'mechanism_activated'
  },
  study_safe: {
    id: 'study_safe',
    name: '保险箱',
    type: 'number_pad',
    solution: '666',
    hint: '墙上的符号似乎在暗示着什么数字...',
    rewardItem: 'broken_mirror',
    unlocksFlag: 'safe_opened'
  },
  final_portal: {
    id: 'final_portal',
    name: '最终传送门',
    type: 'sequence',
    solution: 'ancient_amulet',
    hint: '需要古老护符才能激活...',
    unlocksFlag: 'game_completed'
  }
};

export const diaryEntries: Record<string, DiaryEntry> = {
  entrance_clock: {
    id: 'entrance_clock',
    title: '关于时钟的笔记',
    content: '这座时钟是宅邸建造那年制作的。1847年，真是个遥远的年份。指针永远停在了那个时刻，仿佛在诉说着什么秘密...',
    discovered: false
  },
  hall_chandelier: {
    id: 'hall_chandelier',
    title: '家族记录',
    content: '这座宅邸属于一个古老的家族。传说他们守护着一件神秘的宝物，只有真正的智者才能找到它。宝物被藏在秘密房间中，需要解开所有机关才能进入。',
    discovered: false
  },
  library_magic_book: {
    id: 'library_magic_book',
    title: '神秘咒语',
    content: '"太阳与月亮，光明与黑暗。当两者合一，真相将显现。"\n\n这句话似乎在暗示着某种组合的密码...',
    discovered: false
  },
  study_symbols: {
    id: 'study_symbols',
    title: '古老符文',
    content: '墙上刻着神秘的符文。经过仔细观察，这些符号似乎对应着数字：\n\n☠️ = 6\n重复三次...\n\n也许这就是保险箱的密码？',
    discovered: false
  }
};
