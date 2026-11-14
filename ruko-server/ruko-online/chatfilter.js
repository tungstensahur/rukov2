// Chat filter shared by the site chat, the in-game chat and direct messages.
// A message that trips the filter is never stored and never reaches anyone else: the sender gets
// {ok:1,filtered:1} back and their own client shows "Your message was filtered." to them alone.
//
// Matching is forgiving on purpose. Before comparing, text is lowercased, accents and invisible
// characters are dropped, lookalike letters (Cyrillic/Greek) and leetspeak digits are folded back
// to plain letters, and repeated letters are squashed ("fuuuck" -> "fuck"). Words are compared as
// whole words with a short list of common endings, so "class", "pass", "assassin", "grass",
// "cockpit" and "kill" all stay allowed.
const WORDS=[
 'fuck','fucked','fucker','fuckers','fucking','motherfucker','shit','shitty','bullshit','bitch',
 'bitches','bastard','bastards','asshole','assholes','dick','dicks','dickhead','cock','pussy',
 'cunt','whore','slut','retard','retarded','faggot','fag','nigger','nigga','kike','spic','chink',
 'wetback','tranny','nazi','hitler','porn','porno','nude','nudes','penis','vagina','boobs','tits',
 'cum','jizz','rape','raped','rapist','kys','sex','sexting','anal','orgasm','masturbate','incest',
 'pedo','pedophile','blowjob','handjob','dumbass','jackass','dipshit'
];
// "shiiit" and "shit" should match, so both sides of the comparison are squashed the same way.
const loose=w=>w.replace(/(.)\1+/g,'$1');
const BAD=new Set(WORDS.map(loose));
const SUF=['s','es','ed','ing','er','ers','y','ies','in'];
const HOMO={'\u0430':'a','\u0435':'e','\u043e':'o','\u0440':'p','\u0441':'c','\u0443':'y','\u0445':'x','\u0456':'i','\u0455':'s','\u03b1':'a','\u03b5':'e','\u03bf':'o','\u03c1':'p','\u03c4':'t','\u03c5':'u','\u03c7':'x','\u03bd':'v','\u03ba':'k','\u03b9':'i'};
const LEET={'0':'o','1':'i','3':'e','4':'a','5':'s','6':'g','7':'t','8':'b','9':'g','@':'a','$':'s','|':'i','!':'i'};

function norm(s){
 return String(s==null?'':s).toLowerCase().normalize('NFKD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[\u200b-\u200f\u2060\ufeff]/g,'')
  .replace(/[^\x00-\x7f]/g,c=>HOMO[c]||c)
  .replace(/[0-9@$|!]/g,c=>LEET[c]||c);
}
function hit(t){
 if(!t)return false;
 for(const w of [t,loose(t)]){
  if(BAD.has(w))return true;
  for(const suf of SUF)if(w.length>suf.length+2&&w.endsWith(suf)&&BAD.has(w.slice(0,-suf.length)))return true;
 }
 return false;
}
// True when the message should be withheld.
function blocked(text){
 const toks=norm(text).split(/[^a-z]+/).filter(Boolean);
 for(const t of toks)if(hit(t))return true;
 // Letters spelled out one by one: "f u c k", "s-h-i-t".
 let run=[];
 for(const t of toks.concat([''])){
  if(t.length===1){run.push(t);continue}
  if(run.length>=3&&hit(run.join('')))return true;
  run=[];
 }
 return false;
}
module.exports={blocked};
