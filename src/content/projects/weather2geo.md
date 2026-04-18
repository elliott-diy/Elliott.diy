---
title: 'Weather2Geo'
description: 'An OSINT tool for geolocating screenshots using weather widget data.'
pubDate: 'May 29 2025'
tags: ['osint', 'python', 'geolocation']
---

This one started as a dumb idea I had after seeing way too many screenshots with the Windows weather widget still visible, usually from cybercriminals on Telegram who claim they have amazing opsec. They almost always include the current temperature, condition, and local time - which turns out to be just specific enough to geolocate if you check against live data.

Weather2Geo pulls real-time weather from the same backend the Windows widget uses and compares it to thousands of cities. It’s timezone-aware, supports temp fuzziness, and clusters close matches together so you’re not stuck digging through random noise.

It’s been useful for a few things already and ended up on the front page of Hacker News, which was a surprise. If you’re curious or want to mess with it, it’s all open source:

[GitHub – elliott-diy/Weather2Geo](https://github.com/elliott-diy/Weather2Geo)

I might add historical data support later, or let people crowdsource their runs to cache weather states over time. If you’ve got ideas or feedback, I’m all ears!
