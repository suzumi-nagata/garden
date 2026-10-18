---
title: "Claude reveals ECDSA curve origins"
citekey: "anthropic_claude_ecdsa_2026"
authors: "Anthropic"
year: 2026
venue: ""
doi: ""
url: "https://www.anthropic.com/research/ecdsa-curve-origins"
tags:
  - literature
  - cryptography
  - ecc
  - seeds
  - nist
  - ai
  - claude
read: false
noCite:
  - anthropic_claude_ecdsa_2026
---

# Why I picked this up

Interesting note about the origins of standard **NIST seeds** for ECDSA curves. Which was not
public before.

# What the source argues (in my words)

The source explains how Claude was able to finally find the sources of the ECDSA curves
seeds. He did it by looking at the seeds values and tried to find any pattern that
matched.

He discovered that each part of the seed was somehow generated from the part before (it
differs from the B curves and P curves).

In the end, he discovered not only the function used to generate them (lrand48), but also
the seeds, which were **Unix timestamps + number of iterations**.

This helps clarify that the seeds were not "backdoor chosen", but were actually really
just random generations from timestamps. So the idea that NSA (for this case) was trying
to hide something from the public goes downhill.

# Key claims (in my words, with locations)

- **(Introduction):** Claude found out the origin of **most** of the famous NIST ECDSA
  curves seeds.
- **(Introduction):** This was initially thought to be hashes of a secret quote, but
  no-one ever found out that quote
- **(How it was found):** Claude found out that:
  - When splitting the binary fields into chunks of 32 bit words, the numbers never had
    the LMB (Left Most Bit) set. The numbers always went from 0 to 7
    - This pointed out to some number generator that generated outputs of **31 bits**
    - By that clue, he suspected on the linear generator: `lrand48` which outputed 31 bits
      and was a common rng for the time
    - Since lrand48 uses a 48 bit state, and the output is the first 31 bits, Claude
      basically fixed the first 31 bits and brute forced the last 17 bits and tested the
      next iteration, to see if it would match the next part of the seed
      - When he found out the matching seed, continuing iterating just gave the rest of the
        seeds
      - This finding was valid for the curves `B-233`, `B-283`, `B-409`, `B-571`, just the
        fifth curve `B-163`, Claude didn't manage to find the generator
  - For the Prime field curves, it was a bit more intrinsic. It also used `lrand48`, but
    each chunk of the seed was a byte, not 31 bits, so we had more unknowns to test (40
    bits for each known byte).
    - Since the prng generator is linear and they had the truncation bytes for each step
      (first byte), they solved as a Lattice problem using LLL - Lenstra–Lenstra–Lovász -
      (I'll have to do more reading on later on why is this a lattice problem) with a
      Lattice of 19 dimensions.
    - Once found the state using LLL, and since the generator is linear, they could run
      backwards and found out the initial value + the number of iterations.
      - As it turns out the seeds (initial values) were just Unix timestamps from 1997.
      - The number of iterations were to find the seeds that generated the prime curves,
        there was some unknowns about why some values skipped the first "viable
        candidates" (a sw bug? or some other undisclosed result criteria?)
- **(Claude found some base points too):** While searching for the seeds origins, he also
  found some of the Generator points as well.
  - This was done by a small rng algorithm that shipped with the FreeLIP (and also an
    Victor Shoup's NTL library)
  - The generator used a small integer as input and tested the X coordinate until it fell
    under the curve
  - Claude found the initial value for some of these curves, other curves didn't fit that
    algorithm

# Quotes (verbatim, with locations)

> We pursued this long-standing open question of the cryptographic community to settle concerns about ECDSA, which is one of our most widely used cryptographic standards.

> The provenance of these seeds has been a long-standing question, as they were provided by the NSA with no explanation or justification.

> The best story was that Jerry Solinas, longtime NSA employee, generated the seeds using a hash of a humorous passphrase

> The algorithm used would sample bytes from the random number generator (RNG) initialized by a Unix timestamp (t) for some number of iterations (n).

> In fact, this makes us more confident the curves were chosen without any backdoors or intentional weaknesses.

> The scan covered 34 combinations of generator and output slices. At that point, Claude noticed a pattern in the top bits for some seeds: they were all zero.

> It turns out recovering the state of a truncated linear congruential generator is a textbook lattice problem, solved with the Lenstra–Lenstra–Lovász (LLL) basis reduction algorithm.

> However, for the ten prime-curve seeds, every srand48 initialization was a Unix timestamp representing a date between May 1997 and April 1998.

> The base points of the six curves generated in May 1997 (P-192 and the five ANSI X9.62 example curves prime192v2, prime192v3, and prime239v1 to v3) come from the random number generator in FreeLIP, Arjen Lenstra's long-integer arithmetic package.

> The fifth binary seed, B-163, fits nothing Claude has tried and remains unexplained.
