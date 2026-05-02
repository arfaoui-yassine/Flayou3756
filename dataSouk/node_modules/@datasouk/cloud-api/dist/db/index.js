import mysql from 'mysql2/promise';
const INIT_STATEMENTS = [
    `
CREATE TABLE IF NOT EXISTS events (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type      VARCHAR(50) NOT NULL,
  commerce_hash   VARCHAR(64) NOT NULL,
  wilaya          VARCHAR(50),
  type_commerce   VARCHAR(50),
  heure           SMALLINT,
  jour_semaine    SMALLINT,
  categories      JSON,
  montant_tranche VARCHAR(20),
  nb_articles     SMALLINT,
  category        VARCHAR(100),
  current_stock   INT NULL,
  threshold       INT NULL,
  received_at     DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_events_wilaya (wilaya),
  KEY idx_events_type (type_commerce),
  KEY idx_events_received (received_at),
  KEY idx_events_heure (heure)
)`,
    `
CREATE TABLE IF NOT EXISTS commerces (
  commerce_hash   VARCHAR(64) PRIMARY KEY,
  api_key         VARCHAR(64) NOT NULL,
  wilaya          VARCHAR(50),
  type_commerce   VARCHAR(50),
  registered_at   DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at    DATETIME(3) NULL,
  UNIQUE KEY uk_commerces_api_key (api_key)
)`,
];
/** DATABASE_URL ex. mysql://user:password@127.0.0.1:3306/datasouk */
export function createPool(databaseUrl) {
    return mysql.createPool(databaseUrl);
}
export async function migrate(pool) {
    for (const sql of INIT_STATEMENTS) {
        await pool.query(sql);
    }
}
//# sourceMappingURL=index.js.map