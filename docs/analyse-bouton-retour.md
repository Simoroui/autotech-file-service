# Analyse du bouton Retour et de la mémoire (sélecteur véhicule)

## 1. Ce qui est gardé en mémoire

### localStorage
- **`vehicleResultData`** : dernière sélection complète (marque, modèle, version, moteur + puissances/couples + `url` + `timestamp`). Utilisé pour réafficher la page de résultats si tu reviens avec la même URL dans les **24 h**. Mis à jour à chaque affichage de page résultats ; supprimé quand tu clics sur un lien du header/footer, Échap, ou une autre page du site.
- **`navState`** : état pour le cas “retour aux motorisations” (`returnToEngines=true`).
- **`previousSelection`** : ancienne sélection (utilisée avec `?restore=true`).

### sessionStorage
- **`selectedType`**, **`selectedBrand`**, **`selectedModel`**, **`selectedVersion`** : lus au chargement pour restaurer une sélection (les `setItem` ne semblent pas utilisés dans le code actuel, donc cette restauration peut ne plus servir).

### Historique navigateur (pushState / replaceState)
- À chaque étape de sélection on fait **pushState** : liste marques → marque → modèle → version → **résultats**.
- Sur la page résultats, l’URL (hash) est mise à jour avec **replaceState** (même entrée d’historique, pas de nouvel empilement).

---

## 2. Comportement du bouton Retour

### Logique actuelle de `handleBack()`
- Si une **page résultats** est affichée **ou** qu’il y a au moins une sélection (type + marque), on fait **uniquement** `history.back()`.
- Sinon (aucune page résultats, pas de sélection), redirection vers `index.html#boost`.

Donc le bouton Retour ne recalcule pas l’étape : il s’appuie à 100 % sur la pile d’historique. Ce qui s’affiche dépend de **l’état** (`event.state`) de l’entrée précédente et du handler **popstate**.

---

## 3. Scénarios et problèmes

### Scénario A : Navigation “normale” (tout au clic)
1. Accueil → Onglet Voitures → BMW → 1M → E82 2011 → 3.0i Bi-turbo.
2. Pile : `[list]` → `[brand]` → `[model]` → `[version]` → `[result]`.
3. **Retour** : `popstate` reçoit `step: 'version'` → `handleVersionSelection` → écran “Sélectionnez une version”.
4. Comportement attendu : **OK**.

---

### Scénario B : Ouverture d’un lien partagé (hash seul)
- URL : `index.html#reprogrammation/cars/bmw/1m/e82---2011--%3E/3.0i-bi-turbo-340hp`
- Au chargement :
  - **initVehicleSelector()** n’est appelé **que** si `hash === '#boost'` ou vide. Ici le hash est `#reprogrammation/...`, donc **initVehicleSelector() n’est pas exécuté** → pas de chargement du CSV, pas de construction des onglets/grilles.
  - **checkURLParamsAndShowResults()** s’exécute : pas de paramètres de requête ; elle peut utiliser **localStorage** si `vehicleResultData` existe avec la même URL (< 24 h). Dans ce cas elle appelle **handleEngineSelection** directement → affichage de la page résultats et **pushState('result')**.
- Pile typique : entrée initiale du navigateur (souvent sans `step`) puis **une seule** entrée `[result]`.
- **Retour** : on revient à l’entrée précédente. Si elle n’a pas de `step` structuré, le code fait seulement “supprimer la page résultats” et ne restaure pas une étape de sélection. En plus, la grille (marques, modèles, versions) n’a jamais été construite.
- Comportement : **bizarre** (retour à un écran vide ou incohérent, pas de “Sélectionnez une version” propre).

---

### Scénario C : Même lien partagé, mais restauration par hash (handleHashChange)
- Si **checkURLParamsAndShowResults()** ne restaure pas (pas de localStorage ou URL différente), après 1 s on appelle **handleHashChange()**.
- handleHashChange simule les clics : onglet → marque → modèle → version → moteur. Chaque clic fait un **pushState**.
- Pile : `[list]` (si elle a été mise une fois) puis `[brand]`, `[model]`, `[version]`, `[result]`.
- **Mais** : si **initVehicleSelector()** n’a pas été appelé (hash ≠ #boost), les éléments sur lesquels on “simule” le clic (onglets, grilles) n’existent pas encore → la simulation échoue ou est partielle, et la pile peut être incomplète ou incohérente.
- Comportement : **risque de pile incorrecte** et Retour qui ne correspond pas à l’affichage.

---

### Scénario D : Restauration depuis localStorage (vehicleResultData)
- Tu as déjà vu une page résultats (ex. BMW 1M E82 3.0i). Tu quittes puis tu reviens sur la **même** URL (ou une URL sans hash, selon le code exact).
- **checkURLParamsAndShowResults()** trouve `vehicleResultData` avec la même `url` et < 24 h → appelle **handleEngineSelection** → **pushState('result')** sans avoir jamais poussé les étapes list / brand / model / version.
- Pile : `[entrée initiale]` → `[result]` (une seule étape “sélection” poussée).
- **Retour** : on revient à l’entrée initiale (souvent sans step) → on enlève la page résultats, mais pas de restauration d’étape (liste marques, version, etc.) → écran vide ou incohérent.
- Comportement : **bizarre** ; en plus, l’utilisateur a l’impression que “le site a gardé la dernière voiture” parce que la page résultats réapparaît automatiquement.

---

### Scénario E : Plusieurs retours successifs
- Si la pile est correcte (A), Retour enchaîne : résultats → version → modèle → marque → liste. Chaque fois **popstate** reçoit le bon `step` et appelle la bonne fonction (handleVersionSelection, handleModelSelection, etc.).
- Si la pile a été construite par localStorage (D) ou par une restauration hash partielle (B/C), il n’y a pas toutes les étapes → un Retour peut sauter directement à une entrée sans step ou à une étape qui ne correspond pas à l’écran affiché.
- Comportement : **parfois correct**, **parfois bizarre** selon l’origine de la pile.

---

## 4. Synthèse des causes du comportement bizarre

1. **Pile d’historique incomplète**  
   Quand la page résultats est affichée via **localStorage** ou via une URL avec hash **sans** avoir passé par les vrais clics, on fait **pushState('result')** sans avoir poussé list / brand / model / version. Un Retour remonte alors à une entrée “vide” ou ancienne au lieu de revenir à “Sélectionnez une version”.

2. **initVehicleSelector() pas appelé quand le hash est déjà #reprogrammation/...**  
   Les onglets et grilles ne sont pas construits. La simulation de clics (handleHashChange) et la cohérence de l’affichage après Retour en pâtissent.

3. **localStorage vehicleResultData**  
   Il garde la “dernière voiture” et réaffiche la page résultats au chargement si l’URL correspond. C’est ce qui donne l’impression que “le site garde en mémoire les dernières voitures” et peut en plus fausser la pile d’historique (point 1).

4. **replaceState dans showResultPage**  
   On met à jour l’URL (hash) avec **replaceState(currentState, ...)**. On garde donc le même `state` (déjà `result`) ; ça ne change pas la pile, mais si avant ça on n’avait pas poussé les étapes intermédiaires (cas localStorage / lien direct), la pile reste fausse.

---

## 5. Pistes de correction (résumé)

- **Toujours initialiser le sélecteur** : appeler **initVehicleSelector()** même lorsque le hash est `#reprogrammation/...` (ou après un court délai une fois le hash traité), pour que les onglets et grilles existent avant toute simulation ou restauration.
- **Ne pas mélanger localStorage et historique** : quand on restaure la page résultats depuis **vehicleResultData**, soit ne pas faire de **pushState('result')** (pour éviter une pile à une seule étape), soit reconstruire toute la pile (replaceState list, puis pushState brand, model, version, result) avant d’afficher les résultats.
- **Lien partagé (hash seul)** : s’assurer que handleHashChange ne s’exécute qu’après que **initVehicleSelector()** ait chargé le CSV et construit les grilles, puis simuler les clics pour que la pile soit identique à une navigation normale.
- **Nettoyage** : supprimer ou limiter l’usage de **vehicleResultData** (par ex. ne l’utiliser que pour le même onglet et la même session, ou ne pas restaurer automatiquement la page résultats au chargement) pour éviter l’effet “le site garde la dernière voiture” et les piles d’historique à une entrée.

Une fois ces points traités dans le code, le bouton Retour devrait se comporter de façon cohérente dans tous les scénarios (clic normal, lien partagé, retour après fermeture d’onglet).
