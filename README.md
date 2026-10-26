
# Hamada Faris — Portfolio IA & Big Data

Portfolio personnel présentant mes projets, mes expériences et mes compétences en Intelligence Artificielle, Data Engineering et développement logiciel.

## Technologies

- HTML5, CSS3, JavaScript
- Python, SQL, Java, C#
- Machine Learning, NLP, systèmes multi-agents
- Git, GitHub et Docker
- Nginx et GitHub Pages

## Lancer le portfolio avec Docker

Construire l'image :

```bash
docker build -t portfolio-hamada-faris .
```

Lancer le conteneur :

```bash
docker run -d --name portfolio-hamada -p 8081:80 portfolio-hamada-faris
```

Ouvrir http://localhost:8081.

## Structure

- `index.html` : contenu du site
- `style.css` : mise en page et design
- `script.js` : interactions
- `assets/` : photo et CV
- `Dockerfile` : conteneurisation avec Nginx

## Déploiement

Publication prévue avec GitHub Pages depuis la branche `main`.

## Auteur

Hamada Faris
