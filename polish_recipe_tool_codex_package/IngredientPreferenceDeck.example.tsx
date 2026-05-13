import React, { useMemo, useState } from 'react';
import type { IngredientPreference } from './ingredient-preferences';

type Props = {
  pool: IngredientPreference[];
  likedIds: string[];
  dislikedIds: string[];
  maxLikes?: number;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onDone: () => void;
};

function deterministicShuffle<T>(items: T[], seed = 'polish-recipes') {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
    const j = Math.abs(h) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function IngredientPreferenceDeck({
  pool,
  likedIds,
  dislikedIds,
  maxLikes = 10,
  onLike,
  onDislike,
  onDone
}: Props) {
  const seen = new Set([...likedIds, ...dislikedIds]);

  const deck = useMemo(() => deterministicShuffle(pool, 'polish-recipe-deck'), [pool]);
  const [visibleIds, setVisibleIds] = useState(() => deck.slice(0, 9).map(item => item.id));

  const visible = visibleIds
    .map(id => pool.find(item => item.id === id))
    .filter(Boolean) as IngredientPreference[];

  function replaceCard(id: string) {
    const alreadyVisible = new Set(visibleIds);
    const next = deck.find(item => !seen.has(item.id) && !alreadyVisible.has(item.id) && item.id !== id);
    setVisibleIds(current => current
      .filter(currentId => currentId !== id)
      .concat(next ? [next.id] : [])
      .slice(0, 9)
    );
  }

  function handleLike(id: string) {
    if (likedIds.length >= maxLikes) return;
    onLike(id);
    replaceCard(id);
  }

  function handleDislike(id: string) {
    onDislike(id);
    replaceCard(id);
  }

  return (
    <section aria-labelledby="ingredient-deck-title" className="ingredient-deck">
      <div className="ingredient-deck__header">
        <h2 id="ingredient-deck-title">Scegli fino a 10 ingredienti che ti piacciono</h2>
        <p aria-live="polite">Ingredienti scelti: {likedIds.length}/{maxLikes}</p>
      </div>

      <div className="ingredient-deck__grid" role="list" aria-label="Ingredienti disponibili">
        {visible.map(ingredient => (
          <article key={ingredient.id} role="listitem" className="ingredient-card">
            <button
              type="button"
              className="ingredient-card__select"
              onClick={() => handleLike(ingredient.id)}
              disabled={likedIds.length >= maxLikes}
              aria-label={`Mi piace: ${ingredient.labelIt}${ingredient.labelPl ? `, ${ingredient.labelPl}` : ''}`}
            >
              <span className="ingredient-card__title">{ingredient.labelIt}</span>
              {ingredient.labelPl && <span className="ingredient-card__subtitle">{ingredient.labelPl}</span>}
              <span className="ingredient-card__tags">{ingredient.flavourFamilies.slice(0, 2).join(' · ')}</span>
            </button>
            <button type="button" className="ingredient-card__secondary" onClick={() => handleDislike(ingredient.id)}>
              Non mi piace
            </button>
          </article>
        ))}
      </div>

      <div className="ingredient-deck__selected" aria-label="Ingredienti selezionati">
        {likedIds.map(id => {
          const item = pool.find(ingredient => ingredient.id === id);
          return item ? <span key={id} className="chip">{item.labelIt}</span> : null;
        })}
      </div>

      <button type="button" onClick={onDone} className="primary-button">
        Ho finito
      </button>
    </section>
  );
}
