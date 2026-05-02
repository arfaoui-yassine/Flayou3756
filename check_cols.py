import duckdb
con = duckdb.connect()
cols = con.execute("SELECT * FROM read_csv_auto('data/profils_consommateurs.csv') LIMIT 1").description
for c in cols:
    print(c[0])
