# autotech-file-service

Site démo chiptuning (test en ligne) – thème mécanique, performance, technologie.

## Contenu

- **Header** : logo PowerTune, navigation, menu mobile
- **Hero** : section d’accueil avec visuel et CTA
- **Services** : cartes (reprogrammation ECU, diagnostic, préparation moteur)
- **Simulateur** : section avec iframe pour le configurateur gains tuning (ADAMO DataBase)
- **Performance** : présentation et contact
- **Footer** : liens et informations

## Lancer en local

Ouvrir `index.html` dans un navigateur ou servir le dossier avec un serveur HTTP :

```bash
python -m http.server 8080
```

Puis aller sur `http://localhost:8080`.

## L’iframe simulateur

L’URL du simulateur dans la page est configurable dans `index.html` (rechercher `simulateur?key=`). Par défaut : `https://simoroul.pythonanywhere.com/simulateur?key=demo-2025`. Pour un domaine en production, configurer la clé et le domaine autorisé côté API.

---

*Plateforme de service de fichier modifié (chiptuning).*
