// Fictional exhibition clubs; the menu and match share one identity source.
export const CLUBS={
 red:{name:'Falcon FC',code:'FAL',crest:'F',shirt:'#a72739',shorts:'#932d3c',ink:'#ffffff'},
 blue:{name:'Atlas United',code:'ATU',crest:'A',shirt:'#1d4fb8',shorts:'#f2f2f2',ink:'#ffffff'},
 green:{name:'Emerald FC',code:'EMR',crest:'E',shirt:'#0f7a3e',shorts:'#1b1b1b',ink:'#ffffff'},
 white:{name:'Coastal FC',code:'COA',crest:'C',shirt:'#f2f2e4',shorts:'#172746',ink:'#172533'},
 capital:{name:'Capital SC',code:'CAP',crest:'CS',shirt:'#202633',shorts:'#171c26',ink:'#ffffff'}
};
export function fixture(kit){return [CLUBS[kit]||CLUBS.red,kit==='white'?CLUBS.capital:CLUBS.white];}
