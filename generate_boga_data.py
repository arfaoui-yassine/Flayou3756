"""Generate realistic Boga Cidre purchase data from consumer profiles."""
import csv
import random
import os

random.seed(42)

# Output path
output_path = r'c:\Users\dongm\OneDrive\Desktop\projet\data\achats_boga.csv'

# Consumer profile distribution for Boga (based on real Tunisian market)
# Boga = mass market, cheap (1.8 TND), all demographics, summer-heavy
REGIONS = ['Grand Tunis', 'Sud', 'Centre-Est', 'Nord Littoral', 'Centre-Ouest', 'Nord-Ouest']
GOUVERNORATS = {
    'Grand Tunis': ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'],
    'Sud': ['Sfax', 'Gabès', 'Médenine', 'Tataouine'],
    'Centre-Est': ['Sousse', 'Monastir', 'Mahdia'],
    'Nord Littoral': ['Nabeul', 'Bizerte', 'Zaghouan'],
    'Centre-Ouest': ['Kairouan', 'Kasserine', 'Sidi Bouzid'],
    'Nord-Ouest': ['Béja', 'Le Kef', 'Jendouba'],
}
AGE_RANGES = ['8-17', '18-24', '25-34', '35-44', '45-54', '55+']
GENDERS = ['M', 'F']
CHANNELS = ['supermarche', 'epicerie', 'souk', 'cafe_restaurant', 'distributeur_auto', 'en_ligne']
OCCASIONS = ['quotidien', 'sport', 'sortie_amis', 'repas_famille', 'ramadan_ftour', 'plage_ete', 'fete', 'travail']
MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

# Seasonal purchase intensity multipliers for Boga
MONTH_INTENSITY = {
    'Janvier': 0.5, 'Février': 0.4, 'Mars': 0.7, 'Avril': 0.8,
    'Mai': 1.0, 'Juin': 1.4, 'Juillet': 1.8, 'Août': 1.9,
    'Septembre': 1.2, 'Octobre': 0.8, 'Novembre': 0.6, 'Décembre': 0.5
}

# Age distribution weights (youth-heavy for Boga)
AGE_WEIGHTS = {'8-17': 0.15, '18-24': 0.30, '25-34': 0.25, '35-44': 0.15, '45-54': 0.10, '55+': 0.05}

# Region weights
REGION_WEIGHTS = {'Grand Tunis': 0.35, 'Sud': 0.20, 'Centre-Est': 0.18, 
                  'Nord Littoral': 0.12, 'Centre-Ouest': 0.08, 'Nord-Ouest': 0.07}

# Channel weights by context
CHANNEL_WEIGHTS = {'supermarche': 0.30, 'epicerie': 0.35, 'souk': 0.05, 
                   'cafe_restaurant': 0.15, 'distributeur_auto': 0.05, 'en_ligne': 0.10}

rows = []
record_id = 1

for month in MOIS:
    intensity = MONTH_INTENSITY[month]
    n_purchases = int(200 * intensity)  # ~200 base purchases per month, scaled
    
    for _ in range(n_purchases):
        # Pick demographics based on weights
        region = random.choices(REGIONS, weights=[REGION_WEIGHTS[r] for r in REGIONS])[0]
        gouv = random.choice(GOUVERNORATS[region])
        age_range = random.choices(AGE_RANGES, weights=[AGE_WEIGHTS[a] for a in AGE_RANGES])[0]
        gender = random.choice(GENDERS)
        
        # Channel selection - youth buy more from epicerie/cafe, older from supermarche
        if age_range in ['8-17', '18-24']:
            channel = random.choices(CHANNELS, weights=[0.15, 0.35, 0.05, 0.25, 0.10, 0.10])[0]
        elif age_range in ['25-34', '35-44']:
            channel = random.choices(CHANNELS, weights=[0.35, 0.25, 0.05, 0.15, 0.05, 0.15])[0]
        else:
            channel = random.choices(CHANNELS, weights=[0.40, 0.35, 0.10, 0.05, 0.02, 0.08])[0]
        
        # Occasion depends on month and age
        if month in ['Juillet', 'Août']:
            occasion = random.choices(OCCASIONS, weights=[0.15, 0.15, 0.20, 0.10, 0.0, 0.30, 0.05, 0.05])[0]
        elif month in ['Mars', 'Avril']:  # Ramadan
            occasion = random.choices(OCCASIONS, weights=[0.10, 0.05, 0.10, 0.15, 0.40, 0.0, 0.10, 0.10])[0]
        else:
            occasion = random.choices(OCCASIONS, weights=[0.30, 0.10, 0.15, 0.15, 0.0, 0.05, 0.10, 0.15])[0]
        
        # Product variant
        produit = random.choices(
            ['Boga Cidre', 'Boga Limoun', 'Boga Pomme', 'Boga Fraise'],
            weights=[0.45, 0.25, 0.20, 0.10]
        )[0]
        
        # Quantity (bottles)
        if occasion in ['repas_famille', 'fete', 'ramadan_ftour']:
            quantite = random.choices([2, 3, 4, 6], weights=[0.2, 0.3, 0.3, 0.2])[0]
        else:
            quantite = random.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
        
        prix_unitaire = 1.8
        montant = round(quantite * prix_unitaire, 2)
        
        # Satisfaction score
        satisfaction = random.choices([3, 4, 5], weights=[0.15, 0.45, 0.40])[0]
        
        # Discovery channel
        decouverte = random.choices(
            ['pub_tv', 'reseaux_sociaux', 'bouche_a_oreille', 'affichage', 'promotion_magasin', 'influenceur'],
            weights=[0.25, 0.20, 0.25, 0.10, 0.12, 0.08]
        )[0]
        
        # Concurrent tried
        concurrent = random.choices(
            ['Coca-Cola', 'Pepsi', 'Fanta', 'Boga', 'Safia', 'Aucun'],
            weights=[0.25, 0.20, 0.15, 0.10, 0.10, 0.20]
        )[0]
        
        milieu = random.choices(['urbain', 'rural'], weights=[0.75, 0.25])[0]
        
        rows.append({
            'id': f'ACH{record_id:05d}',
            'mois': month,
            'produit': produit,
            'region': region,
            'gouvernorat': gouv,
            'tranche_age': age_range,
            'genre': gender,
            'milieu': milieu,
            'canal_achat': channel,
            'occasion': occasion,
            'quantite': quantite,
            'prix_unitaire': prix_unitaire,
            'montant_total': montant,
            'satisfaction': satisfaction,
            'canal_decouverte': decouverte,
            'concurrent_essaye': concurrent,
            'racheterait': 'Oui' if satisfaction >= 4 else random.choice(['Oui', 'Non']),
            'recommande_ami': 'Oui' if satisfaction >= 4 and random.random() > 0.3 else 'Non',
        })
        record_id += 1

# Write CSV
with open(output_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys(), quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} purchase records")
print(f"File: {output_path}")
print(f"Size: {os.path.getsize(output_path)} bytes")

# Quick stats
from collections import Counter
mois_counts = Counter(r['mois'] for r in rows)
age_counts = Counter(r['tranche_age'] for r in rows)
region_counts = Counter(r['region'] for r in rows)
canal_counts = Counter(r['canal_achat'] for r in rows)
produit_counts = Counter(r['produit'] for r in rows)

print(f"\n--- Distribution par mois ---")
for m in MOIS:
    print(f"  {m}: {mois_counts[m]} achats")
print(f"\n--- Distribution par âge ---")
for a in AGE_RANGES:
    print(f"  {a}: {age_counts[a]} ({age_counts[a]*100//len(rows)}%)")
print(f"\n--- Distribution par produit ---")
for p, c in produit_counts.most_common():
    print(f"  {p}: {c} ({c*100//len(rows)}%)")
