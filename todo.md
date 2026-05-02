# Chnouwa Rayek? - TODO List

## Phase 1 : Architecture & Setup
- [x] Configurer Drizzle ORM et schéma de base de données
- [x] Créer les tables : sessions, users, questions, answers, behavioral_metrics, rewards
- [x] Initialiser les migrations SQL

## Phase 2 : Backend - API Mockée & Services

### 2.1 Services Fondamentaux
- [x] Mission Service : GET /api/missions (retourne questions mockées)
- [x] Submission Service : POST /api/submit (enregistre réponses)
- [x] Scoring Service : Calcul trust_score basé sur comportement
- [x] Points Engine : Calcul et accumulation des points
- [x] Behavior Tracking : POST /api/behavior/event (skip, drop-off, timing)

### 2.2 Données Mockées
- [x] Créer dataset de questions (swipe, rating, choice, open-ended)
- [x] Créer dataset de récompenses (Jumia, Glovo, Carrefour)
- [x] Créer dataset pour Rouet el Hadh (cadeaux)

### 2.3 Profil Progressif
- [ ] Système de niveaux de profil (L0 → L3)
- [ ] Enrichissement progressif du profil

## Phase 3 : Frontend - UI Mobile-First

### 3.1 Design System & Theming
- [x] Configurer Tailwind 4 avec palette de couleurs vives
- [x] Intégrer Framer Motion pour animations fluides
- [x] Ajouter polices Google pour Derja (support arabe)
- [x] Créer composants réutilisables (Button, Card, etc.)

### 3.2 Pages Principales
- [x] Page d'accueil / Onboarding
- [x] Flux de questions (TikTok-style)
  - [x] Composant Swipe (gauche/droite)
  - [x] Composant Rating (étoiles)
  - [x] Composant Choice (tap rapide)
  - [x] Composant Open-ended (texte court)
- [x] Page El Marchi (boutique) - Complète avec système d'achat
- [x] Page Rouet el Hadh (roue de la chance) - Page dédiée avec historique
- [x] Page Profil utilisateur - Profil complet avec statistiques
- [x] Navigation inférieure - Barre de navigation persistante

### 3.3 Localisation Derja
- [x] Traduction complète en Derja tunisien
- [x] Textes pour tous les écrans et interactions
- [x] Support RTL (droite à gauche)

## Phase 4 : Gamification

### 4.1 Système de Points
- [x] Affichage du solde de points en temps réel
- [x] Animation d'ajout de points après réponse
- [ ] Historique des points

### 4.2 Scoring Comportemental
- [x] Calcul avg_response_time
- [x] Calcul skip_rate
- [x] Calcul completion_rate
- [x] Calcul drop_off_points
- [x] Impact sur trust_score

### 4.3 Boutique "El Marchi"
- [ ] Affichage des offres mockées
- [ ] Système d'achat avec points
- [ ] Confirmation et notification d'achat

### 4.4 Roue de la Chance "Rouet el Hadh"
- [x] Composant roue animée
- [x] Logique de spin (coût en points)
- [x] Affichage du cadeau gagné
- [x] Animation de victoire

## Phase 5 : Tests & Optimisations
- [ ] Tests unitaires backend (Vitest)
- [ ] Tests d'intégration API
- [ ] Tests UI (Vitest + React Testing Library)
- [ ] Optimisation des performances
- [ ] Vérification responsive design

## Phase 6 : Documentation & Déploiement
- [ ] Documentation API (endpoints, mocks)
- [ ] Guide d'intégration pour moteur de questions réel
- [ ] Docker setup (Dockerfile, docker-compose)
- [ ] README complet

## Notes Techniques
- Architecture backend : Séparation claire entre couche Mock et logique métier
- Persistance : SQLite via Drizzle ORM
- Frontend : React 19 + Tailwind 4 + Framer Motion
- Tous les textes en Derja tunisien (Darija)
- Support RTL complet
