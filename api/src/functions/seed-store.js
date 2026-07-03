import createId from '#src/functions/create-id.js';

const badgePool = [
  { children: '⚡' },
  { children: '🔥' },
  { children: '💀' },
  { children: '🌟' },
  { children: '🎯' },
  { children: '🐉' },
  { children: '👻' },
  { children: '🦅' },
  { children: '💎' },
  { children: '🍀' }
];

const avatarEffectPool = [
  { borderColor: 'red', borderStyle: 'solid', borderWidth: 3 },
  { borderColor: 'gold', borderStyle: 'solid', borderWidth: 3 },
  { borderColor: 'cyan', borderStyle: 'dashed', borderWidth: 2 },
  { borderColor: 'magenta', borderStyle: 'double', borderWidth: 4 },
  { borderColor: 'limegreen', borderStyle: 'solid', borderWidth: 3 },
  { borderColor: 'orange', borderStyle: 'solid', borderWidth: 3 },
  { borderColor: 'purple', borderStyle: 'dotted', borderWidth: 3 },
  { borderColor: 'deepskyblue', borderStyle: 'solid', borderWidth: 3 }
];

const badgeNames = [
  'Lightning',
  'Inferno',
  'Skull',
  'Superstar',
  'Bullseye',
  'Dragon',
  'Phantom',
  'Eagle',
  'Diamond',
  'Lucky'
];

const effectNames = [
  'Red Glow',
  'Gold Frame',
  'Cyan Dash',
  'Magenta Double',
  'Lime Surge',
  'Orange Blaze',
  'Purple Dots',
  'Sky Blue'
];

const randPrice = (min, max) =>
  Math.round((min + Math.random() * (max - min)) / 50) * 50;

export default async load => {
  const existingItems = await load.tx.select('name').from('items');
  const existingNames = new Set(existingItems.map(i => i.name));

  const newItems = [];

  for (let i = 0; i < badgePool.length; i++) {
    const name = `${badgeNames[i]} Badge`;
    if (!existingNames.has(name)) {
      newItems.push({
        id: createId(),
        attributes: badgePool[i],
        isForSale: true,
        name,
        price: randPrice(3_000, 8_000),
        type: 'badge',
        createdAt: new Date()
      });
    }
  }

  for (let i = 0; i < avatarEffectPool.length; i++) {
    const name = `${effectNames[i]} Border`;
    if (!existingNames.has(name)) {
      newItems.push({
        id: createId(),
        attributes: avatarEffectPool[i],
        isForSale: true,
        name,
        price: randPrice(8_000, 15_000),
        type: 'avatarEffect',
        createdAt: new Date()
      });
    }
  }

  if (newItems.length > 0) {
    await load.tx.insert(newItems).into('items');
  }

  return newItems.length;
};
