# Unslop Writing Preferences

Apply when the user invokes `/unslop` or asks to humanize, de-slop, make text sound less robotic, flag AI tells, clean up drafted prose, or prepare writing before publishing.

Remove patterns that make prose read as machine-written. Audit first. Rewrite only when the user asks for a rewrite or invokes `/unslop` without an audit-only phrase.

## Core contract

- Repair concrete AI-writing or clarity defects, then add enough human voice that the result does not become sterile.
- Leave everything else unchanged. Prefer a no-op to an uncertain edit.
- Quote the smallest defective span when auditing.
- Treat pattern matches as candidates, not automatic bans.
- Protect literal, attributed, quoted, accurately caveated, genre-natural, and domain-valid uses.
- For legal, medical, security, scientific, financial, or technical text, preserve force-bearing words and caveats with extra care.

## Rewrite

- Edit only the sentence or list item containing a confirmed finding unless the user requested a heavier rewrite.
- Preserve facts, quantities, dates, names, units, citations, quotations, code, examples, scope, uncertainty, attribution, negation, and conditions.
- Preserve the user's register and intended audience.
- Do not add new claims, advice, anecdotes, fake personality, certainty, conclusions, or stock anti-slop staccato.
- If there are no confirmed findings, return the source unchanged for rewrite requests.

When the source needs voice, add it by being more specific and more alive, not by performing:

- Have a point of view when the genre permits it.
- React to facts instead of neutrally listing pros and cons.
- Acknowledge mixed feelings when the topic calls for them.
- Use `I` when first person fits the author and context.
- Vary sentence rhythm.
- Let some mess remain.
- Replace vague feelings with concrete observations, mechanisms, examples, or numbers.

## Common AI tells

- Formulaic openers: "In today's fast-paced landscape", "In an increasingly complex world", "Let's dive in", "At its core", "It's worth noting that".
- Contrast theater: "It's not just X, it's Y", "Not only X, but Y", and rhetorical section bridges.
- Puffery: "pivotal moment", "testament to", "setting the stage for", "indelible mark", "game-changing", "transformative", "groundbreaking", "renowned", "stunning", "must-visit".
- Vague authority: "Experts believe", "Industry reports suggest", "Some critics argue", "Studies show" without naming the source.
- Chatbot residue: "I hope this helps", "Great question", "Certainly", "Of course", "Let me know if", "As an AI language model", "As of my knowledge cutoff".
- Sycophancy: "You're absolutely right" when a direct answer would be better.
- Structure tells: forced rules of three, generic conclusions, uniform paragraph rhythm, one-sentence dramatic kickers, inline-header listicles, title case headings, decorative emojis, and boldface overuse.
- Punctuation tells: em dash overuse, colon overuse as a mid-sentence connector, and curly quotes in plain-text contexts.
- Weak mechanics: superficial `-ing` phrases, fancy ways to say `is` or `has`, synonym cycling, false ranges, dense sentences, passive voice when the actor matters, adverbs propping up weak verbs, filler phrases, bloated words, and excessive hedging.

## Words to question

Question these when they are decorative instead of precise: additionally, crucial, delve, enduring, enhance, fostering, garner, interplay, intricate, landscape, pivotal, showcase, tapestry, testament, underscore, vibrant, substrate, wedge, vector, locus, vantage, nexus, primitive, harness, surface, bedrock, scaffolding, modality, paradigm, gold-plating, ratchet, evacuate, endgame, north star, and flywheel.

Prefer concrete words: `substrate` can become `base`; `wedge in` can become `add`; `vector` can become `way` or `method`; `gold-plating` can become `more than the job needs`; `evacuate` can become `move out`.

## Concrete over vibes

Say what it does, not how it feels. Ask what the sentence tells the reader to do or know. If it cannot be restated as a concrete instruction, fact, mechanism, or number, cut or replace it. If the sentence could appear unchanged in another project's docs, it probably says too little.

## Self-audit

Before returning a rewrite, ask: "What makes this obviously AI generated?" Fix remaining tells. Then compare the original and transformed text for changed facts, quantities, dates, names, scope, uncertainty, attribution, register, and meaning.

