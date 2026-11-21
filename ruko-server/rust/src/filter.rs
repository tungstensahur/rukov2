// Chat filter, ported from chatfilter.js. Site chat, in-game chat, direct messages and
// usernames all go through here before anything is stored or sent to another player.
use std::collections::HashSet;
use unicode_normalization::UnicodeNormalization;

const WORDS: &[&str] = &[
    "fuck",
    "fucked",
    "fucker",
    "fuckers",
    "fucking",
    "motherfucker",
    "shit",
    "shitty",
    "bullshit",
    "bitch",
    "bitches",
    "bastard",
    "bastards",
    "asshole",
    "assholes",
    "dick",
    "dicks",
    "dickhead",
    "cock",
    "pussy",
    "cunt",
    "whore",
    "slut",
    "retard",
    "retarded",
    "faggot",
    "fag",
    "nigger",
    "nigga",
    "kike",
    "spic",
    "chink",
    "wetback",
    "tranny",
    "nazi",
    "hitler",
    "porn",
    "porno",
    "nude",
    "nudes",
    "penis",
    "vagina",
    "boobs",
    "tits",
    "cum",
    "jizz",
    "rape",
    "raped",
    "rapist",
    "kys",
    "sex",
    "sexting",
    "anal",
    "orgasm",
    "masturbate",
    "incest",
    "pedo",
    "pedophile",
    "blowjob",
    "handjob",
    "dumbass",
    "jackass",
    "dipshit",
];

const SUF: &[&str] = &["s", "es", "ed", "ing", "er", "ers", "y", "ies", "in"];

const SAFE: &[&str] = &[
    "grape",
    "drape",
    "scrape",
    "therapist",
    "sexton",
    "sussex",
    "analy",
    "canal",
    "analog",
    "banal",
    "cucumber",
    "cumul",
    "circum",
    "document",
    "peacock",
    "cockpit",
    "cockatoo",
    "hancock",
    "gamecock",
    "dickson",
    "dickens",
    "spice",
    "conspic",
    "assassin",
    "class",
    "grass",
    "passage",
    "massive",
    "bastion",
    "scunthorpe",
    "penistone",
];

fn loose(w: &str) -> String {
    let mut out = String::new();
    let mut prev = '\0';
    for c in w.chars() {
        if c != prev {
            out.push(c);
        }
        prev = c;
    }
    out
}

fn bad_set() -> HashSet<String> {
    WORDS.iter().map(|w| loose(w)).collect()
}

fn homo(c: char) -> char {
    match c {
        '\u{430}' => 'a',
        '\u{435}' => 'e',
        '\u{43e}' => 'o',
        '\u{440}' => 'p',
        '\u{441}' => 'c',
        '\u{443}' => 'y',
        '\u{445}' => 'x',
        '\u{456}' => 'i',
        '\u{455}' => 's',
        '\u{3b1}' => 'a',
        '\u{3b5}' => 'e',
        '\u{3bf}' => 'o',
        '\u{3c1}' => 'p',
        '\u{3c4}' => 't',
        '\u{3c5}' => 'u',
        '\u{3c7}' => 'x',
        '\u{3bd}' => 'v',
        '\u{3ba}' => 'k',
        '\u{3b9}' => 'i',
        _ => c,
    }
}

fn leet(c: char) -> char {
    match c {
        '0' => 'o',
        '1' => 'i',
        '3' => 'e',
        '4' => 'a',
        '5' => 's',
        '6' => 'g',
        '7' => 't',
        '8' => 'b',
        '9' => 'g',
        '@' => 'a',
        '$' => 's',
        '|' => 'i',
        '!' => 'i',
        _ => c,
    }
}

pub fn norm(input: &str) -> String {
    let lowered = input.to_lowercase();
    let decomposed: String = lowered.nfkd().collect();
    let mut out = String::with_capacity(decomposed.len());
    for c in decomposed.chars() {
        let cp = c as u32;
        if (0x300..=0x36f).contains(&cp)
            || (0x200b..=0x200f).contains(&cp)
            || cp == 0x2060
            || cp == 0xfeff
        {
            continue;
        }
        if cp > 0x7f {
            out.push(homo(c));
        } else {
            out.push(leet(c));
        }
    }
    out
}

fn hit(t: &str, bad: &HashSet<String>) -> bool {
    if t.is_empty() {
        return false;
    }
    let l = loose(t);
    for w in [t, l.as_str()] {
        if bad.contains(w) {
            return true;
        }
        for suf in SUF {
            if w.len() > suf.len() + 2 && w.ends_with(suf) {
                let head = &w[..w.len() - suf.len()];
                if bad.contains(head) {
                    return true;
                }
            }
        }
    }
    false
}

fn tokens(s: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    for c in s.chars() {
        if c.is_ascii_lowercase() {
            cur.push(c);
        } else if !cur.is_empty() {
            out.push(std::mem::take(&mut cur));
        }
    }
    if !cur.is_empty() {
        out.push(cur);
    }
    out
}

/// True when a message should be withheld.
pub fn blocked(text: &str) -> bool {
    let bad = bad_set();
    let toks = tokens(&norm(text));
    for t in &toks {
        if hit(t, &bad) {
            return true;
        }
    }
    let mut run: Vec<String> = Vec::new();
    let mut all = toks.clone();
    all.push(String::new());
    for t in all {
        if t.len() == 1 {
            run.push(t);
            continue;
        }
        if run.len() >= 3 && hit(&run.join(""), &bad) {
            return true;
        }
        run.clear();
    }
    false
}

/// Usernames are one glued-together word, so substrings are checked too.
pub fn name_blocked(name: &str) -> bool {
    let bad = bad_set();
    let glued: String = norm(name).chars().filter(|c| c.is_ascii_lowercase()).collect();
    if glued.is_empty() {
        return false;
    }
    let mut plain = glued;
    for safe in SAFE {
        plain = plain.replace(safe, "");
    }
    let soft = loose(&plain);
    for w in [plain.as_str(), soft.as_str()] {
        for b in &bad {
            if w.contains(b.as_str()) {
                return true;
            }
        }
    }
    false
}
