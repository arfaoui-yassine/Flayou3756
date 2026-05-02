import duckdb
con = duckdb.connect()
csv = r'c:\Users\dongm\OneDrive\Desktop\projet\data\profils_consommateurs.csv'

# Check existing product categories in consumer data
cats = con.execute("""
    SELECT DISTINCT unnest(string_split(categories_achetees, '|')) as cat 
    FROM read_csv_auto(?) ORDER BY cat
""", [csv]).df()
print("=== Categories in consumer data ===")
print(cats.to_string(index=False))

# Check if "boissons" exists
boissons = con.execute("""
    SELECT COUNT(*) as n FROM read_csv_auto(?) 
    WHERE categories_achetees LIKE '%boisson%'
""", [csv]).fetchone()[0]
print(f"\nConsumers with 'boisson' in categories: {boissons}")

# Check alimentation
alim = con.execute("""
    SELECT COUNT(*) as n FROM read_csv_auto(?) 
    WHERE categories_achetees LIKE '%alimentation%'
""", [csv]).fetchone()[0]
print(f"Consumers with 'alimentation': {alim}")

# Check Boga Cidre product data
prod_csv = r'c:\Users\dongm\OneDrive\Desktop\projet\data\produits_tunisiens.csv'
boga = con.execute("""
    SELECT nom_produit, categorie, sous_categorie, prix_tnd, prix_segment,
           age_cible_min, age_cible_max, genre_cible, ses_cible, 
           saison_forte, canal_vente_principal, region_vente_forte
    FROM read_csv_auto(?) WHERE LOWER(nom_produit) LIKE '%boga%'
""", [prod_csv]).df()
print("\n=== Boga products ===")
print(boga.to_string())

# Demographics breakdown of consumers with alimentation
demo = con.execute("""
    SELECT tranche_age, genre, region, COUNT(*) as n
    FROM read_csv_auto(?)
    WHERE categories_achetees LIKE '%alimentation%'
    GROUP BY tranche_age, genre, region
    ORDER BY n DESC LIMIT 15
""", [csv]).df()
print("\n=== Top segments buying alimentation ===")
print(demo.to_string(index=False))
