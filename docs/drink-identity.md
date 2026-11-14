# Drink identity review

Reviewed 2026-11-14. Deduplication must not infer product identity from brand similarity or price.

## Producer evidence

- [CHANDON Garden Spritz](https://www.chandon.com/en-int/chandon-garden-spritz): the producer identifies this as a ready-to-serve sparkling aperitif cocktail combining sparkling wine with orange peel and spices. It remains a separate product from Chandon Brut Classic, including when their reported menu prices match.
- [Moët & Chandon product range](https://www.moet.com/en-us/our-champagnes-moet-chandon): Brut Impérial, Brut Impérial Rosé, Ice Impérial, Ice Impérial Rosé, Nectar, and vintage products have distinct listings. Their distinguishing qualifiers must remain part of identity. The producer also uses the shorter Rosé Impérial name in its product description; this is not evidence that an unspecified Brut Rosé menu label necessarily refers to it.

## Rules

- Normalize capitalization, accents, punctuation, and connector formatting. Wine entries containing the same complete product words can match when menus reverse brand/product order.
- Keep Garden Spritz and Brut Classic separate. Keep Rosé, Ice, Nectar, reserve, vintage, serving size, and bottle/glass qualifiers separate.
- Never complete an incomplete menu label automatically. `Chandon Brut` is not assumed to be `Chandon Brut Classic`; `Moët & Chandon Brut` is not assumed to be `Moët & Chandon Brut Impérial`.
- Preserve an unverified extra qualifier too: `Cuvée, Chandon Garden Spritz` remains separate from `Chandon Garden Spritz` until source evidence confirms the menu meaning.
- Retain source labels as searchable aliases. Grouping search results does not delete historical drink records or rewrite logged prices.
- Any future rule that adds or removes a product word needs recorded product/menu evidence here and a regression test preserving neighboring products. If uncertain, retain separate entries.

The earlier five-result Chandon grouping was too aggressive for incomplete menu labels. The catalog now leaves those ambiguous labels separate; Garden Spritz and Brut Classic had distinct keys and remain distinct.
