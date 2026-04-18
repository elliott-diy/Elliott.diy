---
title: 'Lockbit Wallet Tracking'
description: 'Scanned 62k Bitcoin addresses from the LockBit ransomware leak to see which wallets were funded. Here’s what I found.'
pubDate: 'May 5 2025'
tags: ['lockbit', 'crypto', 'malware', 'ransomware']
heroImage: './images/lockbit-ransomware.jpg'
heroImageAlt: 'LockBit ransomware tracking article cover image'
---

So, in a strange and ironic turn of events, the Lockbit ransomware crew was hacked the other day, resulting in the leak of some of their internal tools. This data included about 62k bitcoin wallet addresses, used to receive ransom payments from victims as well. When I saw this going around, I noticed that this data was not categorized into funded and auto-generated wallets. Seeing this, I personally took the initiative to do so!

I figured it'd be pretty straightforward - just run through the list and check balances. It turns out that it was a bit more of a pain than I had expected. First off, I completely underestimated how many addresses 62,000 actually is. I briefly considered spinning up my own full Bitcoin node to make the queries faster, but the storage requirements alone were pushing 600GB, making it not worth it just to crunch a one-off dataset.

So I settled on using the Blockchair API. It mostly worked, but I had to send 62,000 individual requests because the batch endpoint was acting weird. Rate limits, retries, and some occasional nonsense later, I finally got through the whole list. If anyone knows a better (and free) API, please let me know!

After waiting around for around two hours filtering out the empty and invalid addresses, I ended up with a small set of wallets that were actually funded. Below is a table showing the top 20 - ranked by current balance, and damn, they're making bank.


| Address                                      | Balance (BTC) |
|----------------------------------------------|---------------|
| `bc1q5tanumnzxuhk0vxkmaqvhqgnq6sf0855trrmjw` | 4.2211 |
| `bc1qr0ynspq5aurj23xqw23uc5sd7xpw5qfy5y98ze` | 0.1294 |
| `bc1qmydvt6xz9rkw36yvw2qztgxexz8dp40pxgklhq` | 0.104 |
| `bc1q5xt7padm8nmytf8h048uaw6el2vdn0h8fj8ju4` | 0.09468 |
| `bc1qh7lptqnm4zzpvrqxumwtup82qq4htnn2qentxd` | 0.07192 |
| `bc1qx3e4eslyzhclzr4y4yexw3jhyw5n4xe4vakgvt` | 0.07191141 |
| `bc1q8980rpzy9f6meq8hur75ept62aug6dfrxnlwc0` | 0.05 |
| `bc1q5xpf5anwuz75vhlc00g2ec6teu3zvud3axeqcw` | 0.04621 |
| `bc1qthvjqlelj2fkr8d6u06mq27je07j9hek2g0nj2` | 0.03139 |
| `bc1qv4j45knlkeazg0n0ymv3e3rpcv4gc8qqmrhp20` | 0.03113 |
| `bc1qkusslhuvaxjqcyvk8ql5uzgsx9ql5xsmmr5hfj` | 0.02901 |
| `bc1q760tha4qcccvxvxkwvhtzdjpkdsmknr97sel3j` | 0.02344 |
| `bc1qat80jxvlng5gpt2er5ghz42zrd4f3dv36zh5yd` | 0.01906015 |
| `bc1q9ks759pfsg7gmrl66qpke8qds4f76l5h822tz9` | 0.0138 |
| `bc1quap6ufkkndyfvmeyksc6pn7swz8l2wgaaexpfq` | 0.009393 |
| `bc1qecwanftfjseh6qe4sxazh8x0p3f54d85hcvukq` | 0.0093 |
| `bc1qgy0tuzle24z7xtn920fd3n37eue2jnp36yn3d2` | 0.008959 |
| `bc1q8jnjgppawydxy6t2fh9k8kjgm4llu7dm03qla7` | 0.008778 |
| `bc1qewexpdxwkr6xu8tnmlg5fye3z7q4menr7c6m8c` | 0.00835 |

(This table is scrollable on mobile, so you can swipe left/right to see all the columns.)

If you want the complete list of funded and unfunded wallets, you can check them out [here](https://github.com/elliott-diy/LockBit-Wallet-Tracker)!

I don't expect these wallets to stay funded for long, based on some of the empty ones I checked, the money gets laundered pretty fast. I also made a dumb mistake about an hour in: I wasn't tracking transaction history, and half my API credits were already gone by the time I realized it.

I plan to redo the scan properly and log the total volume and addresses they interacted with. A lot of the wallets that show as unfunded aren't inactive; instead, the BTC just flowed through them quickly.

This is actually my first blog post, so if you made it this far, thanks for reading! I mostly just wanted to document something I thought was interesting and maybe useful to others digging into ransomware infrastructure. I’ll probably post more stuff like this when I have time (and school isn’t being a nightmare).
