// Talking: short written exchanges with the people of the road, picked for who they are, where you are and the
// time of day, each with a few replies. Pure, so the lines can be tested. Names are given by index, so the same
// person keeps the same name in the same town.
const NAMES = ['Ada', 'Tom', 'Priya', 'Lewis', 'Mira', 'Jonah', 'Elif', 'Sam', 'Noor', 'Ben', 'Lena', 'Omar', 'Rosa', 'Felix', 'Hana', 'Idris', 'Maya', 'Kai', 'Zara', 'Theo', 'Ines', 'Yusuf', 'Clara', 'Nabil'];
export function nameFor(index, salt = 0) { return NAMES[Math.abs(Math.floor(index + salt * 7)) % NAMES.length]; }

const timeWord = (hour) => hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
const greet = (hour) => ({night: 'Late one, isn’t it.', morning: 'Morning!', afternoon: 'Afternoon.', evening: 'Evening.'})[timeWord(hour)];

// The opening line and replies for a context: {kind, name, shop, town, place, hour, rain, money, dented, dirty, lowFuel, bag}.
export function conversation(c) {
  const hour = c.hour ?? 12, who = c.name || 'Stranger', weather = c.rain > .2 ? 'Filthy weather for it.' : hour >= 21 || hour < 5 ? 'Quiet at this hour.' : 'Nice day for a drive.';
  const say = (line, replies) => ({name: who, line, replies});
  const bye = {text: 'See you.', reply: 'Mind how you go.'};
  if (c.kind === 'keeper') {
    const shop = c.shop || 'SHOP';
    if (shop === 'PETROL STATION') return say(`${greet(hour)} Fuel, a wash, or something from the shop?`, [
      c.dented ? {text: 'Can you beat out these dents?', reply: 'Give me ten minutes with the panels.', effect: 'repair', price: 8} : {text: 'How far to the next town?', reply: 'Follow the signs. You’ll see it from the hill.'},
      c.dirty ? {text: 'A wash, please.', reply: 'Pull round the side when you’re ready.', effect: 'wash', price: 4} : {text: 'Busy today?', reply: 'Steady. The coaches keep us going.'},
      bye]);
    if (/CAF|TEA|BAKERY/.test(shop)) return say(`${greet(hour)} Take a seat anywhere. ${weather}`, [{text: 'What’s good today?', reply: /BAKERY/.test(shop) ? 'The bread came out an hour ago. Still warm.' : 'The cake. Always the cake.'}, {text: 'Any news round here?', reply: c.town ? `Not much happens in ${c.town}. That’s the charm.` : 'The road’s the news. Everyone’s passing through.'}, bye]);
    if (shop === 'BARBER') return say(`${greet(hour)} Sit down, we’ll sort that out.`, [{text: 'Just a trim.', reply: 'Just a trim it is.', effect: 'haircut', price: 8}, {text: 'How long have you been here?', reply: 'Thirty years. Cut half the town’s hair.'}, bye]);
    if (shop === 'HARDWARE') return say(`${greet(hour)} If we haven’t got it, you don’t need it.`, [{text: 'I keep running out of fuel.', reply: 'Carry a can. Twelve coins, on the shelf there.'}, {text: 'Any tips for the mountain road?', reply: 'Low gear going down, and don’t trust the fog.'}, bye]);
    if (shop === 'BOOKS & CO') return say(`${greet(hour)} Looking for anything in particular?`, [{text: 'Something for the road.', reply: 'Paperbacks are by the window. Five coins.'}, {text: 'Is there a map of the roads?', reply: 'There is. People keep buying it and keep coming back lost.'}, bye]);
    return say(`${greet(hour)} ${weather} Let me know if you need anything.`, [{text: 'Just looking, thanks.', reply: 'Take your time.'}, {text: 'How do I get to the coast?', reply: 'Keep taking the signposted ways. One of them always leads to the sea.'}, bye]);
  }
  if (c.kind === 'fisherman') return say(`${greet(hour)} Nothing biting yet.`, [{text: 'What do you catch here?', reply: 'Snapper, mostly. Barramundi if you’re lucky. There’s a wreck out there they like.'}, {text: 'A wreck?', reply: 'Old coaster. Went down in a storm years back. You can see the boards if the water’s clear.'}, bye]);
  if (c.kind === 'mechanic') return say(`${greet(hour)} That yours? ${c.dented ? 'Looks like it’s had a knock.' : 'Lovely thing.'}`, [c.dented ? {text: 'Can you fix it?', reply: 'Leave it with me. Eight coins.', effect: 'repair', price: 8} : {text: 'Runs well.', reply: 'Keep it that way.'}, bye]);
  // A passer-by in town.
  const lines = [[`${greet(hour)} ${weather}`, [{text: 'It is.', reply: 'Enjoy it while it lasts.'}, {text: 'Which way to the shops?', reply: 'All along here. The café’s the best of them.'}, bye]],
    ['You’re not from round here.', [{text: 'Just driving through.', reply: c.town ? `Everyone is. ${c.town}’s on the way to everywhere.` : 'Everyone is.'}, {text: 'Is it far to the next town?', reply: 'Twenty minutes if the bus comes. Less in that car of yours.'}, bye]],
    ['Careful crossing here. They come round that bend quick.', [{text: 'Thanks for the warning.', reply: 'Lost a bicycle that way.'}, {text: 'Is there a crossing?', reply: 'By the lights. Press the button and wait.'}, bye]],
    [c.lowFuel ? 'You look like someone who needs the petrol station.' : 'Lovely evening for a walk.', [{text: c.lowFuel ? 'Where is it?' : 'It is.', reply: c.lowFuel ? 'Out past the end of town, on the right.' : 'Best time of day.'}, bye]]];
  const [line, replies] = lines[Math.abs(Math.floor((c.seed ?? 0) * 7919)) % lines.length];
  return say(line, replies);
}
