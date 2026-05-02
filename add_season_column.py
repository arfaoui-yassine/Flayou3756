"""
Add 'season' column to profils_consommateurs.csv
Maps seasonal activity to a primary season preference
"""
import pandas as pd
import numpy as np

# Load CSV
df = pd.read_csv('data/profils_consommateurs.csv')

print(f"Loaded {len(df)} rows")
print(f"Columns before: {df.columns.tolist()}")

# Check if season column already exists
if 'season' in df.columns:
    print("⚠️ Column 'season' already exists, removing it first")
    df = df.drop(columns=['season'])

# Determine primary season based on activity and basket size
def determine_season(row):
    """
    Determine primary season preference based on:
    1. Activity (actif = True)
    2. Basket size (higher = more engaged)
    """
    seasons = []
    
    # Ramadan
    if row.get('ramadan_actif', False):
        seasons.append(('ramadan', row.get('ramadan_panier_tnd', 0)))
    
    # Été (Summer)
    if row.get('ete_actif', False):
        seasons.append(('ete', row.get('ete_panier_tnd', 0)))
    
    # Soldes (Sales)
    if row.get('soldes_actif', False):
        seasons.append(('soldes', row.get('soldes_panier_tnd', 0)))
    
    # If no activity, assign randomly with weights
    if not seasons:
        return np.random.choice(['ramadan', 'ete', 'soldes'], p=[0.4, 0.35, 0.25])
    
    # Return season with highest basket (most engaged)
    seasons.sort(key=lambda x: x[1], reverse=True)
    return seasons[0][0]

# Apply function
print("\nDetermining primary season for each consumer...")
df['season'] = df.apply(determine_season, axis=1)

# Show distribution
print("\n📊 Season distribution:")
season_counts = df['season'].value_counts()
for season, count in season_counts.items():
    pct = (count / len(df)) * 100
    print(f"  {season:10} : {count:,} ({pct:.1f}%)")

# Show sample
print("\n📋 Sample rows:")
print(df[['id', 'tranche_age', 'genre', 'ramadan_actif', 'ete_actif', 'soldes_actif', 'season']].head(10))

# Save
output_path = 'data/profils_consommateurs.csv'
df.to_csv(output_path, index=False)
print(f"\n✅ Saved to {output_path}")
print(f"Total columns: {len(df.columns)}")
print(f"New columns: {df.columns.tolist()[-5:]}")

# Also update JSON if it exists
json_path = 'data/tunisian_consumers_full.json'
try:
    import json
    
    # Convert to records
    records = df.to_dict(orient='records')
    
    # Save JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Also updated {json_path}")
except Exception as e:
    print(f"⚠️ Could not update JSON: {e}")

print("\n🎉 Done! The 'season' column has been added.")
