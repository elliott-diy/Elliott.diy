---
title: 'CTF & Challenge Design'
description: "Custom CTF's and challenges I've built for clubs, community events, and online competitions."
pubDate: 'May 18 2025'
tags: ['ctf', 'school', 'infosec']
---

I write CTF challenges for fun, sometimes for our local cybersecurity club or random online events I get pulled into. Most of them are short, kind of funky, and meant to teach something real without wasting tons of time. A big focus of mine is to highlight the research side of things. Most of these will send you off Googling weird docs, looking at real-world techniques, or poking at old tools to figure out what's actually going on.



They cover a bunch of areas: web, reverse engineering, OSINT, crypto and occasionally hardware or whatever else seems interesting at the time. 

Below are a few of the ones I've built, along with their source code. If you've played one of these before and it was fun, or if you have any suggestions for new ones, please let me know! I'm always looking for new ideas and feedback. If you want a full list of the challenges I've made, you can stalk my [GitHub](https://github.com/elliott-diy) :)


| Challenge Name                                                    | Category            | Difficulty | Description                     |
|-------------------------------------------------------------------|---------------------|------------|---------------------------------|
| [16ByteChallenge](https://github.com/elliott-diy/16ByteChallenge) | Reverse Engineering | Easy       | Brute a Go binary’s hash logic. |
| [CryptoChallenge](https://github.com/elliott-diy/CryptoChallenge) | Cryptography        | Medium     | Predict AES key from seed.      |
| [PayloadOrPerish](https://lemonyte.com/challenges/exec)           | Reverse Engineering | Hard       | Constrained input -> code exec. |
| [HashHunter](https://solve.whcc.club/favicon)                     | OSINT               | Easy       | Trace a server by favicon hash. |

(This table is scrollable on mobile, so you can swipe left/right to see all the columns.)

I've got a few more challenges in the works, some around firmware, bypassing techniques, and industrial protocols. They'll be added here once I get around to finishing them.

Also, I know I'm behind on writeups - sorry about that. Most of these will get proper walkthroughs soon, I just haven't had the time (or motivation) to sit down and write everything out yet.

That said, a lot of these had more detailed instructions or context during the competitions they were used in. If you're stuck on one or just curious, feel free to DM me on Discord. I can usually dig up the original docs or give you a hint.

Huge thanks to [@Lemonyte](https://lemonyte.com/) for helping with the design and build of the PayloadOrPerish challenge (and now hosting as WHCC seems to be down). They are an actual Python wizard. 