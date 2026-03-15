# Analyse en profondeur – Tous les scénarios (bouton Retour et historique)

## Ordre d’exécution au chargement de la page

1. **DOMContentLoaded** (premier listener, async, ~l.1996)  
   - `fetch('data/marques.csv')` → attente.  
   - Puis : `parseCSV`, `extractBrands`, `cachedBrands`, `displayBrands(brands, defaultType)`.  
   - Si `!window.history.state || !window.history.state.step` → **replaceState** `{ step: 'list', type: defaultType, brand: null, model: null, version: null, engine: null }` (URL inchangée).  
   - Pose des listeners sur les onglets (`handleTabClick`).  
   - Si `savedType` / `savedBrand` dans sessionStorage → simulation de clics (onglet → marque → modèle → version) avec des `setTimeout` (pas d’impact sur la pile si pas de clics réels).  
   - Ensuite : **checkURLParamsAndShowResults()**.  
   - Si retour `false` → **setTimeout(handleHashChange, 800)**.

2. **DOMContentLoaded** (deuxième listener, sync, ~l.2244)  
   - Pose uniquement les listeners (liens, header, Échap) qui suppriment `vehicleResultData`.

3. **hashchange**  
   - Listener : **handleHashChange** (exécuté à chaque changement de hash, ou une fois à 800 ms si hash résultat au chargement).

4. **initVehicleSelector**  
   - Appelé uniquement si `hash === '#boost' || hash === '' || hash === '#'` (autre listener DOMContentLoaded ~l.3022).  
   - Donc **pas** exécuté quand l’URL a déjà un hash du type `#reprogrammation/...`.

---

## Scénario 1 : Navigation 100 % au clic (depuis liste marques)

**URL initiale :** `index.html` ou `index.html#boost`.

- Chargement → fetch CSV → **replaceState(list)** → grilles affichées.  
- Pile : **1 entrée** `[list]`.

**Clic onglet (ex. Voitures)**  
- `handleTabClick` → `replaceState(list)` (même step, type mis à jour).  
- Pile : **1 entrée** `[list]`.

**Clic marque (ex. BMW)**  
- `handleBrandSelection` → **pushSelectionState('brand', …)** → **pushState**.  
- Pile : `[list], [brand]`.

**Clic modèle (ex. 1M)**  
- `handleModelSelection` → **pushSelectionState('model', …)**.  
- Pile : `[list], [brand], [model]`.

**Clic version (ex. E82 - 2011 ->)**  
- `handleVersionSelection` → **pushSelectionState('version', …)**.  
- Pile : `[list], [brand], [model], [version]`.

**Clic motorisation (ex. 3.0i Bi-turbo 340hp)**  
- `handleEngineSelection` → **pushSelectionState('result', …)** → **pushState** → puis `showResultPage` → **replaceState** (même state, URL mise à jour avec le hash résultat).  
- Pile : `[list], [brand], [model], [version], [result]`.  
- Affichage : page résultats.

**Clic « Retour » (bouton du site)**  
- `handleBack()` : `hasResultPage === true` → **history.back()**.  
- Pile : `[list], [brand], [model], [version]`.  
- **popstate** avec `state.step === 'version'` → `handleVersionSelection(brand, type, model, version)` avec **isRestoringFromHistory = true** (donc pas de nouveau pushState).  
- Résultat : écran « Sélectionnez une version » avec la liste des versions. **Comportement attendu.**

**Retours successifs**  
- Retour → version → modèle → marque → liste.  
- Dernier Retour depuis `[list]` : `handleBack` voit `s.type` mais pas `s.brand` (liste) → **window.location.href = 'index.html#boost'** (rechargement vers #boost). **Acceptable.**

---

## Scénario 2 : Ouverture d’un lien partagé (hash résultat uniquement)

**URL :** `index.html#reprogrammation/cars/bmw/1m/e82---2011--%3E/3.0i-bi-turbo-340hp`.

- Chargement : même **DOMContentLoaded** async que ci‑dessus.  
- **replaceState(list)** après chargement du CSV (pas d’autre page, donc `history.state` vide ou sans `step`).  
- **checkURLParamsAndShowResults()** :  
  - Pas de paramètres de requête.  
  - `parts.length >= 6 && parts[0] === 'reprogrammation'` → **on ne touche pas au localStorage**, retour **false**.  
- Donc **setTimeout(handleHashChange, 800)**.

**À t = 800 ms : handleHashChange()**  
- Parse le hash → type, brand, model, versionSlug, engineSlug.  
- Simulation de clics en chaîne (avec délais) :  
  - Clic onglet `type` → **replaceState(list)** (pas de push).  
  - Clic marque → **handleBrandSelection** → **pushState(brand)**.  
  - Clic modèle → **pushState(model)**.  
  - Clic version (slug normalisé) → **pushState(version)**.  
  - Clic moteur → **handleEngineSelection** → **pushState(result)** puis **showResultPage** → **replaceState** (URL avec hash).  
- Pile finale : **`[list], [brand], [model], [version], [result]`**.  
- Affichage : page résultats.

**Clic « Retour »**  
- **history.back()** → **popstate(version)** → `handleVersionSelection` → écran « Sélectionnez une version ». **Attendu.**

**Conclusion scénario 2 :** Pile correcte, Retour cohérent.

---

## Scénario 3 : URL avec paramètres de requête (ancien format)

**URL :** `index.html?brand=BMW&model=1M&version=E82%20-%202011%20-%3E&engine=3.0i%20Bi-turbo%20340hp` (éventuellement avec `#reprogrammation/cars/...`).

- **checkURLParamsAndShowResults()** :  
  - `hasCurrentURLParams === true`, `parts[0] === 'reprogrammation'`.  
  - Nettoyage de l’URL (remplacement par hash seul), **replaceState** avec la nouvelle URL.  
  - **localStorage.removeItem('vehicleResultData')**.  
  - Dans un **setTimeout(500)** : construction de `engineData` (URL ou getEngineData), **currentSelection** mis à jour, **localStorage.setItem('vehicleResultData', …)** (avec **type**), puis **handleEngineSelection(...)**.

- **handleEngineSelection** fait **pushSelectionState('result', …)** puis **showResultPage**.  
- À ce moment la pile n’a que **replaceState(list)** fait au chargement. On n’a **pas** poussé brand, model, version avant d’appeler **handleEngineSelection**.  
- Donc pile : **`[list], [result]`** (une seule étape de sélection avant résultat).

**Clic « Retour »**  
- **history.back()** → entrée précédente = **list**.  
- **popstate** avec `state.step === 'list'` → **goToBrandList(type)**.  
- L’utilisateur revient à la **liste des marques**, pas à « Sélectionnez une version ».

**Conclusion scénario 3 :** Comportement incohérent par rapport à une navigation “étape par étape”. Pour être cohérent avec le scénario 2, il faudrait, avant d’afficher les résultats depuis les paramètres de requête, pousser les étapes brand, model, version (comme pour la restauration localStorage), puis result.

---

## Scénario 4 : Restauration depuis localStorage (même URL, < 24 h)

**Contexte :** L’utilisateur a déjà vu une page résultats (navigation au clic ou lien partagé). Les données sont dans **vehicleResultData** avec la **même URL** que l’actuelle.

- Cas **sans** hash résultat complet (ex. `index.html#boost` alors que storedURL est aussi `index.html#boost` — cas rare) :  
  - **checkURLParamsAndShowResults()** va dans le bloc localStorage.  
  - On construit la pile : **replaceState(list)** si besoin, puis **pushState(brand), pushState(model), pushState(version)**.  
  - Puis **handleEngineSelection** → **pushState(result)**.  
  - Pile : **`[list], [brand], [model], [version], [result]`**.  
  - **Retour** → version → modèle → marque → liste. **OK.**

- Cas **avec** hash résultat complet (ex. retour sur le même lien partagé) :  
  - On a **parts.length >= 6** → on **ne** rentre **pas** dans le bloc localStorage, on retourne **false** → **handleHashChange** à 800 ms construit la pile par simulation de clics.  
  - Même résultat que le scénario 2. **OK.**

---

## Scénario 5 : Plusieurs retours successifs depuis la page résultats

- Pile supposée correcte : **`[list], [brand], [model], [version], [result]`**.  
- Chaque **history.back()** déclenche **popstate** avec l’état précédent.  
- Ordre : result → version → model → brand → list.  
- À chaque étape on appelle la bonne fonction (handleVersionSelection, handleModelSelection, handleBrandSelection, goToBrandList) avec **isRestoringFromHistory = true**, donc **aucun pushState** pendant la restauration.  
- **Comportement attendu.**

---

## Scénario 6 : Clic sur un lien du header/footer (Accueil, À propos, etc.)

- Listeners sur les liens suppriment **vehicleResultData**.  
- Navigation réelle (changement de page ou ancre).  
- Si l’utilisateur revient ensuite (bouton navigateur ou lien) vers la page avec le sélecteur, la pile dépend de l’historique du navigateur ; il n’y a pas de restauration automatique des résultats depuis le localStorage si l’URL ne correspond pas.  
- **Comportement attendu.**

---

## Scénario 7 : Touche Échap sur la page résultats

- Listener keydown : **localStorage.removeItem('vehicleResultData')** et **window.location.href = 'index.html'**.  
- Rechargement complet.  
- Pas de popstate. **Attendu.**

---

## Scénario 8 : Rafraîchissement (F5) sur la page résultats

- URL gardée : `index.html#reprogrammation/cars/bmw/1m/e82---2011--%3E/3.0i-bi-turbo-340hp`.  
- Rechargement → même flux que le **scénario 2** : replaceState(list), checkURLParams (on ne restaure pas depuis localStorage car hash complet), puis **handleHashChange** à 800 ms.  
- Pile reconstruite par simulation de clics : **`[list], [brand], [model], [version], [result]`**.  
- **Retour** → version. **OK.**

---

## Synthèse des risques et recommandations

| Scénario | Pile d’historique | Bouton Retour | Risque / action |
|----------|-------------------|---------------|------------------|
| 1. Navigation au clic | Correcte | OK | Aucun. |
| 2. Lien partagé (hash seul) | Construite par handleHashChange | OK | Aucun. |
| 3. URL avec paramètres de requête | `[list], [brand], [model], [version], [result]` (pile construite avant result) | Retour → version | **Corrigé** : même construction de pile que pour le localStorage. |
| 4. Restauration localStorage | Correcte (pile construite avant result) ou hash → handleHashChange | OK | Aucun. |
| 5. Retours successifs | Correcte si pile était bonne | OK | Aucun. |
| 6. Lien header/footer | N/A | N/A | Aucun. |
| 7. Échap | N/A | N/A | Aucun. |
| 8. F5 sur résultats | Reconstruite par handleHashChange | OK | Aucun. |

**Recommandation principale :**  
Aucune : le scénario 3 est corrigé par la construction de la pile (replaceState list puis pushState brand, model, version) avant **handleEngineSelection** dans le bloc des paramètres de requête.

---

## Résumé technique

- **handleBack()** : ne fait que **history.back()** si une page résultats est affichée ou si une sélection (type + marque) existe ; sinon redirection vers `index.html#boost`.  
- **popstate** : selon `state.step` appelle goToBrandList, handleBrandSelection, handleModelSelection, handleVersionSelection ou handleEngineSelection, avec **isRestoringFromHistory = true** pour éviter d’empiler de nouveaux états.  
- **Pile correcte** = au moins `[list], [brand], [model], [version], [result]` quand on est sur la page résultats.  
- La seule entrée où la pile pouvait être incomplète (cas avec paramètres de requête) est **corrigée** par la construction de la pile avant **handleEngineSelection** dans le bloc query params.
